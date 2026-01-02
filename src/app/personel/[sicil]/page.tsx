'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Target, TrendingUp, AlertTriangle, Award, FileDown } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from 'recharts';
import type { Personnel, MonthlyRecord, PersonnelKPI, Comment } from '@/types';

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

export default function PersonnelDetailPage() {
    const params = useParams();
    const sicil = params.sicil as string;

    const [data, setData] = useState<PersonnelData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [downloadingPdf, setDownloadingPdf] = useState(false);

    useEffect(() => {
        fetchData();
    }, [sicil]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/personnel?sicil=${sicil}`);
            const json = await res.json();

            if (!res.ok) throw new Error(json.error);

            setData(json);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = async () => {
        setDownloadingPdf(true);
        try {
            const res = await fetch(`/api/pdf/personnel?sicil=${sicil}`);
            if (!res.ok) throw new Error('PDF oluşturulamadı');

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `TIP_Rapor_${sicil}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            alert('PDF indirme hatası: ' + (err as Error).message);
        } finally {
            setDownloadingPdf(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                    <p className="text-slate-400">Veriler yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="text-center py-20">
                    <AlertTriangle className="h-16 w-16 mx-auto text-rose-500 mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Hata</h2>
                    <p className="text-slate-400 mb-6">{error || 'Personel bulunamadı'}</p>
                    <Link href="/" className="text-blue-400 hover:text-blue-300">
                        Dashboard'a dön
                    </Link>
                </div>
            </div>
        );
    }

    const { personnel, records, kpi, comments } = data;

    // Prepare chart data (reverse for chronological order)
    const chartData = [...records].reverse().map(r => ({
        ay: formatMonth(r.ay),
        'Başarı %': r.test_sayisi > 0 ? ((r.yesil / r.test_sayisi) * 100).toFixed(1) : 0,
        'Yeşil': r.yesil,
        'Kırmızı': r.kirmizi,
        'Sarı': r.sari,
        'Test': r.test_sayisi
    }));

    const latestRecord = records[0];

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Back Button */}
            <Link
                href="/"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Dashboard'a Dön
            </Link>

            {/* Personnel Header */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-slate-900 to-slate-800 p-8 mb-8">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <User className="h-10 w-10 text-white" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-white">{personnel.ad_soyad}</h1>
                        <p className="text-slate-400 mt-1">
                            Sicil: {personnel.sicil} • {personnel.gorev} • {personnel.grup} Grubu
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        {kpi && (
                            <>
                                <div className="text-center">
                                    <p className="text-4xl font-bold text-white">%{kpi.basariOrani.toFixed(1)}</p>
                                    <p className="text-sm text-slate-400">Başarı Oranı</p>
                                </div>
                                {kpi.percentile !== undefined && (
                                    <div className="text-center px-4 border-l border-white/10">
                                        <p className="text-2xl font-bold text-emerald-400">%{kpi.percentile}</p>
                                        <p className="text-sm text-slate-400">Percentile</p>
                                    </div>
                                )}
                            </>
                        )}
                        <button
                            onClick={handleDownloadPdf}
                            disabled={downloadingPdf}
                            className="flex items-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 rounded-xl text-white font-medium transition-colors ml-4"
                        >
                            {downloadingPdf ? (
                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <FileDown className="h-5 w-5" />
                            )}
                            <span className="hidden sm:inline">PDF İndir</span>
                        </button>
                    </div>
                </div>
            </div>

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

            {/* KPI Cards */}
            {latestRecord && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
                        <p className="text-sm text-slate-400">Toplam Test</p>
                        <p className="text-2xl font-bold text-white mt-1">{latestRecord.test_sayisi}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                        <p className="text-sm text-emerald-400">Yakalanan (Yeşil)</p>
                        <p className="text-2xl font-bold text-emerald-400 mt-1">{latestRecord.yesil}</p>
                    </div>
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
                        <p className="text-sm text-rose-400">Kaçırılan (Kırmızı)</p>
                        <p className="text-2xl font-bold text-rose-400 mt-1">{latestRecord.kirmizi}</p>
                    </div>
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                        <p className="text-sm text-amber-400">Yanlış Alarm (Sarı)</p>
                        <p className="text-2xl font-bold text-amber-400 mt-1">{latestRecord.sari}</p>
                    </div>
                </div>
            )}

            {/* Charts */}
            {chartData.length > 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Success Rate Trend */}
                    <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Başarı Oranı Trendi</h3>
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

            {/* Monthly History Table */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden">
                <div className="p-4 border-b border-white/10">
                    <h3 className="text-lg font-semibold text-white">Aylık Performans Geçmişi</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10 bg-slate-800/50">
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Dönem</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">Bagaj</th>
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
                                    <td className="px-4 py-4 text-center text-slate-300">{record.bagaj_sayisi.toLocaleString()}</td>
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
