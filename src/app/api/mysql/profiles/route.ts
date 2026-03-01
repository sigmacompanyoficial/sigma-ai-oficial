import { NextResponse } from 'next/server';
import pool from '@/lib/mysql';

type ProfilePayload = {
    id?: string;
    full_name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
    role?: string | null;
    username?: string | null;
};

export async function POST(req: Request) {
    try {
        const profile = await req.json() as ProfilePayload;
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
    } catch (error: unknown) {
        console.error('MySQL Profile Sync Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
