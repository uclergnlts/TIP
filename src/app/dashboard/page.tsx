'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users,
    Target,
    TrendingUp,
    AlertTriangle,
    Award,
    Calendar,
    BarChart3,
    Activity,
    LogOut,
    Menu
} from 'lucide-react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    LineChart,
    Line,
    Cell
} from 'recharts';
import { useAuth } from '@/components/AuthProvider';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DashboardData {
    month: string;
    overall: {
        total_personnel: number;
        active_personnel: number;
        total_tests: number;
        total_caught: number;
        avg_success_rate: number;
        avg_false_alarm_rate: number;
    };
    groups: Array<{
        grup: string;
        personnel_count: number;
        avg_success: number;
        avg_test_volume: number;
    }>;
    trend: Array<{
        ay: string;
        avg_success: number;
        total_tests: number;
    }>;
    riskList: Array<{
        ad_soyad: string;
        sicil: number;
        grup: string;
        basari_orani: number;
        kacirilan_tip: number;
    }>;
    topList: Array<{
        ad_soyad: string;
        sicil: number;
        grup: string;
        basari_orani: number;
    }>;
}

const monthNames: Record<string, string> = {
    '01': 'Ocak', '02': 'Şubat', '03': 'Mart', '04': 'Nisan',
    '05': 'Mayıs', '06': 'Haziran', '07': 'Temmuz', '08': 'Ağustos',
    '09': 'Eylül', '10': 'Ekim', '11': 'Kasım', '12': 'Aralık'
};

function formatMonth(ay: string): string {
    if (!ay) return '-';
    const [year, month] = ay.split('-');
    return `${monthNames[month] || month} ${year}`;
}

export default function ManagerDashboard() {
    const { isAdmin, adminRole, loading: authLoading, logout } = useAuth();
    const router = useRouter();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !isAdmin) {
            router.push('/admin');
            return;
        }

        if (isAdmin) {
            fetchDashboardData();
        }
    }, [isAdmin, authLoading, router]);

    const fetchDashboardData = async () => {
        try {
            const res = await fetch('/api/dashboard/manager');
            if (res.ok) {
                const dashboardData = await res.json();
                setData(dashboardData);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                    <p className="text-slate-400 font-medium">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="min-h-screen pb-8">
            {/* Top Bar */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Activity className="h-8 w-8 text-amber-500" />
                            Yönetim Paneli
                        </h1>
                        <p className="text-slate-400 mt-1 pl-11 flex items-center gap-2">
                            <span>{formatMonth(data.month)}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                            <span className="capitalize">{adminRole === 'manager' ? 'Müdür Yetkisi' : 'Süpervizör Yetkisi'}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300"
                            onClick={() => logout()}
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Çıkış Yap
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                {/* 1. Overview Cards (Matching Personnel Page Style) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <Users className="h-5 w-5 text-blue-500" />
                            <p className="text-sm font-medium text-slate-400">Aktif Personel</p>
                        </div>
                        <p className="text-3xl font-bold text-white">{data.overall?.active_personnel || 0}</p>
                        <p className="text-xs text-slate-500 mt-1">Toplam {data.overall?.total_personnel || 0} kayıtlı</p>
                    </div>

                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <Target className="h-5 w-5 text-emerald-400" />
                            <p className="text-sm font-medium text-emerald-400">Genel Başarı</p>
                        </div>
                        <p className="text-3xl font-bold text-emerald-400">%{data.overall?.avg_success_rate?.toFixed(1) || 0}</p>
                        <p className="text-xs text-emerald-500/70 mt-1">Sistem ortalaması</p>
                    </div>

                    <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <Activity className="h-5 w-5 text-purple-400" />
                            <p className="text-sm font-medium text-purple-400">Toplam Test</p>
                        </div>
                        <p className="text-3xl font-bold text-purple-400">{data.overall?.total_tests?.toLocaleString() || 0}</p>
                        <p className="text-xs text-purple-500/70 mt-1">{data.overall?.total_caught?.toLocaleString()} tehdit tespiti</p>
                    </div>

                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <AlertTriangle className="h-5 w-5 text-rose-400" />
                            <p className="text-sm font-medium text-rose-400">Yanlış Alarm</p>
                        </div>
                        <p className="text-3xl font-bold text-rose-400">%{data.overall?.avg_false_alarm_rate?.toFixed(2) || 0}</p>
                        <p className="text-xs text-rose-500/70 mt-1">Ortalama oran</p>
                    </div>
                </div>

                {/* 2. Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Group Performance */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Grup Performansları</CardTitle>
                            <CardDescription>Gruplara göre başarı sıralaması</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.groups} layout="vertical" margin={{ left: 0, right: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                                    <XAxis type="number" domain={[80, 100]} stroke="#94a3b8" fontSize={12} />
                                    <YAxis dataKey="grup" type="category" stroke="#94a3b8" fontSize={12} width={80} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                                        cursor={{ fill: '#ffffff05' }}
                                    />
                                    <Bar dataKey="avg_success" name="Başarı %" radius={[0, 4, 4, 0]} barSize={32}>
                                        {data.groups?.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.avg_success >= 90 ? '#10b981' : entry.avg_success >= 80 ? '#f59e0b' : '#ef4444'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Trend Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Aylık Trend</CardTitle>
                            <CardDescription>Son 6 ay başarı değişimi</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.trend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                    <XAxis dataKey="ay" tickFormatter={(val) => val.split('-')[1]} stroke="#94a3b8" fontSize={12} />
                                    <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                                        labelFormatter={formatMonth}
                                    />
                                    <Line type="monotone" dataKey="avg_success" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* 3. Lists Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Risk List */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-rose-500" />
                                Odaklanılması Gerekenler
                            </CardTitle>
                            <CardDescription>Başarı oranı düşük personeller</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Personel</TableHead>
                                        <TableHead className="text-center">Grup</TableHead>
                                        <TableHead className="text-right">Başarı</TableHead>
                                        <TableHead className="text-right">Kaçırılan</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.riskList?.map((p) => (
                                        <TableRow key={p.sicil}>
                                            <TableCell className="font-medium text-white">
                                                {p.ad_soyad}
                                                <div className="text-xs text-slate-500">Sicil: {p.sicil}</div>
                                            </TableCell>
                                            <TableCell className="text-center text-slate-500">
                                                <Badge>{p.grup}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="destructive" className="font-bold">%{p.basari_orani.toFixed(1)}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-slate-400">{p.kacirilan_tip}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Top Performers */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Award className="h-5 w-5 text-emerald-500" />
                                En İyi Performanslar
                            </CardTitle>
                            <CardDescription>Bu ayın yıldız personelleri</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Personel</TableHead>
                                        <TableHead className="text-center">Grup</TableHead>
                                        <TableHead className="text-right">Başarı</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.topList?.map((p, i) => (
                                        <TableRow key={p.sicil}>
                                            <TableCell className="font-medium text-white flex items-center gap-3">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-500 text-slate-900 border border-amber-400' :
                                                        i === 1 ? 'bg-slate-300 text-slate-900 border border-slate-200' :
                                                            i === 2 ? 'bg-orange-700 text-orange-100 border border-orange-600' :
                                                                'bg-slate-800 text-slate-500 border border-white/10'
                                                    }`}>
                                                    {i + 1}
                                                </div>
                                                {p.ad_soyad}
                                            </TableCell>
                                            <TableCell className="text-center text-slate-500">
                                                <Badge>{p.grup}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="success" className="font-bold">%{p.basari_orani.toFixed(1)}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
