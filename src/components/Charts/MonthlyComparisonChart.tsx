'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import type { MonthlyStats } from '@/types';

interface MonthlyChartProps {
    data: MonthlyStats[];
}

const monthNames: Record<string, string> = {
    '01': 'Oca', '02': 'Şub', '03': 'Mar', '04': 'Nis',
    '05': 'May', '06': 'Haz', '07': 'Tem', '08': 'Ağu',
    '09': 'Eyl', '10': 'Eki', '11': 'Kas', '12': 'Ara'
};

function formatMonth(ay: string): string {
    const [year, month] = ay.split('-');
    return `${monthNames[month] || month} ${year.slice(2)}`;
}

export function MonthlyComparisonChart({ data }: MonthlyChartProps) {
    const chartData = data.map(d => ({
        ay: formatMonth(d.ay),
        'Başarı %': parseFloat(d.ortalamaBasari.toFixed(1)),
        'Yeşil': d.toplamYesil,
        'Kırmızı': d.toplamKirmizi,
        'Sarı': d.toplamSari
    }));

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-sm">
            <h3 className="mb-4 text-lg font-semibold text-white">Aylık Performans Trendi</h3>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis
                            dataKey="ay"
                            stroke="#94a3b8"
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                        />
                        <YAxis
                            yAxisId="left"
                            stroke="#94a3b8"
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#94a3b8"
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            domain={[90, 100]}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                                color: '#f1f5f9'
                            }}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="Yeşil" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="left" dataKey="Kırmızı" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="left" dataKey="Sarı" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
