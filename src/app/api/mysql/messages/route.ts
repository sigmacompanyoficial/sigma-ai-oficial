// @ts-nocheck
import { NextResponse } from 'next/server';
import pool from '@/lib/mysql';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req) {
    try {
        const { chatId, role, content, image } = await req.json();

        if (!chatId || !role || (!content && !image)) {
            return NextResponse.json({ error: 'chatId, role, and either content or image are required' }, { status: 400 });
        }

        const id = uuidv4();
        await pool.execute(
            'INSERT INTO messages (id, chat_id, role, content, image) VALUES (?, ?, ?, ?, ?)',
            [id, chatId, role, content, image || null]
        );

        return NextResponse.json({ id, chatId, role, content, image });
    } catch (error) {
        console.error('MySQL Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
