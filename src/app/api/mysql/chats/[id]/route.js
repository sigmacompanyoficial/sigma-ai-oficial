import { NextResponse } from 'next/server';
import pool from '@/lib/mysql';

export async function GET(req, { params }) {
    const { id } = params;

    try {
        const [chatRows] = await pool.execute('SELECT * FROM chats WHERE id = ?', [id]);
        if (chatRows.length === 0) {
            return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
        }

        const [messageRows] = await pool.execute(
            'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC',
            [id]
        );

        const chat = chatRows[0];
        chat.messages = messageRows;

        return NextResponse.json(chat);
    } catch (error) {
        console.error('MySQL Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    const { id } = params;

    try {
        await pool.execute('DELETE FROM chats WHERE id = ?', [id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('MySQL Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req, { params }) {
    const { id } = params;
    try {
        const { is_archived, is_shared } = await req.json();

        if (is_archived !== undefined) {
            await pool.execute('UPDATE chats SET is_archived = ? WHERE id = ?', [is_archived ? 1 : 0, id]);
        }
        if (is_shared !== undefined) {
            await pool.execute('UPDATE chats SET is_shared = ? WHERE id = ?', [is_shared ? 1 : 0, id]);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('MySQL Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
