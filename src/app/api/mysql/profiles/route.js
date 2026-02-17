import { NextResponse } from 'next/server';
import pool from '@/lib/mysql';

export async function POST(req) {
    try {
        const profile = await req.json();
        const { id, full_name, email, avatar_url, role, username } = profile;

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        // Upsert logic for MySQL
        await pool.execute(`
            INSERT INTO profiles (id, full_name, email, avatar_url, role, username)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                full_name = VALUES(full_name),
                email = VALUES(email),
                avatar_url = VALUES(avatar_url),
                role = VALUES(role),
                username = VALUES(username)
        `, [id, full_name, email, avatar_url, role, username]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('MySQL Profile Sync Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
