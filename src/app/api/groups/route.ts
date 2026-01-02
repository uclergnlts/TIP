import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { MIN_TEST_FOR_ACCOUNTABILITY } from '@/lib/business-rules';
import type { MonthlyRecord, Personnel } from '@/types';

interface GroupStats {
    grup: string;
    toplamPersonel: number;
    aktifPersonel: number; // Min test üzerinde olan
    toplamTest: number;
    toplamYesil: number;
    toplamKirmizi: number;
    toplamSari: number;
    ortalamaBasari: number;
    basariliPersonel: number; // %75 üzeri
    basarisizPersonel: number; // %75 altı
    mukemmelPersonel: number; // %98 üzeri
    enIyiPersonel?: { sicil: number; adSoyad: string; basari: number };
    enKotuPersonel?: { sicil: number; adSoyad: string; basari: number };
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month');

        // En son ayı bul
        const latestMonthResult = await db.execute('SELECT DISTINCT ay FROM monthly_stats ORDER BY ay DESC LIMIT 1');
        const latestMonth = latestMonthResult.rows[0] as unknown as { ay: string } | undefined;

        if (!latestMonth) {
            return NextResponse.json({ error: 'Veri bulunamadı' }, { status: 404 });
        }

        const targetMonth = month || latestMonth.ay;

        // Mevcut ayları listele
        const availableMonthsResult = await db.execute('SELECT DISTINCT ay FROM monthly_stats ORDER BY ay DESC');
        const availableMonths = availableMonthsResult.rows as unknown as { ay: string }[];

        // Bu aydaki tüm kayıtları al
        const columns = `
            sicil, ay, 
            kontrol_edilen_bagaj as bagaj_sayisi,
            atilan_tip_sayisi as test_sayisi,
            yakalanan_tip as yesil,
            yanlis_alarm as sari,
            kacirilan_tip as kirmizi,
            basari_orani,
            CASE 
                WHEN kontrol_edilen_bagaj > 0 THEN (CAST(yanlis_alarm AS REAL) / kontrol_edilen_bagaj) * 100 
                ELSE 0 
            END as sari_orani
        `;

        const recordsResult = await db.execute(`SELECT ${columns} FROM monthly_stats WHERE ay = ?`, [targetMonth]);
        const records = recordsResult.rows as unknown as MonthlyRecord[];

        // Tüm personeli al
        const personnelResult = await db.execute('SELECT * FROM personnel');
        const personnelList = personnelResult.rows as unknown as Personnel[];
        const personnelMap = new Map(personnelList.map(p => [p.sicil, p]));

        // Excel'den okunan resmi grup özetlerini al (varsa)
        const officialSummariesResult = await db.execute('SELECT * FROM group_summaries WHERE ay = ?', [targetMonth]);
        const officialSummaries = officialSummariesResult.rows as unknown as Array<{
            grup: string;
            toplam_bagaj: number;
            toplam_test: number;
            toplam_yesil: number;
            toplam_sari: number;
            toplam_kirmizi: number;
            basari_orani: number;
        }>;
        const officialSummaryMap = new Map(officialSummaries.map(s => [s.grup, s]));

        // Grupları belirle
        const personnelGroups = new Set(personnelList.map(p => p.grup).filter(Boolean));
        const summaryGroups = new Set(officialSummaries.map(s => s.grup));
        const groups = [...new Set([...personnelGroups, ...summaryGroups])].sort();

        // Her grup için istatistik hesapla
        const groupStats: GroupStats[] = groups.map(grup => {
            const groupPersonnel = personnelList.filter(p => p.grup === grup);
            const groupRecords = records.filter(r => {
                const p = personnelMap.get(r.sicil);
                return p && p.grup === grup;
            });

            // Resmi özet varsa onu kullan
            const official = officialSummaryMap.get(grup);

            const stats: GroupStats = {
                grup,
                toplamPersonel: groupPersonnel.length,
                aktifPersonel: groupRecords.filter(r => r.test_sayisi >= MIN_TEST_FOR_ACCOUNTABILITY).length,
                toplamTest: official?.toplam_test || groupRecords.reduce((sum, r) => sum + r.test_sayisi, 0),
                toplamYesil: official?.toplam_yesil || groupRecords.reduce((sum, r) => sum + r.yesil, 0),
                toplamKirmizi: official?.toplam_kirmizi || groupRecords.reduce((sum, r) => sum + r.kirmizi, 0),
                toplamSari: official?.toplam_sari || groupRecords.reduce((sum, r) => sum + r.sari, 0),
                ortalamaBasari: official?.basari_orani || 0,
                basariliPersonel: 0,
                basarisizPersonel: 0,
                mukemmelPersonel: 0
            };

            // Resmi oran yoksa hesapla
            if (!official && stats.toplamTest > 0) {
                stats.ortalamaBasari = (stats.toplamYesil / stats.toplamTest) * 100;
            }

            // Personel kategorilerini hesapla
            groupRecords
                .filter(r => r.test_sayisi >= MIN_TEST_FOR_ACCOUNTABILITY)
                .forEach(r => {
                    const rate = r.test_sayisi > 0 ? (r.yesil / r.test_sayisi) * 100 : 0;
                    if (rate >= 98) stats.mukemmelPersonel++;
                    if (rate >= 75) stats.basariliPersonel++;
                    else stats.basarisizPersonel++;
                });

            // En iyi ve en kötü personeli bul
            const sortedRecords = groupRecords
                .filter(r => r.test_sayisi >= MIN_TEST_FOR_ACCOUNTABILITY)
                .map(r => ({
                    sicil: r.sicil,
                    adSoyad: personnelMap.get(r.sicil)?.ad_soyad || '',
                    basari: r.test_sayisi > 0 ? (r.yesil / r.test_sayisi) * 100 : 0
                }))
                .sort((a, b) => b.basari - a.basari);

            if (sortedRecords.length > 0) {
                stats.enIyiPersonel = sortedRecords[0];
                stats.enKotuPersonel = sortedRecords[sortedRecords.length - 1];
            }

            return stats;
        });

        // Önceki ay verilerini al
        const [year, mon] = targetMonth.split('-');
        const prevMonth = parseInt(mon) === 1
            ? `${parseInt(year) - 1}-12`
            : `${year}-${(parseInt(mon) - 1).toString().padStart(2, '0')}`;

        const prevRecordsResult = await db.execute(`SELECT ${columns} FROM monthly_stats WHERE ay = ?`, [prevMonth]);
        const prevRecords = prevRecordsResult.rows as unknown as MonthlyRecord[];

        // Önceki ay grup istatistikleri
        const prevGroupStats: Record<string, number> = {};
        groups.forEach(grup => {
            const groupRecords = prevRecords.filter(r => {
                const p = personnelMap.get(r.sicil);
                return p && p.grup === grup;
            });
            const toplamTest = groupRecords.reduce((sum, r) => sum + r.test_sayisi, 0);
            const toplamYesil = groupRecords.reduce((sum, r) => sum + r.yesil, 0);
            prevGroupStats[grup] = toplamTest > 0 ? (toplamYesil / toplamTest) * 100 : 0;
        });

        return NextResponse.json({
            currentMonth: targetMonth,
            previousMonth: prevMonth,
            availableMonths: availableMonths.map(m => m.ay),
            groups: groupStats,
            previousGroupStats: prevGroupStats,
            totalPersonnel: personnelList.length,
            totalRecords: records.length
        });

    } catch (error) {
        console.error('Group comparison error:', error);
        return NextResponse.json(
            { error: 'Grup karşılaştırma verisi alınırken hata oluştu' },
            { status: 500 }
        );
    }
}
