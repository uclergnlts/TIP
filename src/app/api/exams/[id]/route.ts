import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/session';

// GET: Fetch exam data (questions)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        if (!session.isLoggedIn || !session.sicil) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const assignmentId = id;

        const assignmentRes = await db.execute(
            'SELECT * FROM assignments WHERE id = ? AND user_sicil = ?',
            [assignmentId, session.sicil]
        );

        if (assignmentRes.rows.length === 0) {
            return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
        }

        const assignment = assignmentRes.rows[0] as any;
        if (assignment.status === 'completed') {
            return NextResponse.json({ error: 'Already completed' }, { status: 400 });
        }

        const questionsRes = await db.execute(`
            SELECT 
                t.id
            FROM package_tests pt
            JOIN tests t ON pt.test_id = t.id
            WHERE pt.package_id = ?
            ORDER BY pt.order_index ASC
        `, [assignment.package_id]);

        return NextResponse.json({
            assignment,
            questions: questionsRes.rows
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
