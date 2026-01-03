import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/session';
import type { Personnel } from '@/types';

// Login endpoint
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sicil, soyad } = body;

        if (!sicil || !soyad) {
            return NextResponse.json(
                { error: 'Sicil numarası ve soyad gereklidir' },
                { status: 400 }
            );
        }

        // Personeli bul
        const result = await db.execute('SELECT * FROM personnel WHERE sicil = ?', [parseInt(sicil)]);
        const personnel = result.rows[0] as unknown as Personnel | undefined;

        if (!personnel) {
            return NextResponse.json(
                { error: 'Personel bulunamadı' },
                { status: 401 }
            );
        }

        // Soyadı kontrol et (büyük/küçük harf duyarsız, Türkçe karakter uyumlu)
        const personnelSoyad = personnel.ad_soyad.split(' ').pop()?.toLocaleLowerCase('tr-TR') || '';
        const inputSoyad = soyad.toLocaleLowerCase('tr-TR').trim();

        if (personnelSoyad !== inputSoyad) {
            return NextResponse.json(
                { error: 'Soyad eşleşmiyor' },
                { status: 401 }
            );
        }

        // Session oluştur
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        session.isLoggedIn = true;
        session.userType = 'personnel';
        session.sicil = personnel.sicil;
        session.adSoyad = personnel.ad_soyad;
        await session.save();

        return NextResponse.json({
            success: true,
            user: {
                sicil: personnel.sicil,
                adSoyad: personnel.ad_soyad,
                userType: 'personnel'
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Giriş yapılırken hata oluştu' },
            { status: 500 }
        );
    }
}

// Get current session
export async function GET() {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

        if (!session.isLoggedIn) {
            return NextResponse.json({ isLoggedIn: false });
        }

        return NextResponse.json({
            isLoggedIn: true,
            user: {
                sicil: session.sicil,
                adSoyad: session.adSoyad,
                userType: session.userType
            }
        });
    } catch (error) {
        return NextResponse.json({ isLoggedIn: false });
    }
}

// Logout
export async function DELETE() {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        session.destroy();

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: true });
    }
}
