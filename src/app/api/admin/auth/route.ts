import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData, ADMIN_USERS } from '@/lib/session';

// Admin login endpoint
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json(
                { error: 'Kullanıcı adı ve şifre gereklidir' },
                { status: 400 }
            );
        }

        // Admin kullanıcısını kontrol et
        const admin = ADMIN_USERS[username.toLowerCase()];

        if (!admin || admin.password !== password) {
            return NextResponse.json(
                { error: 'Geçersiz kullanıcı adı veya şifre' },
                { status: 401 }
            );
        }

        // Session oluştur
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        session.isLoggedIn = true;
        session.userType = 'admin';
        session.adminRole = admin.role;
        session.adminName = admin.name;
        await session.save();

        return NextResponse.json({
            success: true,
            user: {
                name: admin.name,
                role: admin.role,
                userType: 'admin'
            }
        });

    } catch (error) {
        console.error('Admin login error:', error);
        return NextResponse.json(
            { error: 'Giriş yapılırken hata oluştu' },
            { status: 500 }
        );
    }
}

// Get admin session
export async function GET() {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

        if (!session.isLoggedIn || session.userType !== 'admin') {
            return NextResponse.json({ isLoggedIn: false, isAdmin: false });
        }

        return NextResponse.json({
            isLoggedIn: true,
            isAdmin: true,
            user: {
                name: session.adminName,
                role: session.adminRole,
                userType: 'admin'
            }
        });
    } catch (error) {
        return NextResponse.json({ isLoggedIn: false, isAdmin: false });
    }
}

// Admin logout
export async function DELETE() {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        session.destroy();

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: true });
    }
}
