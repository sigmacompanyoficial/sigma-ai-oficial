import { NextResponse } from 'next/server';
import pool from '@/lib/mysql';

export async function GET(req) {
    try {
        // Query to get chats and ideally owner info. 
        // Since profiles are in Supabase, we might have to fetch them separately or if mirrored in MySQL, join them.
        // For now, let's try to join with MySQL profiles if they exist.
        const [rows] = await pool.execute(`
            SELECT c.*, p.full_name, p.email 
            FROM chats c 
            LEFT JOIN profiles p ON c.user_id = p.id 
            ORDER BY c.created_at DESC 
            LIMIT 100
        `);

        // Map rows to match the format expected by the frontend
        const activity = rows.map(row => ({
            id: row.id,
            title: row.title,
            created_at: row.created_at,
            user_id: row.user_id,
            profiles: {
                full_name: row.full_name || 'Desconocido',
                email: row.email || ''
            }
        }));

        return NextResponse.json(activity);
    } catch (error) {
        console.error('MySQL Admin Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message,
            code: error.code
        }, { status: 500 });
    }
}
