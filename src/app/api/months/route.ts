import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get all months that have data loaded
export async function GET() {
    try {
        // Get distinct months with record counts
        const result = await db.execute(`
      SELECT 
        ay,
        COUNT(DISTINCT sicil) as personel_sayisi,
        SUM(atilan_tip_sayisi) as toplam_test,
        SUM(yakalanan_tip) as toplam_yesil,
        SUM(kacirilan_tip) as toplam_kirmizi
      FROM monthly_stats 
      GROUP BY ay 
      ORDER BY ay DESC
    `);

        const months = result.rows as unknown as Array<{
            ay: string;
            personel_sayisi: number;
            toplam_test: number;
            toplam_yesil: number;
            toplam_kirmizi: number;
        }>;

        return NextResponse.json({
            months: months.map(m => ({
                ...m,
                basari_orani: m.toplam_test > 0
                    ? ((m.toplam_yesil / m.toplam_test) * 100).toFixed(1)
                    : '0'
            })),
            totalMonths: months.length
        });

    } catch (error) {
        console.error('Error getting loaded months:', error);
        return NextResponse.json({ months: [], totalMonths: 0 });
    }
}
