'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Key, LogIn, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const [sicil, setSicil] = useState('');
    const [soyad, setSoyad] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sicil, soyad }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                router.push('/benim');
                router.refresh();
            } else {
                setError(data.error || 'Giriş başarısız');
            }
        } catch (err) {
            setError('Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                        <User className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Personel Girişi</h1>
                    <p className="text-slate-400 mt-2">TIP Performans Sistemi</p>
                </div>

                {/* Login Form */}
                <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        {/* Sicil Input */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Sicil Numarası
                            </label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={sicil}
                                    onChange={(e) => setSicil(e.target.value)}
                                    placeholder="Ör: 12345"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                        </div>

                        {/* Soyad Input */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Soyadınız
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={soyad}
                                    onChange={(e) => setSoyad(e.target.value)}
                                    placeholder="Ör: YILMAZ"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !sicil || !soyad}
                            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${loading || !sicil || !soyad
                                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Giriş yapılıyor...
                                </>
                            ) : (
                                <>
                                    <LogIn className="h-5 w-5" />
                                    Giriş Yap
                                </>
                            )}
                        </button>
                    </form>

                    {/* Info */}
                    <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <p className="text-sm text-blue-300">
                            <strong>Not:</strong> Sicil numaranızı ve soyadınızı girerek kişisel performans raporunuza erişebilirsiniz.
                        </p>
                    </div>
                </div>

                {/* Admin Link */}
                <p className="text-center text-sm text-slate-500 mt-6">
                    Amir girişi için <a href="/" className="text-blue-400 hover:text-blue-300">Dashboard</a>'a gidin
                </p>
            </div>
        </div>
    );
}
