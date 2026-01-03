import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/session';


interface PackageTestRow {
    id: number;
    has_threat: number; // SQLite boolean is 0/1
    threat_type: string | null;
    coordinate_x: number;
    coordinate_y: number;
    threat_polygon: string | null;
}

// Ray Casting Algorithm to check if a point is inside a polygon
function isPointInPolygon(point: { x: number, y: number }, polygon: { x: number, y: number }[]) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;

        const intersect = ((yi > point.y) !== (yj > point.y))
            && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        if (!session.isLoggedIn || !session.sicil) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const assignmentId = id;
        const { answers } = await request.json();

        const assignmentRes = await db.execute('SELECT package_id FROM assignments WHERE id = ?', [assignmentId]);
        const packageId = (assignmentRes.rows[0] as unknown as { package_id: number })?.package_id;

        const correctAnswersRes = await db.execute(`
            SELECT t.* 
            FROM package_tests pt
            JOIN tests t ON pt.test_id = t.id
            WHERE pt.package_id = ?
        `, [packageId]);

        const correctMap = new Map<number, PackageTestRow>();
        correctAnswersRes.rows.forEach((row) => correctMap.set((row as unknown as PackageTestRow).id, row as unknown as PackageTestRow));

        let correctCount = 0;

        for (const userAns of answers) {
            const truth = correctMap.get(userAns.test_id);
            if (!truth) continue;

            let isCorrect = false;
            let distance = 0; // Default distance, relevant only for point mode

            if (truth.has_threat === 0) {
                if (userAns.user_choice === 'clean') isCorrect = true;
            } else {
                if (userAns.user_choice === truth.threat_type) {
                    if (userAns.user_click_x != null && userAns.user_click_y != null) {
                        const userPoint = { x: userAns.user_click_x, y: userAns.user_click_y };

                        // Check if Polygon Mode
                        const polygon = truth.threat_polygon ? JSON.parse(truth.threat_polygon) : null;

                        if (polygon && Array.isArray(polygon) && polygon.length >= 3) {
                            // Polygon Hit Test
                            if (isPointInPolygon(userPoint, polygon)) {
                                isCorrect = true;
                                distance = 0; // Inside polygon is considered perfect hit
                            } else {
                                // Calculate distance to nearest polygon point? Or just leave huge?
                                // Let's simplify: if outside, incorrect. Distance doesn't matter much for stats if incorrect.
                                distance = 1;
                            }
                        } else {
                            // Point Mode (Legacy)
                            const dx = userAns.user_click_x - truth.coordinate_x;
                            const dy = userAns.user_click_y - truth.coordinate_y;
                            distance = Math.sqrt(dx * dx + dy * dy);
                            if (distance <= 0.05) isCorrect = true;
                        }
                    }
                }
            }

            if (isCorrect) correctCount++;

            await db.execute(`
                INSERT INTO attempts (assignment_id, test_id, user_click_x, user_click_y, user_choice, is_correct, distance_score, duration_seconds)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                assignmentId,
                userAns.test_id,
                userAns.user_click_x,
                userAns.user_click_y,
                userAns.user_choice,
                isCorrect ? 1 : 0,
                distance,
                userAns.duration_seconds
            ]);
        }

        const score = (correctCount / answers.length) * 100;

        await db.execute(`
            UPDATE assignments 
            SET status = 'completed', completed_at = CURRENT_TIMESTAMP, score = ?
            WHERE id = ?
        `, [score, assignmentId]);

        return NextResponse.json({ success: true, score });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
