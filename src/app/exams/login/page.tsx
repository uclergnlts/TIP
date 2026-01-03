'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ExamLoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({ sicil: '', code: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/exam-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                router.push('/exams');
            } else {
                const data = await res.json();
                setError(data.error || 'Giriş başarısız.');
            }
        } catch (err) {
            setError('Bağlantı hatası.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-full max-w-sm space-y-8">
                {/* Header */}
                <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-blue-600/20 text-blue-500 rounded-3xl flex items-center justify-center mb-2">
                        <ShieldCheck className="w-10 h-10" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">TIP Online</h1>
                        <p className="text-slate-400 mt-2">Güvenlik Sınav Sistemi</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-6 bg-slate-900/50 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <div className="space-y-4">
                        <div className="text-left">
                            <label className="text-sm font-medium text-slate-400 ml-1">Sicil Numaranız</label>
                            <Input
                                type="text"
                                placeholder="12345"
                                className="h-14 text-lg bg-black/40 border-slate-800 focus:border-blue-500 transition-colors"
                                value={formData.sicil}
                                onChange={(e) => setFormData({ ...formData, sicil: e.target.value })}
                                required
                            />
                        </div>
                        <div className="text-left">
                            <label className="text-sm font-medium text-slate-400 ml-1">Giriş Kodu (6 Haneli)</label>
                            <Input
                                type="text"
                                placeholder="******"
                                className="h-14 text-lg bg-black/40 border-slate-800 focus:border-blue-500 transition-colors tracking-widest text-center font-mono font-bold"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                maxLength={6}
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                            {error}
                        </div>
                    )}

                    <Button type="submit" disabled={loading} className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700 rounded-xl">
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                            <span className="flex items-center gap-2">Sınava Başla <ArrowRight className="w-5 h-5" /></span>
                        )}
                    </Button>
                </form>

                <p className="text-xs text-slate-600">
                    Kodu süpervizörünüzden temin edebilirsiniz.<br />Kod 72 saat geçerlidir.
                </p>
            </div>
        </div>
    );
}
