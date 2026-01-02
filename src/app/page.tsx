'use client';

import { useEffect, useState } from 'react';
import { Users, Target, AlertTriangle, CheckCircle, TrendingUp, BarChart3, FileDown } from 'lucide-react';
import { StatCard } from '@/components/Dashboard/StatCard';
import { MonthlyComparisonChart } from '@/components/Charts/MonthlyComparisonChart';
import { PersonnelTable } from '@/components/Dashboard/PersonnelTable';
import Link from 'next/link';
import type { MonthlyStats } from '@/types';

interface DashboardData {
  availableMonths: string[];
  currentMonth: string;
  previousMonth: string | null;
  stats: {
    current: MonthlyStats;
    previous: MonthlyStats | null;
  } | null;
  topPerformers: Array<{
    sicil: number;
    personnel: { ad_soyad: string; grup: string };
    test_sayisi: number;
    yesil: number;
    kirmizi: number;
    basari_orani: number;
  }>;
  riskPersonnel: Array<{
    sicil: number;
    personnel: { ad_soyad: string; grup: string };
    test_sayisi: number;
    yesil: number;
    kirmizi: number;
    basari_orani: number;
  }>;
  summaryComments: string[];
  monthlyTrend: MonthlyStats[];
  totalPersonnel: number;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const url = selectedMonth ? `/api/stats?month=${selectedMonth}` : '/api/stats';
      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error);

      setData(json);
      if (!selectedMonth && json.currentMonth) {
        setSelectedMonth(json.currentMonth);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadMonthlyPdf = async () => {
    if (!selectedMonth) return;
    setDownloadingPdf(true);
    try {
      const res = await fetch(`/api/pdf/monthly?month=${selectedMonth}`);
      if (!res.ok) throw new Error('PDF oluşturulamadı');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TIP_Aylik_Rapor_${selectedMonth}.pdf`;
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

  if (!data || !data.stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-20">
          <BarChart3 className="h-16 w-16 mx-auto text-slate-600 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Henüz Veri Yok</h2>
          <p className="text-slate-400 mb-6">Başlamak için Excel dosyası yükleyin</p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors"
          >
            Excel Yükle
          </Link>
        </div>
      </div>
    );
  }

  const { stats, topPerformers, riskPersonnel, summaryComments, monthlyTrend, availableMonths } = data;
  const basariDegisim = stats.previous
    ? stats.current.ortalamaBasari - stats.previous.ortalamaBasari
    : undefined;

  const formatTopPerformers = topPerformers.map(p => ({
    sicil: p.sicil,
    ad_soyad: p.personnel?.ad_soyad || 'Bilinmiyor',
    gorev: '',
    grup: p.personnel?.grup || '',
    test_sayisi: p.test_sayisi,
    yesil: p.yesil,
    kirmizi: p.kirmizi,
    basari_orani: p.basari_orani
  }));

  const formatRiskPersonnel = riskPersonnel.map(p => ({
    sicil: p.sicil,
    ad_soyad: p.personnel?.ad_soyad || 'Bilinmiyor',
    gorev: '',
    grup: p.personnel?.grup || '',
    test_sayisi: p.test_sayisi,
    yesil: p.yesil,
    kirmizi: p.kirmizi,
    basari_orani: p.basari_orani
  }));

  // Format month display
  const monthNames: Record<string, string> = {
    '01': 'Ocak', '02': 'Şubat', '03': 'Mart', '04': 'Nisan',
    '05': 'Mayıs', '06': 'Haziran', '07': 'Temmuz', '08': 'Ağustos',
    '09': 'Eylül', '10': 'Ekim', '11': 'Kasım', '12': 'Aralık'
  };

  const formatMonth = (ay: string) => {
    const [year, month] = ay.split('-');
    return `${monthNames[month] || month} ${year}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">TIP Performans Dashboard</h1>
          <p className="text-slate-400 mt-1">X-Ray güvenlik personeli performans analizi</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Period Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-xl border border-white/10">
            {[
              { value: 3, label: '3 Ay' },
              { value: 6, label: '6 Ay' },
              { value: 12, label: '12 Ay' },
            ].map(period => {
              const isActive = monthlyTrend.length <= period.value;
              return (
                <button
                  key={period.value}
                  onClick={() => {
                    // Select the month that would show this period
                    const idx = Math.min(period.value - 1, availableMonths.length - 1);
                    if (availableMonths[idx]) {
                      setSelectedMonth(availableMonths[0]); // Always show latest
                    }
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                >
                  {period.label}
                </button>
              );
            })}
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

          <button
            onClick={handleDownloadMonthlyPdf}
            disabled={downloadingPdf}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 rounded-xl text-white font-medium transition-colors"
          >
            {downloadingPdf ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">PDF Rapor</span>
          </button>
        </div>
      </div>

      {/* Summary Comments */}
      {summaryComments.length > 0 && (
        <div className="mb-8 p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-400 mb-1">Genel Değerlendirme</h3>
              <ul className="space-y-1">
                {summaryComments.map((comment, i) => (
                  <li key={i} className="text-slate-300">{comment}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Toplam Personel"
          value={stats.current.toplamPersonel}
          subtitle={`${stats.current.toplamTest.toLocaleString()} test yapıldı`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Ortalama Başarı"
          value={`%${stats.current.ortalamaBasari.toFixed(1)}`}
          icon={Target}
          trend={basariDegisim}
          color="green"
        />
        <StatCard
          title="Yakalanan Test (Yeşil)"
          value={stats.current.toplamYesil.toLocaleString()}
          subtitle="Doğru tespit"
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Kaçırılan Test (Kırmızı)"
          value={stats.current.toplamKirmizi}
          subtitle="Kritik hata"
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Charts */}
      {monthlyTrend.length > 1 && (
        <div className="mb-8">
          <MonthlyComparisonChart data={monthlyTrend} />
        </div>
      )}

      {/* Personnel Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {formatTopPerformers.length > 0 && (
          <PersonnelTable
            personnel={formatTopPerformers}
            title="🏆 En İyi Performans"
          />
        )}
        {formatRiskPersonnel.length > 0 && (
          <PersonnelTable
            personnel={formatRiskPersonnel}
            title="⚠️ Dikkat Gerektiren"
          />
        )}
      </div>
    </div>
  );
}
