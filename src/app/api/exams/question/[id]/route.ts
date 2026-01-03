
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/session';
import { THREAT_TYPES } from '@/lib/constants';

// Helper to shuffle array
function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

interface TestRow {
    id: number;
    image_url: string;
    has_threat: number; // SQLite returns number for boolean
    threat_type: string | null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        if (!session.isLoggedIn || !session.sicil) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: questionId } = await params;

        const res = await db.execute('SELECT id, image_url, has_threat, threat_type FROM tests WHERE id = ?', [questionId]);

        if (res.rows.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const question = res.rows[0] as unknown as TestRow;
        const hasThreat = question.has_threat === 1;
        const realType = question.threat_type;

        let selectedOptions: typeof THREAT_TYPES = [];

        if (hasThreat && realType) {
            // Find correct option
            const correctOption = THREAT_TYPES.find(t => t.id === realType);
            if (correctOption) {
                selectedOptions.push(correctOption);
            }

            // Pick 3 distractors
            const distractors = THREAT_TYPES.filter(t => t.id !== realType);
            const randomDistractors = shuffleArray([...distractors]).slice(0, 3);
            selectedOptions = [...selectedOptions, ...randomDistractors];
        } else {
            // If clean or unknown, pick 4 random
            selectedOptions = shuffleArray([...THREAT_TYPES]).slice(0, 4);
        }

        // Shuffle final list so correct answer isn't always first
        const finalOptions = shuffleArray(selectedOptions);

        return NextResponse.json({
            id: question.id,
            image_url: question.image_url,
            options: finalOptions
        });

    } catch (error) {
        console.error('Error fetching question:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
