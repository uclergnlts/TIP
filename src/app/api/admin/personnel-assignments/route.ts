import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/session';

export async function GET(request: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        if (!session.isLoggedIn || session.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const sicil = searchParams.get('sicil');

        if (!sicil) {
            return NextResponse.json({ error: 'Sicil is required' }, { status: 400 });
        }

        const query = `
            SELECT 
                a.id, 
                a.status, 
                a.due_date, 
                a.type,
                a.created_at,
                tp.title, 
                tp.description,
                (SELECT COUNT(*) FROM package_tests pt WHERE pt.package_id = tp.id) as question_count
            FROM assignments a
            JOIN test_packages tp ON a.package_id = tp.id
            WHERE a.user_sicil = ?
            ORDER BY a.created_at DESC
        `;

        const result = await db.execute(query, [parseInt(sicil)]);
        return NextResponse.json(result.rows);

    } catch (error) {
        console.error('Error fetching personnel assignments:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
