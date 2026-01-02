import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateMonthlyStats, getTopPerformers, getRiskPersonnel, getMostImproved } from '@/lib/kpi-calculator';
import { generateSummaryComment } from '@/lib/comment-engine';
import type { MonthlyRecord, Personnel } from '@/types';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const selectedMonth = searchParams.get('month');

        // Mevcut ayları al
        const availableMonthsResult = await db.execute('SELECT DISTINCT ay FROM monthly_stats ORDER BY ay DESC');
        const availableMonths = availableMonthsResult.rows.map(r => r.ay as string);

        if (availableMonths.length === 0) {
            return NextResponse.json({
                availableMonths: [],
                currentMonth: null,
                stats: null,
                message: 'Henüz veri yüklenmemiş'
            });
        }

        // Seçili ay veya en son ay
        const currentMonth = selectedMonth || availableMonths[0];
        const previousMonth = availableMonths[availableMonths.indexOf(currentMonth) + 1] || null;

        // Kayıtları al
        const currentRecordsResult = await db.execute('SELECT * FROM monthly_stats WHERE ay = ?', [currentMonth]);
        const currentRecords = currentRecordsResult.rows as unknown as MonthlyRecord[];

        const previousRecordsResult = previousMonth
            ? await db.execute('SELECT * FROM monthly_stats WHERE ay = ?', [previousMonth])
            : { rows: [] };
        const previousRecords = previousRecordsResult.rows as unknown as MonthlyRecord[];

        // Personel bilgilerini al
        const personnelResult = await db.execute('SELECT * FROM personnel');
        const personnelMap = new Map(personnelResult.rows.map(p => [p.sicil as number, p as unknown as Personnel]));

        // İstatistikleri hesapla
        const currentStats = calculateMonthlyStats(currentRecords, currentMonth);
        const previousStats = previousMonth ? calculateMonthlyStats(previousRecords, previousMonth) : null;

        // En iyi performans
        const topPerformers = getTopPerformers(currentRecords, 5).map(r => ({
            ...r,
            personnel: personnelMap.get(r.sicil)
        }));

        // Risk personeli
        const riskPersonnel = getRiskPersonnel(currentRecords, 5).map(r => ({
            ...r,
            personnel: personnelMap.get(r.sicil)
        }));

        // En çok gelişen
        const mostImproved = previousRecords.length > 0
            ? getMostImproved(currentRecords, previousRecords, 5).map(item => ({
                ...item,
                personnel: personnelMap.get(item.sicil)
            }))
            : [];

        // Özet yorumlar
        const summaryComments = generateSummaryComment(
            currentStats,
            previousStats || undefined
        );

        // Tüm ayların istatistikleri (trend için) - Parallel fetch for better performance
        const trendMonths = availableMonths.slice(0, 6).reverse();
        const trendPromises = trendMonths.map(async month => {
            const res = await db.execute('SELECT * FROM monthly_stats WHERE ay = ?', [month]);
            return calculateMonthlyStats(res.rows as unknown as MonthlyRecord[], month);
        });
        const monthlyTrend = await Promise.all(trendPromises);

        return NextResponse.json({
            availableMonths,
            currentMonth,
            previousMonth,
            stats: {
                current: currentStats,
                previous: previousStats
            },
            topPerformers,
            riskPersonnel,
            mostImproved,
            summaryComments,
            monthlyTrend,
            totalPersonnel: personnelMap.size
        });

    } catch (error) {
        console.error('Stats error:', error);
        return NextResponse.json(
            { error: 'Veriler alınırken hata oluştu: ' + (error as Error).message },
            { status: 500 }
        );
    }
}
