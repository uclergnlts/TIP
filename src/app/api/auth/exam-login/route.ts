import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/session';

export async function POST(request: NextRequest) {
    try {
        const { sicil, code } = await request.json();

        if (!sicil || !code) {
            return NextResponse.json({ error: 'Sicil ve Kod gereklidir.' }, { status: 400 });
        }

        // 1. Find Valid Token
        const result = await db.execute({
            sql: `
                SELECT * FROM login_tokens 
                WHERE user_sicil = ? AND code = ? AND is_used = 0 AND expires_at > ?
            `,
            args: [sicil, code, new Date().toISOString()]
        });

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Geçersiz veya süresi dolmuş kod.' }, { status: 401 });
        }

        const token = result.rows[0];

        // 2. Mark Token as Used (Single use?)
        // Prompt said "Tek giriş = tüm aktif atamalar". 
        // We will mark it used OR keep it valid for the session duration?
        // Prompt says "Tek kullanımlık". So we mark it used and create a session.

        await db.execute('UPDATE login_tokens SET is_used = 1 WHERE code = ?', [code]);

        // 3. Create Session
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

        // Fetch user details for the session
        const userRes = await db.execute('SELECT * FROM personnel WHERE sicil = ?', [sicil]);
        const user = userRes.rows[0] as any;

        session.isLoggedIn = true;
        session.userType = 'personnel'; // Or 'exam_user'
        session.sicil = sicil;
        session.adSoyad = user ? user.ad_soyad : 'Personel';

        await session.save();

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Exam Login Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
