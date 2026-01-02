'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Upload, Users, LogIn, LogOut, Shield, User, Menu, X } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useState } from 'react';

export function Navigation() {
    const pathname = usePathname();
    const { isLoggedIn, isAdmin, adminRole, userName, sicil, loading, logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Hide nav on login pages
    const hideNav = pathname === '/giris' || pathname === '/admin';
    if (hideNav) return null;

    const navLinks = [
        { href: '/', label: 'Dashboard', icon: BarChart3 },
        { href: '/personel', label: 'Personel', icon: Users },
        { href: '/gruplar', label: 'Gruplar', icon: BarChart3 },
    ];

    if (adminRole === 'manager') {
        navLinks.push({ href: '/upload', label: 'Veri Yükle', icon: Upload });
    }

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-slate-900/90 backdrop-blur-xl">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href={isAdmin ? '/' : '/benim'} className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <BarChart3 className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-bold text-lg hidden sm:block">TIP Analiz</span>
                            <span className="font-bold text-lg sm:hidden">TIP</span>
                        </Link>

                        {/* Desktop Admin Navigation */}
                        {isAdmin && (
                            <div className="hidden md:flex items-center gap-6">
                                {navLinks.map(link => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`flex items-center gap-2 text-sm transition-colors ${pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
                                            ? 'text-white'
                                            : 'text-slate-300 hover:text-white'
                                            }`}
                                    >
                                        <link.icon className="h-4 w-4" />
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {loading ? (
                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : isLoggedIn ? (
                            <>
                                {/* User Info Badge */}
                                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-white/10">
                                    {isAdmin ? (
                                        <Shield className="h-4 w-4 text-amber-400" />
                                    ) : (
                                        <User className="h-4 w-4 text-blue-400" />
                                    )}
                                    <span className="text-sm text-slate-300 max-w-[100px] truncate">
                                        {userName || (sicil ? `Sicil: ${sicil}` : 'Kullanıcı')}
                                    </span>
                                </div>

                                {/* Logout Button */}
                                <button
                                    onClick={logout}
                                    className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-medium transition-all"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span>Çıkış</span>
                                </button>

                                {/* Mobile Menu Button */}
                                {isAdmin && (
                                    <button
                                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                        className="md:hidden p-2 text-slate-300 hover:text-white"
                                    >
                                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/admin"
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-sm font-medium transition-all"
                                >
                                    <Shield className="h-4 w-4" />
                                    <span className="hidden sm:inline">Amir</span>
                                </Link>
                                <Link
                                    href="/giris"
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-sm font-medium transition-all"
                                >
                                    <LogIn className="h-4 w-4" />
                                    <span className="hidden sm:inline">Personel</span>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isAdmin && mobileMenuOpen && (
                <div className="md:hidden border-t border-white/10 bg-slate-900">
                    <div className="px-4 pt-2 pb-4 space-y-1">
                        <div className="px-3 py-2 flex items-center justify-between mb-2 border-b border-white/5 pb-2">
                            <span className="text-sm text-slate-400">{userName}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                                {adminRole === 'manager' ? 'Müdür' : 'Supervisor'}
                            </span>
                        </div>
                        {navLinks.map(link => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <link.icon className="h-5 w-5" />
                                {link.label}
                            </Link>
                        ))}
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-slate-800 hover:text-rose-300 transition-colors mt-2"
                        >
                            <LogOut className="h-5 w-5" />
                            Çıkış Yap
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}
