'use client';

import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    trend?: number;
    color: 'green' | 'red' | 'yellow' | 'blue' | 'purple';
}

const colorClasses = {
    green: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    red: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    yellow: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20'
};

const iconBgClasses = {
    green: 'bg-emerald-500',
    red: 'bg-rose-500',
    yellow: 'bg-amber-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500'
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, color }: StatCardProps) {
    return (
        <div className={`rounded-2xl border p-6 ${colorClasses[color]} backdrop-blur-sm transition-all hover:scale-[1.02]`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium opacity-70">{title}</p>
                    <p className="mt-2 text-3xl font-bold">{value}</p>
                    {subtitle && <p className="mt-1 text-sm opacity-60">{subtitle}</p>}
                    {trend !== undefined && (
                        <div className={`mt-2 flex items-center text-sm ${trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            <span>{trend >= 0 ? '↑' : '↓'}</span>
                            <span className="ml-1">{Math.abs(trend).toFixed(1)}%</span>
                            <span className="ml-1 opacity-60">geçen aya göre</span>
                        </div>
                    )}
                </div>
                <div className={`rounded-xl p-3 ${iconBgClasses[color]}`}>
                    <Icon className="h-6 w-6 text-white" />
                </div>
            </div>
        </div>
    );
}
