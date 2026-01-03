import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/session';

function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

interface PersonnelStats {
    sicil: number;
    ad_soyad: string;
    basari_orani: number;
    ay: string;
}

// GET: List Personnel categorized
export async function GET() {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        if (!session.isLoggedIn || session.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const personnelQuery = `
            SELECT 
                p.sicil, 
                p.ad_soyad, 
                ms.basari_orani,
                ms.ay
            FROM personnel p
            JOIN monthly_stats ms ON p.sicil = ms.sicil
            WHERE ms.ay = (SELECT MAX(ay) FROM monthly_stats)
            ORDER BY ms.basari_orani ASC
        `;

        const result = await db.execute(personnelQuery);
        const personnel = result.rows as unknown as PersonnelStats[];

        const classified = {
            red: personnel.filter((p) => p.basari_orani < 75),
            yellow: personnel.filter((p) => p.basari_orani >= 75 && p.basari_orani < 85),
            green: personnel.filter((p) => p.basari_orani >= 85)
        };

        return NextResponse.json(classified);
    } catch (error) {
        console.error('Error fetching classified personnel:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Assign Package (Manual or Auto)
export async function POST(request: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        if (!session.isLoggedIn || session.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        let { package_id, sicil_list, type, due_date, is_auto } = body;

        if ((!package_id && !is_auto) || !sicil_list || sicil_list.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Logic for Auto-Assignment
        if (is_auto) {
            // 1. Pick 20 random questions
            const randomResult = await db.execute('SELECT id FROM tests ORDER BY RANDOM() LIMIT 20');
            const questions = randomResult.rows;

            if (questions.length === 0) {
                return NextResponse.json({ error: 'Sistemde yeterli soru yok.' }, { status: 400 });
            }

            // 2. Create a new Package
            const pkgTitle = `Otomatik Sınav - ${new Date().toLocaleDateString('tr-TR')}`;
            const pkgRes = await db.execute(`
                INSERT INTO test_packages (title, description, difficulty_level)
                VALUES (?, 'Sistem tarafından otomatik oluşturuldu.', 'medium')
                RETURNING id
            `, [pkgTitle]);

            package_id = pkgRes.rows[0].id; // Assign the new package ID

            // 3. Link questions to package
            for (let i = 0; i < questions.length; i++) {
                await db.execute(`
                    INSERT INTO package_tests (package_id, test_id, order_index)
                    VALUES (?, ?, ?)
                `, [package_id, questions[i].id, i]);
            }
        }

        const assignments = [];
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 72); // 72 hours validity

        for (const sicil of sicil_list) {
            await db.execute(`
                INSERT INTO assignments (user_sicil, package_id, assigned_by, type, due_date, status)
                VALUES (?, ?, ?, ?, ?, 'pending')
            `, [sicil, package_id, session.adminName || 'Admin', type, due_date]);

            // Generate Token
            const code = generateCode();
            await db.execute(`
                INSERT INTO login_tokens (code, user_sicil, expires_at)
                VALUES (?, ?, ?)
            `, [code, sicil, expiresAt.toISOString()]);

            assignments.push({ sicil, code });
        }

        return NextResponse.json({ success: true, assignments });

    } catch (error) {
        console.error('Error creating assignments:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
