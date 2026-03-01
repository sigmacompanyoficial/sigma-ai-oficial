import { NextResponse } from 'next/server';
import pool from '@/lib/mysql';
import type { RowDataPacket } from 'mysql2';

type ChatRow = RowDataPacket & {
    id: string;
    user_id: string;
    title: string;
};

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    void req;
    const { id } = await params;

    try {
        const [chatRows] = await pool.execute<ChatRow[]>('SELECT * FROM chats WHERE id = ?', [id]);
        if (chatRows.length === 0) {
            return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
        }

        const [messageRows] = await pool.execute<RowDataPacket[]>(
            'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC',
            [id]
        );

        const chat = { ...chatRows[0], messages: messageRows };

        return NextResponse.json(chat);
    } catch (error: unknown) {
        console.error('MySQL Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    void req;
    const { id } = await params;

    try {
        await pool.execute('DELETE FROM chats WHERE id = ?', [id]);
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('MySQL Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const { is_archived, is_shared } = await req.json() as { is_archived?: boolean; is_shared?: boolean };

        if (is_archived !== undefined) {
            await pool.execute('UPDATE chats SET is_archived = ? WHERE id = ?', [is_archived ? 1 : 0, id]);
        }
        if (is_shared !== undefined) {
            await pool.execute('UPDATE chats SET is_shared = ? WHERE id = ?', [is_shared ? 1 : 0, id]);
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('MySQL Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
