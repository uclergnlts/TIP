import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData, ROLE_PERMISSIONS } from '@/lib/session';

// Korunan rotalar ve gerekli yetkiler
const PROTECTED_ROUTES = {
    '/dashboard': { requiresAdmin: true, permission: 'canViewDashboard' },
    '/personel': { requiresAdmin: true, permission: 'canViewPersonnel' },
    '/upload': { requiresAdmin: true, permission: 'canUploadData' },
};

// Herkesin erişebildiği rotalar
const PUBLIC_ROUTES = ['/giris', '/admin', '/api'];

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Public routes - herkes erişebilir
    if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // /benim sayfası - personnel login gerekli
    if (pathname.startsWith('/benim')) {
        // Session kontrolü
        const sessionCookie = request.cookies.get('tip-session');
        if (!sessionCookie) {
            return NextResponse.redirect(new URL('/giris', request.url));
        }
        return NextResponse.next();
    }

    // Personel detay sayfaları - admin login gerekli
    if (pathname.startsWith('/personel/')) {
        const sessionCookie = request.cookies.get('tip-session');
        if (!sessionCookie) {
            return NextResponse.redirect(new URL('/admin', request.url));
        }
        return NextResponse.next();
    }

    // Ana sayfa ve diğer korunan rotalar - admin login gerekli
    const protectedRoute = Object.entries(PROTECTED_ROUTES).find(([route]) =>
        pathname === route || (route !== '/' && pathname.startsWith(route))
    );

    if (protectedRoute) {
        const sessionCookie = request.cookies.get('tip-session');
        if (!sessionCookie) {
            // Admin login sayfasına yönlendir
            return NextResponse.redirect(new URL('/admin', request.url));
        }
        // Session var ama kontrol server-side yapılmalı
        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/personel/:path*',
        '/upload/:path*',
        '/benim/:path*',
    ],
};
