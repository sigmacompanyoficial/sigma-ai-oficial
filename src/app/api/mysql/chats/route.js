import { NextResponse } from 'next/server';
import pool from '@/lib/mysql';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    try {
        const [rows] = await pool.execute(
            'SELECT * FROM chats WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        return NextResponse.json(rows);
    } catch (error) {
        console.error('MySQL Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const { userId, title } = await req.json();

        if (!userId || !title) {
            return NextResponse.json({ error: 'userId and title are required' }, { status: 400 });
        }

        const id = uuidv4();
        await pool.execute(
            'INSERT INTO chats (id, user_id, title) VALUES (?, ?, ?)',
            [id, userId, title]
        );

        return NextResponse.json({ id, userId, title });
    } catch (error) {
        console.error('MySQL Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
