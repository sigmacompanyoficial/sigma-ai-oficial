import { NextResponse } from 'next/server';
import pool from '@/lib/mysql';
import { createClient } from '@supabase/supabase-js';

// Usamos el Service Role Key si es posible para saltarnos RLS, 
// pero por ahora usaremos la Anon Key ya que es la que tenemos en el .env
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
    try {
        console.log('🚀 Iniciando migración de Supabase a MySQL...');

        // 0. Crear tablas si no existen
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS profiles (
                id VARCHAR(36) PRIMARY KEY,
                full_name TEXT,
                username VARCHAR(255) UNIQUE,
                email VARCHAR(255) UNIQUE,
                avatar_url TEXT,
                role VARCHAR(50) DEFAULT 'user',
                how_known TEXT,
                usage_intent TEXT,
                onboarding_completed TINYINT(1) DEFAULT 0,
                total_messages INT DEFAULT 0,
                total_tokens INT DEFAULT 0,
                settings JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS chats (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                title TEXT,
                is_archived TINYINT(1) DEFAULT 0,
                is_shared TINYINT(1) DEFAULT 0,
                settings JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS messages (
                id VARCHAR(36) PRIMARY KEY,
                chat_id VARCHAR(36) NOT NULL,
                role VARCHAR(20) NOT NULL,
                content LONGTEXT,
                image LONGTEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Asegurar que la columna 'image' es LONGTEXT por si ya se creó como TEXT
        try {
            await pool.execute(`ALTER TABLE messages MODIFY COLUMN image LONGTEXT`);
            console.log('✅ Columna image ampliada a LONGTEXT.');
        } catch (e) {
            console.log('ℹ️ No se pudo modificar la columna image (quizás ya es LONGTEXT).');
        }

        console.log('✅ Tablas verificadas/creadas.');

        // 1. Migrar Perfiles
        const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
        if (pError) throw pError;

        for (const p of profiles) {
            await pool.execute(`
                INSERT INTO profiles (id, full_name, username, email, avatar_url, role, how_known, usage_intent, onboarding_completed, total_messages, total_tokens, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), role=VALUES(role)
            `, [
                p.id, p.full_name, p.username, p.email, p.avatar_url,
                p.role || 'normal', p.how_known, p.usage_intent,
                p.onboarding_completed ? 1 : 0, p.total_messages || 0,
                p.total_tokens || 0, p.created_at
            ]);
        }
        console.log(`✅ ${profiles.length} perfiles migrados.`);

        // 2. Migrar Chats
        const { data: chats, error: cError } = await supabase.from('chats').select('*');
        if (cError) throw cError;

        for (const c of chats) {
            await pool.execute(`
                INSERT INTO chats (id, user_id, title, is_shared, created_at)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE title=VALUES(title)
            `, [c.id, c.user_id, c.title, c.is_shared ? 1 : 0, c.created_at]);
        }
        console.log(`✅ ${chats.length} chats migrados.`);

        // 3. Migrar Mensajes
        const { data: messages, error: mError } = await supabase.from('messages').select('*');
        if (mError) throw mError;

        for (const m of messages) {
            await pool.execute(`
                INSERT INTO messages (id, chat_id, role, content, image, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE content=VALUES(content)
            `, [m.id, m.chat_id, m.role, m.content, m.image, m.created_at]);
        }
        console.log(`✅ ${messages.length} mensajes migrados.`);

        return NextResponse.json({
            success: true,
            summary: {
                profiles: profiles.length,
                chats: chats.length,
                messages: messages.length
            }
        });

    } catch (error) {
        console.error('❌ Error en migración:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
