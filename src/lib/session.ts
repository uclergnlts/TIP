import { SessionOptions } from 'iron-session';

export type AdminRole = 'supervisor' | 'manager';

export interface SessionData {
    isLoggedIn: boolean;
    userType: 'personnel' | 'admin';
    sicil?: number;
    adSoyad?: string;
    adminRole?: AdminRole;
    adminName?: string;
}

export const sessionOptions: SessionOptions = {
    password: process.env.SESSION_SECRET || 'tip-xray-performans-sistemi-gizli-anahtar-2024',
    cookieName: 'tip-session',
    cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 saat
    },
};

export const defaultSession: SessionData = {
    isLoggedIn: false,
    userType: 'personnel',
};

// Admin kullanıcıları (gerçek uygulamada veritabanından gelir)
export const ADMIN_USERS: Record<string, { password: string; role: AdminRole; name: string }> = {
    'supervisor': { password: 'tip2024', role: 'supervisor', name: 'Süpervizör' },
    'mudur': { password: 'mudur2024', role: 'manager', name: 'Güvenlik Müdürü' },
    'admin': { password: 'admin2024', role: 'manager', name: 'Sistem Yöneticisi' },
};

// Role yetkileri
export const ROLE_PERMISSIONS = {
    supervisor: {
        canViewDashboard: true,
        canViewPersonnel: true,
        canUploadData: false,
        canDownloadReports: true,
    },
    manager: {
        canViewDashboard: true,
        canViewPersonnel: true,
        canUploadData: true,
        canDownloadReports: true,
    },
};
