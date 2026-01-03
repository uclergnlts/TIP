import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/session';

// GET: List all packages
export async function GET(request: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        if (!session.isLoggedIn || session.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch packages with question count
        const query = `
            SELECT 
                tp.*,
                COUNT(pt.test_id) as question_count
            FROM test_packages tp
            LEFT JOIN package_tests pt ON tp.id = pt.package_id
            GROUP BY tp.id
            ORDER BY tp.created_at DESC
        `;
        const result = await db.execute(query);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching packages:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Create a new package
export async function POST(request: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        if (!session.isLoggedIn || session.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, description, difficulty_level, selected_test_ids } = body; // selected_test_ids is array of numbers

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        // 1. Create Package
        const packageResult = await db.execute(`
            INSERT INTO test_packages (title, description, difficulty_level)
            VALUES (?, ?, ?)
            RETURNING id
        `, [title, description, difficulty_level]);

        const packageId = packageResult.rows[0].id;

        // 2. Add Questions (if any)
        if (selected_test_ids && Array.isArray(selected_test_ids) && selected_test_ids.length > 0) {
            for (let i = 0; i < selected_test_ids.length; i++) {
                const testId = selected_test_ids[i];
                await db.execute(`
                    INSERT INTO package_tests (package_id, test_id, order_index)
                    VALUES (?, ?, ?)
                `, [packageId, testId, i]);
            }
        }

        return NextResponse.json({ success: true, id: packageId });

    } catch (error) {
        console.error('Error creating package:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: Remove a package
export async function DELETE(request: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        if (!session.isLoggedIn || session.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        // Clean up linked questions first (cascade logically)
        await db.execute('DELETE FROM package_tests WHERE package_id = ?', [id]);
        await db.execute('DELETE FROM test_packages WHERE id = ?', [id]);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting package:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
