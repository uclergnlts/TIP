'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { AdminRole } from '@/lib/session';

interface AuthContextType {
    isLoggedIn: boolean;
    isAdmin: boolean;
    userType: 'personnel' | 'admin' | null;
    adminRole: AdminRole | null;
    userName: string | null;
    sicil: number | null;
    loading: boolean;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    isLoggedIn: false,
    isAdmin: false,
    userType: null,
    adminRole: null,
    userName: null,
    sicil: null,
    loading: true,
    logout: async () => { },
    checkAuth: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userType, setUserType] = useState<'personnel' | 'admin' | null>(null);
    const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [sicil, setSicil] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    const router = useRouter();
    const pathname = usePathname();

    const checkAuth = async () => {
        try {
            // Admin auth kontrolü
            const adminRes = await fetch('/api/admin/auth');
            const adminData = await adminRes.json();

            if (adminData.isLoggedIn && adminData.isAdmin) {
                setIsLoggedIn(true);
                setIsAdmin(true);
                setUserType('admin');
                setAdminRole(adminData.user?.role || null);
                setUserName(adminData.user?.name || null);
                setSicil(null);
                setLoading(false);
                return;
            }

            // Personnel auth kontrolü
            const authRes = await fetch('/api/auth');
            const authData = await authRes.json();

            if (authData.isLoggedIn) {
                setIsLoggedIn(true);
                setIsAdmin(false);
                setUserType('personnel');
                setAdminRole(null);
                setUserName(authData.user?.adSoyad || null);
                setSicil(authData.user?.sicil || null);
            } else {
                setIsLoggedIn(false);
                setIsAdmin(false);
                setUserType(null);
                setAdminRole(null);
                setUserName(null);
                setSicil(null);
            }
        } catch (error) {
            console.error('Auth check error:', error);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            if (isAdmin) {
                await fetch('/api/admin/auth', { method: 'DELETE' });
            } else {
                await fetch('/api/auth', { method: 'DELETE' });
            }

            setIsLoggedIn(false);
            setIsAdmin(false);
            setUserType(null);
            setAdminRole(null);
            setUserName(null);
            setSicil(null);

            router.push('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    useEffect(() => {
        checkAuth();
    }, [pathname]);

    return (
        <AuthContext.Provider value={{
            isLoggedIn,
            isAdmin,
            userType,
            adminRole,
            userName,
            sicil,
            loading,
            logout,
            checkAuth,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
