import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/session';

export async function GET(request: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

        if (!session.isLoggedIn || session.userType !== 'admin') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const monthParam = searchParams.get('month');

        // Belirlenen ayı veya en son ayı bul
        let targetMonth = monthParam;
        if (!targetMonth) {
            const latestMonthResult = await db.execute('SELECT MAX(ay) as ay FROM monthly_stats');
            targetMonth = (latestMonthResult.rows[0] as any)?.ay;
        }

        if (!targetMonth) {
            return NextResponse.json({ error: 'Veri bulunamadı' }, { status: 404 });
        }

        // --- 1. GENEL İSTATİSTİKLER (Kartlar) ---
        const overallStatsQuery = `
            SELECT 
                COUNT(DISTINCT p.sicil) as total_personnel,
                COUNT(DISTINCT ms.sicil) as active_personnel,
                SUM(ms.atilan_tip_sayisi) as total_tests,
                SUM(ms.yakalanan_tip) as total_caught,
                CAST(SUM(ms.yakalanan_tip) AS REAL) / NULLIF(SUM(ms.atilan_tip_sayisi), 0) * 100 as avg_success_rate,
                CAST(SUM(ms.yanlis_alarm) AS REAL) / NULLIF(SUM(ms.kontrol_edilen_bagaj), 0) * 100 as avg_false_alarm_rate
            FROM personnel p
            LEFT JOIN monthly_stats ms ON p.sicil = ms.sicil AND ms.ay = ?
        `;
        const overallStatsResult = await db.execute(overallStatsQuery, [targetMonth]);
        const overallStats = overallStatsResult.rows[0];

        // --- 2. GRUP PERFORMANSI (Chart) ---
        const groupStatsQuery = `
            SELECT 
                p.grup,
                COUNT(DISTINCT p.sicil) as personnel_count,
                AVG(ms.basari_orani) as avg_success,
                AVG(ms.atilan_tip_sayisi) as avg_test_volume
            FROM personnel p
            JOIN monthly_stats ms ON p.sicil = ms.sicil
            WHERE ms.ay = ?
            GROUP BY p.grup
            ORDER BY avg_success DESC
        `;
        const groupStatsResult = await db.execute(groupStatsQuery, [targetMonth]);
        const groupStats = groupStatsResult.rows;

        // --- 3. TREND ANALİZİ (Son 6 Ay) ---
        const trendQuery = `
            SELECT 
                ay,
                AVG(basari_orani) as avg_success,
                SUM(atilan_tip_sayisi) as total_tests
            FROM monthly_stats
            WHERE basari_orani > 0
            GROUP BY ay
            ORDER BY ay ASC
            LIMIT 6
        `;
        const trendResult = await db.execute(trendQuery);
        const trendStats = trendResult.rows;

        // --- 4. RİSKLİ PERSONEL (En Düşük 5) ---
        const riskPersonnelQuery = `
            SELECT 
                p.ad_soyad,
                p.sicil,
                p.grup,
                ms.basari_orani,
                ms.yakalanan_tip,
                ms.kacirilan_tip,
                ms.atilan_tip_sayisi
            FROM monthly_stats ms
            JOIN personnel p ON ms.sicil = p.sicil
            WHERE ms.ay = ? AND ms.atilan_tip_sayisi > 10 AND ms.basari_orani > 0
            ORDER BY ms.basari_orani ASC
            LIMIT 5
        `;
        const riskPersonnelResult = await db.execute(riskPersonnelQuery, [targetMonth]);
        const riskPersonnel = riskPersonnelResult.rows;

        // --- 5. EN İYİ PERSONEL (En Yüksek 5) ---
        const topPersonnelQuery = `
            SELECT 
                p.ad_soyad,
                p.sicil,
                p.grup,
                ms.basari_orani,
                ms.yakalanan_tip
            FROM monthly_stats ms
            JOIN personnel p ON ms.sicil = p.sicil
            WHERE ms.ay = ? AND ms.atilan_tip_sayisi > 10
            ORDER BY ms.basari_orani DESC
            LIMIT 5
        `;
        const topPersonnelResult = await db.execute(topPersonnelQuery, [targetMonth]);
        const topPersonnel = topPersonnelResult.rows;

        return NextResponse.json({
            month: targetMonth,
            overall: overallStats,
            groups: groupStats,
            trend: trendStats,
            riskList: riskPersonnel,
            topList: topPersonnel
        });

    } catch (error) {
        console.error('Manager dashboard error:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
