'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, LogOut, Target, TrendingUp, AlertTriangle, Award, Calendar } from 'lucide-react';
import { ExamList } from '@/components/ExamList';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts';
import type { Personnel, MonthlyRecord, PersonnelKPI, Comment } from '@/types';

interface UserSession {
    isLoggedIn: boolean;
    user?: {
        sicil: number;
        adSoyad: string;
        userType: string;
    };
}

interface PersonnelData {
    personnel: Personnel;
    records: MonthlyRecord[];
    kpi: PersonnelKPI | null;
    comments: Comment[];
}

const monthNames: Record<string, string> = {
    '01': 'Ocak', '02': 'Şubat', '03': 'Mart', '04': 'Nisan',
    '05': 'Mayıs', '06': 'Haziran', '07': 'Temmuz', '08': 'Ağustos',
    '09': 'Eylül', '10': 'Ekim', '11': 'Kasım', '12': 'Aralık'
};

function formatMonth(ay: string): string {
    const [year, month] = ay.split('-');
    return `${monthNames[month] || month} ${year}`;
}

export default function MyPerformancePage() {
    const router = useRouter();
    const [session, setSession] = useState<UserSession | null>(null);
    const [data, setData] = useState<PersonnelData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        try {
            const res = await fetch('/api/auth');
            const sessionData = await res.json();

            if (!sessionData.isLoggedIn) {
                router.push('/giris');
                return;
            }

            setSession(sessionData);
            fetchPersonnelData(sessionData.user.sicil);
        } catch (error) {
            router.push('/giris');
        }
    };

    const fetchPersonnelData = async (sicil: number) => {
        try {
            const res = await fetch(`/api/personnel?sicil=${sicil}`);
            const personnelData = await res.json();

            if (res.ok) {
                setData(personnelData);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth', { method: 'DELETE' });
        router.push('/');
    };

    if (loading || !session) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                    <p className="text-slate-400">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12 text-center">
                <AlertTriangle className="h-16 w-16 mx-auto text-rose-500 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Veri Bulunamadı</h2>
                <p className="text-slate-400">Performans verileriniz henüz yüklenmemiş.</p>
            </div>
        );
    }

    const { personnel, records, kpi, comments } = data;
    const latestRecord = records[0];

    // Chart data
    const chartData = [...records].reverse().map(r => ({
        ay: formatMonth(r.ay),
        'Başarı %': r.test_sayisi > 0 ? ((r.yesil / r.test_sayisi) * 100).toFixed(1) : 0,
        'Yeşil': r.yesil,
        'Kırmızı': r.kirmizi,
        'Sarı': r.sari
    }));

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* User Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <User className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{personnel.ad_soyad}</h1>
                        <p className="text-slate-400">Sicil: {personnel.sicil} • {personnel.grup} Grubu</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    Çıkış Yap
                </button>
            </div>

            {/* Exam List */}
            <ExamList />


            {/* Main Stats */}
            {latestRecord && kpi && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
                        <div className="flex items-center gap-2 text-blue-400 mb-2">
                            <Target className="h-5 w-5" />
                            <span className="text-sm font-medium">Başarı Oranı</span>
                        </div>
                        <p className="text-3xl font-bold text-white">%{kpi.basariOrani.toFixed(1)}</p>
                        {kpi.aylikDegisim !== undefined && (
                            <p className={`text-sm mt-1 ${kpi.aylikDegisim >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {kpi.aylikDegisim >= 0 ? '↑' : '↓'} {Math.abs(kpi.aylikDegisim).toFixed(1)}% geçen aya göre
                            </p>
                        )}
                    </div>

                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
                        <div className="flex items-center gap-2 text-emerald-400 mb-2">
                            <TrendingUp className="h-5 w-5" />
                            <span className="text-sm font-medium">Yakalanan</span>
                        </div>
                        <p className="text-3xl font-bold text-emerald-400">{latestRecord.yesil}</p>
                        <p className="text-sm text-slate-400 mt-1">{latestRecord.test_sayisi} testten</p>
                    </div>

                    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6">
                        <div className="flex items-center gap-2 text-rose-400 mb-2">
                            <AlertTriangle className="h-5 w-5" />
                            <span className="text-sm font-medium">Kaçırılan</span>
                        </div>
                        <p className="text-3xl font-bold text-rose-400">{latestRecord.kirmizi}</p>
                        <p className="text-sm text-slate-400 mt-1">kırmızı test</p>
                    </div>

                    {kpi.percentile !== undefined && (
                        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-6">
                            <div className="flex items-center gap-2 text-purple-400 mb-2">
                                <Award className="h-5 w-5" />
                                <span className="text-sm font-medium">Sıralama</span>
                            </div>
                            <p className="text-3xl font-bold text-purple-400">%{kpi.percentile}</p>
                            <p className="text-sm text-slate-400 mt-1">personelin üstünde</p>
                        </div>
                    )}
                </div>
            )}

            {/* Comments */}
            {comments.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {comments.map((comment, i) => (
                        <div
                            key={i}
                            className={`p-4 rounded-xl border ${comment.type === 'achievement' ? 'bg-purple-500/10 border-purple-500/20' :
                                comment.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' :
                                    comment.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20' :
                                        'bg-blue-500/10 border-blue-500/20'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-xl">{comment.icon}</span>
                                <p className={`${comment.type === 'achievement' ? 'text-purple-300' :
                                    comment.type === 'success' ? 'text-emerald-300' :
                                        comment.type === 'warning' ? 'text-amber-300' :
                                            'text-blue-300'
                                    }`}>
                                    {comment.text}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Charts */}
            {chartData.length > 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Success Rate Trend */}
                    <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-400" />
                            Başarı Oranı Trendi
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="ay" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <YAxis domain={[85, 100]} stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1e293b',
                                            border: '1px solid #334155',
                                            borderRadius: '8px',
                                            color: '#f1f5f9'
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="Başarı %"
                                        stroke="#10b981"
                                        fillOpacity={1}
                                        fill="url(#successGradient)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Test Results */}
                    <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Aylık Test Sonuçları</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="ay" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1e293b',
                                            border: '1px solid #334155',
                                            borderRadius: '8px',
                                            color: '#f1f5f9'
                                        }}
                                    />
                                    <Line type="monotone" dataKey="Yeşil" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                                    <Line type="monotone" dataKey="Kırmızı" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} />
                                    <Line type="monotone" dataKey="Sarı" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Monthly History */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden">
                <div className="p-4 border-b border-white/10">
                    <h3 className="text-lg font-semibold text-white">Performans Geçmişi</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10 bg-slate-800/50">
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Dönem</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">Test</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">Yeşil</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">Kırmızı</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">Sarı</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">Başarı</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {records.map((record) => (
                                <tr key={record.ay} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-4 font-medium text-white">{formatMonth(record.ay)}</td>
                                    <td className="px-4 py-4 text-center text-slate-300">{record.test_sayisi}</td>
                                    <td className="px-4 py-4 text-center text-emerald-400 font-medium">{record.yesil}</td>
                                    <td className="px-4 py-4 text-center text-rose-400 font-medium">{record.kirmizi}</td>
                                    <td className="px-4 py-4 text-center text-amber-400 font-medium">{record.sari}</td>
                                    <td className="px-4 py-4 text-center">
                                        <span className={`font-bold ${record.basari_orani >= 98 ? 'text-emerald-400' :
                                            record.basari_orani >= 95 ? 'text-amber-400' :
                                                'text-rose-400'
                                            }`}>
                                            %{record.basari_orani.toFixed(1)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
