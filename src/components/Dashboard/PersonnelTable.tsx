'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';

// Eşik değerleri
const MIN_TEST = 40;
const MIN_SUCCESS = 75;
const GOOD_RATE = 90;
const EXCELLENT_RATE = 98;

interface PersonnelTableProps {
    personnel: Array<{
        sicil: number;
        ad_soyad: string;
        gorev: string;
        grup: string;
        test_sayisi: number;
        yesil: number;
        kirmizi: number;
        basari_orani: number;
        improvement?: number;
    }>;
    showImprovement?: boolean;
    title?: string;
}

export function PersonnelTable({ personnel, showImprovement = false, title = 'Personel Listesi' }: PersonnelTableProps) {
    const getTrendIcon = (rate: number, testCount: number) => {
        if (testCount < MIN_TEST) return <AlertCircle className="h-4 w-4 text-slate-400" />;
        if (rate >= EXCELLENT_RATE) return <TrendingUp className="h-4 w-4 text-emerald-500" />;
        if (rate >= GOOD_RATE) return <TrendingUp className="h-4 w-4 text-blue-500" />;
        if (rate >= MIN_SUCCESS) return <Minus className="h-4 w-4 text-amber-500" />;
        return <TrendingDown className="h-4 w-4 text-rose-500" />;
    };

    const getStatusBadge = (rate: number, testCount: number) => {
        if (testCount < MIN_TEST) return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        if (rate >= EXCELLENT_RATE) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        if (rate >= GOOD_RATE) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        if (rate >= MIN_SUCCESS) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    };

    const getStatusLabel = (rate: number, testCount: number) => {
        if (testCount < MIN_TEST) return 'Yetersiz Test';
        if (rate >= EXCELLENT_RATE) return 'Mükemmel';
        if (rate >= GOOD_RATE) return 'İyi';
        if (rate >= MIN_SUCCESS) return 'Başarılı';
        return 'Başarısız';
    };

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
            <div className="p-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10 bg-slate-800/50">
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Personel</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Test</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Yeşil</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Kırmızı</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Başarı</th>
                            {showImprovement && (
                                <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Gelişim</th>
                            )}
                            <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Durum</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {personnel.map((p, index) => (
                            <tr
                                key={p.sicil}
                                className="hover:bg-white/5 transition-colors"
                            >
                                <td className="px-4 py-4">
                                    <Link href={`/personel/${p.sicil}`} className="block">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{p.ad_soyad}</p>
                                                <p className="text-sm text-slate-400">{p.sicil} • {p.grup} Grubu</p>
                                            </div>
                                        </div>
                                    </Link>
                                </td>
                                <td className={`px-4 py-4 text-center ${p.test_sayisi < MIN_TEST ? 'text-slate-500' : 'text-slate-300'}`}>
                                    {p.test_sayisi}
                                    {p.test_sayisi < MIN_TEST && <span className="text-xs ml-1 text-slate-500">⚠</span>}
                                </td>
                                <td className="px-4 py-4 text-center text-emerald-400 font-medium">{p.yesil}</td>
                                <td className="px-4 py-4 text-center text-rose-400 font-medium">{p.kirmizi}</td>
                                <td className="px-4 py-4 text-center">
                                    <span className={`text-lg font-bold ${p.test_sayisi < MIN_TEST ? 'text-slate-500' :
                                            p.basari_orani >= MIN_SUCCESS ? 'text-white' : 'text-rose-400'
                                        }`}>
                                        %{p.basari_orani?.toFixed(1) || '0'}
                                    </span>
                                </td>
                                {showImprovement && (
                                    <td className="px-4 py-4 text-center">
                                        <span className={`font-medium ${(p.improvement || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {(p.improvement || 0) >= 0 ? '+' : ''}{(p.improvement || 0).toFixed(1)}%
                                        </span>
                                    </td>
                                )}
                                <td className="px-4 py-4 text-center">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(p.basari_orani, p.test_sayisi)}`}>
                                        {getTrendIcon(p.basari_orani, p.test_sayisi)}
                                        {getStatusLabel(p.basari_orani, p.test_sayisi)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

