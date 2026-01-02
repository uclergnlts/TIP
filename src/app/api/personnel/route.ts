import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculatePersonnelKPI, calculateThreeMonthAverage } from '@/lib/kpi-calculator';
import { generatePersonnelComments } from '@/lib/comment-engine';
import type { MonthlyRecord, Personnel } from '@/types';

// Personel listesini getir
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sicil = searchParams.get('sicil');
        const month = searchParams.get('month');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        // Tek personel detayı
        if (sicil) {
            const personnelResult = await db.execute('SELECT * FROM personnel WHERE sicil = ?', [parseInt(sicil)]);
            const personnel = personnelResult.rows[0] as unknown as Personnel | undefined;

            if (!personnel) {
                return NextResponse.json({ error: 'Personel bulunamadı' }, { status: 404 });
            }

            // Tüm aylık kayıtları al
            // Tüm aylık kayıtları al
            const columns = `
                id, sicil, ay,
                kontrol_edilen_bagaj as bagaj_sayisi,
                atilan_tip_sayisi as test_sayisi,
                yakalanan_tip as yesil,
                yanlis_alarm as sari,
                kacirilan_tip as kirmizi,
                basari_orani,
                CASE 
                    WHEN kontrol_edilen_bagaj > 0 THEN (CAST(yanlis_alarm AS REAL) / kontrol_edilen_bagaj) * 100 
                    ELSE 0 
                END as sari_orani,
                created_at
            `;

            const recordsResult = await db.execute(`
                SELECT ${columns} FROM monthly_stats 
                WHERE sicil = ? 
                ORDER BY ay DESC
            `, [parseInt(sicil)]);
            const records = recordsResult.rows as unknown as MonthlyRecord[];

            // Tüm kayıtları al (percentile için)
            const currentMonth = records[0]?.ay;
            let allRecordsInMonth: MonthlyRecord[] = [];

            if (currentMonth) {
                const allRecordsResult = await db.execute(`SELECT ${columns} FROM monthly_stats WHERE ay = ?`, [currentMonth]);
                allRecordsInMonth = allRecordsResult.rows as unknown as MonthlyRecord[];
            }

            // KPI hesapla
            const currentRecord = records[0];
            const previousRecord = records[1];

            const kpi = currentRecord
                ? calculatePersonnelKPI(currentRecord, previousRecord, allRecordsInMonth)
                : null;

            // Son 3 ay ortalaması
            const threeMonthAvg = calculateThreeMonthAverage(records.slice(0, 3));

            // Yorumlar
            const comments = currentRecord && kpi
                ? generatePersonnelComments(kpi, currentRecord, previousRecord)
                : [];

            return NextResponse.json({
                personnel,
                records,
                kpi: kpi ? { ...kpi, son3AyOrtalama: threeMonthAvg } : null,
                comments
            });
        }

        // Personel listesi
        let query = `
      SELECT p.*, mr.ay, mr.atilan_tip_sayisi as test_sayisi, mr.yakalanan_tip as yesil, mr.kacirilan_tip as kirmizi, mr.basari_orani
      FROM personnel p
      LEFT JOIN monthly_stats mr ON p.sicil = mr.sicil
    `;

        const params: (string | number)[] = [];
        const conditions: string[] = [];

        if (month) {
            conditions.push('mr.ay = ?');
            params.push(month);
        } else {
            // En son ayı al
            const latestMonthResult = await db.execute('SELECT MAX(ay) as ay FROM monthly_stats');
            const latestMonth = latestMonthResult.rows[0] as unknown as { ay: string } | undefined;

            if (latestMonth?.ay) {
                conditions.push('mr.ay = ?');
                params.push(latestMonth.ay);
            }
        }

        if (search) {
            conditions.push('(p.ad_soyad LIKE ? OR CAST(p.sicil AS TEXT) LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY mr.basari_orani DESC';

        // Toplam sayı
        // Count query construction needs to be simpler for Turso/SQLite
        const countQueryParts = query.split('FROM');
        const countQuery = `SELECT COUNT(*) as count FROM ${countQueryParts[1].split('ORDER BY')[0]}`;

        const totalResult = await db.execute(countQuery, params);
        const total = (totalResult.rows[0] as any)?.count || 0;

        // Sayfalama
        query += ` LIMIT ? OFFSET ?`;
        params.push(limit, (page - 1) * limit);

        const personnelListResult = await db.execute(query, params);
        const personnelList = personnelListResult.rows;

        return NextResponse.json({
            personnel: personnelList,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Personnel error:', error);
        return NextResponse.json(
            { error: 'Veri alınırken hata oluştu: ' + (error as Error).message },
            { status: 500 }
        );
    }
}
