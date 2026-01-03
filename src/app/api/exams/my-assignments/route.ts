import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/session';

export async function GET() {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        if (!session.isLoggedIn || !session.sicil) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const query = `
            SELECT 
                a.id, 
                a.status, 
                a.due_date, 
                a.type,
                tp.title, 
                tp.description,
                COUNT(pt.test_id) as question_count
            FROM assignments a
            JOIN test_packages tp ON a.package_id = tp.id
            LEFT JOIN package_tests pt ON tp.id = pt.package_id
            WHERE a.user_sicil = ?
            GROUP BY a.id
            ORDER BY a.created_at DESC
        `;

        const result = await db.execute(query, [session.sicil]);
        return NextResponse.json(result.rows);

    } catch (error) {
        console.error('Error fetching assignments:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
