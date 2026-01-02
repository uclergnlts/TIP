'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Target, TrendingUp, TrendingDown, Award, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell } from 'recharts';

interface GroupStats {
    grup: string;
    toplamPersonel: number;
    aktifPersonel: number;
    toplamTest: number;
    toplamYesil: number;
    toplamKirmizi: number;
    toplamSari: number;
    ortalamaBasari: number;
    basariliPersonel: number;
    basarisizPersonel: number;
    mukemmelPersonel: number;
    enIyiPersonel?: { sicil: number; adSoyad: string; basari: number };
    enKotuPersonel?: { sicil: number; adSoyad: string; basari: number };
}

interface GroupData {
    currentMonth: string;
    previousMonth: string;
    availableMonths: string[];
    groups: GroupStats[];
    previousGroupStats: Record<string, number>;
}

const GROUP_COLORS: Record<string, string> = {
    'A': '#10b981', // emerald
    'B': '#3b82f6', // blue
    'C': '#f59e0b', // amber
    'D': '#ef4444', // red
    'E': '#8b5cf6', // purple
};

const monthNames: Record<string, string> = {
    '01': 'Ocak', '02': 'Şubat', '03': 'Mart', '04': 'Nisan',
    '05': 'Mayıs', '06': 'Haziran', '07': 'Temmuz', '08': 'Ağustos',
    '09': 'Eylül', '10': 'Ekim', '11': 'Kasım', '12': 'Aralık'
};

function formatMonth(ay: string): string {
    const [year, month] = ay.split('-');
    return `${monthNames[month] || month} ${year}`;
}

export default function GroupComparisonPage() {
    const [data, setData] = useState<GroupData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState('');

    useEffect(() => {
        fetchData();
    }, [selectedMonth]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const url = selectedMonth ? `/api/groups?month=${selectedMonth}` : '/api/groups';
            const res = await fetch(url);
            const json = await res.json();

            if (res.ok) {
                setData(json);
                if (!selectedMonth && json.currentMonth) {
                    setSelectedMonth(json.currentMonth);
                }
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                    <p className="text-slate-400">Grup verileri yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (!data || data.groups.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-12 text-center">
                <Users className="h-16 w-16 mx-auto text-slate-600 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Grup Verisi Yok</h2>
                <p className="text-slate-400">Henüz grup verisi bulunmuyor.</p>
            </div>
        );
    }

    const { groups, previousGroupStats, availableMonths, currentMonth } = data;

    // Chart data hazırla
    const barChartData = groups.map(g => ({
        grup: `${g.grup} Grubu`,
        'Başarı %': parseFloat(g.ortalamaBasari.toFixed(1)),
        'Önceki Ay': parseFloat((previousGroupStats[g.grup] || 0).toFixed(1)),
    }));

    const radarData = groups.map(g => ({
        subject: `${g.grup} Grubu`,
        'Başarı': g.ortalamaBasari,
        'Mükemmel %': g.aktifPersonel > 0 ? (g.mukemmelPersonel / g.aktifPersonel) * 100 : 0,
        'Aktif Personel': (g.aktifPersonel / g.toplamPersonel) * 100,
    }));

    // En iyi ve en kötü grup
    const sortedGroups = [...groups].sort((a, b) => b.ortalamaBasari - a.ortalamaBasari);
    const bestGroup = sortedGroups[0];
    const worstGroup = sortedGroups[sortedGroups.length - 1];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-2 transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        Dashboard'a Dön
                    </Link>
                    <h1 className="text-3xl font-bold text-white">Grup Karşılaştırma</h1>
                    <p className="text-slate-400 mt-1">A, B, C, D gruplarının performans analizi</p>
                </div>

                <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-4 py-2 bg-slate-800 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {availableMonths.map(month => (
                        <option key={month} value={month}>{formatMonth(month)}</option>
                    ))}
                </select>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <Award className="h-6 w-6 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">En İyi Grup</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{bestGroup.grup} Grubu</p>
                    <p className="text-emerald-400 mt-1">%{bestGroup.ortalamaBasari.toFixed(1)} başarı</p>
                </div>

                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <AlertTriangle className="h-6 w-6 text-rose-400" />
                        <span className="text-rose-400 font-medium">Geliştirilmeli</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{worstGroup.grup} Grubu</p>
                    <p className="text-rose-400 mt-1">%{worstGroup.ortalamaBasari.toFixed(1)} başarı</p>
                </div>

                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <Users className="h-6 w-6 text-blue-400" />
                        <span className="text-blue-400 font-medium">Toplam Personel</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{groups.reduce((s, g) => s + g.toplamPersonel, 0)}</p>
                    <p className="text-blue-400 mt-1">{groups.reduce((s, g) => s + g.aktifPersonel, 0)} aktif</p>
                </div>

                <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <Target className="h-6 w-6 text-purple-400" />
                        <span className="text-purple-400 font-medium">Toplam Test</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{groups.reduce((s, g) => s + g.toplamTest, 0).toLocaleString()}</p>
                    <p className="text-purple-400 mt-1">{groups.reduce((s, g) => s + g.toplamYesil, 0).toLocaleString()} yakalanan</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Bar Chart - Başarı Karşılaştırma */}
                <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Başarı Oranı Karşılaştırması</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barChartData}>
                                <XAxis dataKey="grup" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                                <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '8px',
                                        color: '#f1f5f9'
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="Başarı %" fill="#10b981" radius={[4, 4, 0, 0]}>
                                    {barChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={GROUP_COLORS[groups[index]?.grup] || '#6b7280'} />
                                    ))}
                                </Bar>
                                <Bar dataKey="Önceki Ay" fill="#475569" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Personnel Distribution */}
                <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Personel Dağılımı</h3>
                    <div className="space-y-4">
                        {groups.map(g => {
                            const basariliOran = g.aktifPersonel > 0 ? (g.basariliPersonel / g.aktifPersonel) * 100 : 0;
                            const basarisizOran = g.aktifPersonel > 0 ? (g.basarisizPersonel / g.aktifPersonel) * 100 : 0;

                            return (
                                <div key={g.grup} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-white">{g.grup} Grubu</span>
                                        <span className="text-sm text-slate-400">{g.aktifPersonel} aktif personel</span>
                                    </div>
                                    <div className="flex h-4 rounded-full overflow-hidden bg-slate-800">
                                        <div
                                            className="bg-emerald-500 transition-all"
                                            style={{ width: `${basariliOran}%` }}
                                            title={`Başarılı: ${g.basariliPersonel}`}
                                        />
                                        <div
                                            className="bg-rose-500 transition-all"
                                            style={{ width: `${basarisizOran}%` }}
                                            title={`Başarısız: ${g.basarisizPersonel}`}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-emerald-400">✓ {g.basariliPersonel} başarılı</span>
                                        <span className="text-rose-400">✗ {g.basarisizPersonel} başarısız</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Group Cards */}
            <h3 className="text-xl font-semibold text-white mb-4">Grup Detayları</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {groups.map(g => {
                    const prevRate = previousGroupStats[g.grup] || 0;
                    const change = g.ortalamaBasari - prevRate;
                    const color = GROUP_COLORS[g.grup] || '#6b7280';

                    return (
                        <div
                            key={g.grup}
                            className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 relative overflow-hidden"
                        >
                            {/* Color bar */}
                            <div
                                className="absolute top-0 left-0 right-0 h-1"
                                style={{ backgroundColor: color }}
                            />

                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-xl font-bold text-white">{g.grup} Grubu</h4>
                                <div className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                    {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                                </div>
                            </div>

                            <div className="text-center mb-4">
                                <p className="text-4xl font-bold" style={{ color }}>
                                    %{g.ortalamaBasari.toFixed(1)}
                                </p>
                                <p className="text-sm text-slate-400">Başarı Oranı</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="text-center p-2 rounded-lg bg-slate-800/50">
                                    <p className="text-lg font-bold text-white">{g.aktifPersonel}</p>
                                    <p className="text-xs text-slate-400">Aktif</p>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-slate-800/50">
                                    <p className="text-lg font-bold text-emerald-400">{g.mukemmelPersonel}</p>
                                    <p className="text-xs text-slate-400">Mükemmel</p>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-slate-800/50">
                                    <p className="text-lg font-bold text-emerald-400">{g.toplamYesil}</p>
                                    <p className="text-xs text-slate-400">Yeşil</p>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-slate-800/50">
                                    <p className="text-lg font-bold text-rose-400">{g.toplamKirmizi}</p>
                                    <p className="text-xs text-slate-400">Kırmızı</p>
                                </div>
                            </div>

                            {/* Best/Worst Personnel */}
                            {g.enIyiPersonel && (
                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-400">En iyi:</span>
                                        <Link
                                            href={`/personel/${g.enIyiPersonel.sicil}`}
                                            className="text-emerald-400 hover:underline truncate ml-2"
                                        >
                                            {g.enIyiPersonel.adSoyad.split(' ')[0]} %{g.enIyiPersonel.basari.toFixed(0)}
                                        </Link>
                                    </div>
                                    {g.enKotuPersonel && g.enKotuPersonel.sicil !== g.enIyiPersonel.sicil && (
                                        <div className="flex items-center justify-between text-xs mt-1">
                                            <span className="text-slate-400">Dikkat:</span>
                                            <Link
                                                href={`/personel/${g.enKotuPersonel.sicil}`}
                                                className="text-rose-400 hover:underline truncate ml-2"
                                            >
                                                {g.enKotuPersonel.adSoyad.split(' ')[0]} %{g.enKotuPersonel.basari.toFixed(0)}
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
