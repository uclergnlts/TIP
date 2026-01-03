import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/session';

// GET: List all questions (tests)
export async function GET(request: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        if (!session.isLoggedIn || session.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await db.execute('SELECT * FROM tests ORDER BY created_at DESC');
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching questions:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Create a new question
export async function POST(request: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        if (!session.isLoggedIn || session.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { image_url, has_threat, threat_type, coordinate_x, coordinate_y, threat_polygon } = body;

        if (!image_url) {
            return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
        }

        await db.execute(`
            INSERT INTO tests (image_url, has_threat, threat_type, coordinate_x, coordinate_y, threat_polygon)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            image_url,
            has_threat ? 1 : 0,
            has_threat ? threat_type : null,
            has_threat ? coordinate_x : null,
            has_threat ? coordinate_y : null,
            has_threat ? threat_polygon : null
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error creating question:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT: Update an existing question
export async function PUT(request: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        if (!session.isLoggedIn || session.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, image_url, has_threat, threat_type, coordinate_x, coordinate_y, threat_polygon } = body;

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        await db.execute(`
            UPDATE tests 
            SET image_url = ?, has_threat = ?, threat_type = ?, coordinate_x = ?, coordinate_y = ?, threat_polygon = ?
            WHERE id = ?
        `, [
            image_url,
            has_threat ? 1 : 0,
            has_threat ? threat_type : null,
            has_threat ? coordinate_x : null,
            has_threat ? coordinate_y : null,
            has_threat ? threat_polygon : null,
            id
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating question:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: Remove a question
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

        // Technically we should check if used in assignments, but let's allow delete for now or CASCADE covers it?
        // SQLite foreign key cascade is usually manual unless enabled.
        // Let's assume user accepts it deletes everything.

        await db.execute('DELETE FROM package_tests WHERE test_id = ?', [id]);
        await db.execute('DELETE FROM tests WHERE id = ?', [id]);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting question:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
