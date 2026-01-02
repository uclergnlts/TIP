'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Users, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

export default function LandingPage() {
  const { isLoggedIn, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isLoggedIn) {
      if (isAdmin) {
        router.push('/dashboard');
      } else {
        router.push('/benim');
      }
    }
  }, [isLoggedIn, isAdmin, loading, router]);

  if (loading) return null; // Or a loading spinner
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">TIP Performans Sistemi</h1>
        <p className="text-slate-400 text-lg">Lütfen giriş yapmak istediğiniz rolü seçiniz</p>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">

        {/* Personel Girişi */}
        <Link
          href="/giris"
          className="group relative p-8 rounded-3xl bg-slate-900/50 border border-white/10 hover:border-blue-500/50 transition-all duration-300 hover:transform hover:-translate-y-1"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
          <div className="flex flex-col items-center text-center">
            <div className="h-20 w-20 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Users className="h-10 w-10 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Personel Girişi</h2>
            <p className="text-slate-400">Performans sonuçlarınızı görüntülemek için personel girişi yapın.</p>
          </div>
        </Link>

        {/* Supervisor Girişi */}
        <Link
          href="/admin"
          className="group relative p-8 rounded-3xl bg-slate-900/50 border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:-translate-y-1"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
          <div className="flex flex-col items-center text-center">
            <div className="h-20 w-20 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <ShieldCheck className="h-10 w-10 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Supervisor Girişi</h2>
            <p className="text-slate-400">Ekip performansını izlemek ve raporlamak için supervisor girişi yapın.</p>
          </div>
        </Link>

        {/* Müdür Girişi */}
        <Link
          href="/admin"
          className="group relative p-8 rounded-3xl bg-slate-900/50 border border-white/10 hover:border-emerald-500/50 transition-all duration-300 hover:transform hover:-translate-y-1"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
          <div className="flex flex-col items-center text-center">
            <div className="h-20 w-20 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <ShieldAlert className="h-10 w-10 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Müdür Girişi</h2>
            <p className="text-slate-400">Genel analizler ve yönetim paneli için müdür girişi yapın.</p>
          </div>
        </Link>

      </div>

      <div className="mt-12 text-slate-500 text-sm">
        © 2024 TIP Performans Analiz Sistemi
      </div>
    </div>
  );
}
