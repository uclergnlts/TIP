'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, Users, TrendingUp, TrendingDown, Minus, Filter } from 'lucide-react';

interface PersonnelItem {
    sicil: number;
    ad_soyad: string;
    gorev: string;
    grup: string;
    ay: string;
    test_sayisi: number;
    yesil: number;
    kirmizi: number;
    basari_orani: number;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function PersonelListPage() {
    const [personnel, setPersonnel] = useState<PersonnelItem[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [availableMonths, setAvailableMonths] = useState<string[]>([]);
    const [filterGroup, setFilterGroup] = useState('');

    useEffect(() => {
        // Fetch available months first
        fetch('/api/stats')
            .then(res => res.json())
            .then(data => {
                if (data.availableMonths) {
                    setAvailableMonths(data.availableMonths);
                    if (!selectedMonth && data.currentMonth) {
                        setSelectedMonth(data.currentMonth);
                    }
                }
            });
    }, []);

    useEffect(() => {
        if (selectedMonth) {
            fetchPersonnel();
        }
    }, [selectedMonth, pagination.page, search]);

    const fetchPersonnel = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                month: selectedMonth,
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            });
            if (search) params.append('search', search);

            const res = await fetch(`/api/personnel?${params}`);
            const data = await res.json();

            if (res.ok) {
                setPersonnel(data.personnel || []);
                setPagination(prev => ({ ...prev, ...data.pagination }));
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchPersonnel();
    };

    const getStatusBadge = (rate: number) => {
        if (rate >= 98) return { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Mükemmel', icon: TrendingUp };
        if (rate >= 95) return { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'İyi', icon: Minus };
        return { color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', label: 'Dikkat', icon: TrendingDown };
    };

    const filteredPersonnel = filterGroup
        ? personnel.filter(p => p.grup === filterGroup)
        : personnel;

    const uniqueGroups = [...new Set(personnel.map(p => p.grup).filter(Boolean))];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Users className="h-8 w-8 text-blue-500" />
                        Personel Listesi
                    </h1>
                    <p className="text-slate-400 mt-1">
                        {pagination.total} personel kayıtlı
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {/* Search */}
                <form onSubmit={handleSearch} className="md:col-span-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="İsim veya sicil ara..."
                            className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </form>

                {/* Month Filter */}
                <select
                    value={selectedMonth}
                    onChange={(e) => {
                        setSelectedMonth(e.target.value);
                        setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {availableMonths.map(month => (
                        <option key={month} value={month}>{month}</option>
                    ))}
                </select>

                {/* Group Filter */}
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <select
                        value={filterGroup}
                        onChange={(e) => setFilterGroup(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                    >
                        <option value="">Tüm Gruplar</option>
                        {uniqueGroups.map(group => (
                            <option key={group} value={group}>{group} Grubu</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Personnel Table */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10 bg-slate-800/50">
                                <th className="px-4 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">#</th>
                                <th className="px-4 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Personel</th>
                                <th className="px-4 py-4 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Grup</th>
                                <th className="px-4 py-4 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Test</th>
                                <th className="px-4 py-4 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Yeşil</th>
                                <th className="px-4 py-4 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Kırmızı</th>
                                <th className="px-4 py-4 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Başarı</th>
                                <th className="px-4 py-4 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                                            <span className="text-slate-400">Yükleniyor...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredPersonnel.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                                        Personel bulunamadı
                                    </td>
                                </tr>
                            ) : (
                                filteredPersonnel.map((person, index) => {
                                    const status = getStatusBadge(person.basari_orani);
                                    const StatusIcon = status.icon;
                                    return (
                                        <tr
                                            key={person.sicil}
                                            className="hover:bg-white/5 transition-colors"
                                        >
                                            <td className="px-4 py-4 text-slate-500">
                                                {(pagination.page - 1) * pagination.limit + index + 1}
                                            </td>
                                            <td className="px-4 py-4">
                                                <Link href={`/personel/${person.sicil}`} className="block group">
                                                    <p className="font-medium text-white group-hover:text-blue-400 transition-colors">
                                                        {person.ad_soyad}
                                                    </p>
                                                    <p className="text-sm text-slate-500">
                                                        Sicil: {person.sicil}
                                                    </p>
                                                </Link>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-300">
                                                    {person.grup || '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center text-slate-300">{person.test_sayisi}</td>
                                            <td className="px-4 py-4 text-center text-emerald-400 font-medium">{person.yesil}</td>
                                            <td className="px-4 py-4 text-center text-rose-400 font-medium">{person.kirmizi}</td>
                                            <td className="px-4 py-4 text-center">
                                                <span className="text-lg font-bold text-white">
                                                    %{person.basari_orani?.toFixed(1) || '0'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    {status.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-4 border-t border-white/10">
                        <p className="text-sm text-slate-400">
                            {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total} personel
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                disabled={pagination.page <= 1}
                                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <span className="px-4 py-2 text-sm text-slate-300">
                                Sayfa {pagination.page} / {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                disabled={pagination.page >= pagination.totalPages}
                                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
                    <p className="text-sm text-slate-400">Toplam Personel</p>
                    <p className="text-2xl font-bold text-white mt-1">{pagination.total}</p>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <p className="text-sm text-emerald-400">Mükemmel (%98+)</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">
                        {filteredPersonnel.filter(p => p.basari_orani >= 98).length}
                    </p>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <p className="text-sm text-amber-400">İyi (%95-98)</p>
                    <p className="text-2xl font-bold text-amber-400 mt-1">
                        {filteredPersonnel.filter(p => p.basari_orani >= 95 && p.basari_orani < 98).length}
                    </p>
                </div>
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
                    <p className="text-sm text-rose-400">Dikkat (%95-)</p>
                    <p className="text-2xl font-bold text-rose-400 mt-1">
                        {filteredPersonnel.filter(p => p.basari_orani < 95).length}
                    </p>
                </div>
            </div>
        </div>
    );
}
