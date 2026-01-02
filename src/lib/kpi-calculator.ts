import type { MonthlyRecord, PersonnelKPI, MonthlyStats } from '@/types';
import { MIN_TEST_FOR_ACCOUNTABILITY } from './business-rules';

// Personel KPI hesapla
export function calculatePersonnelKPI(
    current: MonthlyRecord,
    previous?: MonthlyRecord,
    allRecordsInMonth?: MonthlyRecord[]
): PersonnelKPI {
    const kpi: PersonnelKPI = {
        basariOrani: current.test_sayisi > 0
            ? (current.yesil / current.test_sayisi) * 100
            : 0,
        kirmiziOrani: current.test_sayisi > 0
            ? (current.kirmizi / current.test_sayisi) * 100
            : 0,
        sariOrani: current.bagaj_sayisi > 0
            ? (current.sari / current.bagaj_sayisi) * 100
            : 0,
        testYogunlugu: current.test_sayisi
    };

    // Aylık değişim hesapla
    if (previous) {
        const prevBasari = previous.test_sayisi > 0
            ? (previous.yesil / previous.test_sayisi) * 100
            : 0;
        kpi.aylikDegisim = kpi.basariOrani - prevBasari;
        kpi.kirmiziDegisim = current.kirmizi - previous.kirmizi;
    }

    // Percentile hesapla (benzer test yoğunluğundaki personellerle karşılaştır)
    if (allRecordsInMonth && allRecordsInMonth.length > 1) {
        // Minimum test yapanları filtrele
        const qualifiedRecords = allRecordsInMonth.filter(r => r.test_sayisi >= MIN_TEST_FOR_ACCOUNTABILITY);

        if (qualifiedRecords.length > 1 && current.test_sayisi >= MIN_TEST_FOR_ACCOUNTABILITY) {
            // Başarı oranına göre sırala
            const sorted = [...qualifiedRecords].sort((a, b) => {
                const aRate = a.test_sayisi > 0 ? a.yesil / a.test_sayisi : 0;
                const bRate = b.test_sayisi > 0 ? b.yesil / b.test_sayisi : 0;
                return aRate - bRate;
            });

            const position = sorted.findIndex(r => r.sicil === current.sicil);
            kpi.percentile = Math.round((position / (sorted.length - 1)) * 100);
        }
    }

    return kpi;
}

// Son 3 ay ortalamasını hesapla
export function calculateThreeMonthAverage(records: MonthlyRecord[]): number {
    if (records.length === 0) return 0;

    const rates = records.map(r =>
        r.test_sayisi > 0 ? (r.yesil / r.test_sayisi) * 100 : 0
    );

    return rates.reduce((a, b) => a + b, 0) / rates.length;
}

// Aylık istatistikleri hesapla
export function calculateMonthlyStats(records: MonthlyRecord[], ay: string): MonthlyStats {
    const stats: MonthlyStats = {
        ay,
        toplamPersonel: records.length,
        toplamBagaj: 0,
        toplamTest: 0,
        toplamYesil: 0,
        toplamSari: 0,
        toplamKirmizi: 0,
        ortalamaBasari: 0
    };

    if (records.length === 0) return stats;

    records.forEach(r => {
        stats.toplamBagaj += r.bagaj_sayisi;
        stats.toplamTest += r.test_sayisi;
        stats.toplamYesil += r.yesil;
        stats.toplamSari += r.sari;
        stats.toplamKirmizi += r.kirmizi;
    });

    stats.ortalamaBasari = stats.toplamTest > 0
        ? (stats.toplamYesil / stats.toplamTest) * 100
        : 0;

    return stats;
}

// En iyi performans gösterenleri bul
export function getTopPerformers(records: MonthlyRecord[], limit: number = 10): MonthlyRecord[] {
    return [...records]
        .filter(r => r.test_sayisi >= MIN_TEST_FOR_ACCOUNTABILITY) // Minimum test eşiği
        .sort((a, b) => {
            const aRate = a.test_sayisi > 0 ? a.yesil / a.test_sayisi : 0;
            const bRate = b.test_sayisi > 0 ? b.yesil / b.test_sayisi : 0;
            return bRate - aRate;
        })
        .slice(0, limit);
}

// Risk altındaki personeli bul (yüksek kırmızı oranı)
export function getRiskPersonnel(records: MonthlyRecord[], limit: number = 10): MonthlyRecord[] {
    return [...records]
        .filter(r => r.test_sayisi >= MIN_TEST_FOR_ACCOUNTABILITY && r.kirmizi > 0)
        .sort((a, b) => {
            const aRate = a.test_sayisi > 0 ? a.kirmizi / a.test_sayisi : 0;
            const bRate = b.test_sayisi > 0 ? b.kirmizi / b.test_sayisi : 0;
            return bRate - aRate;
        })
        .slice(0, limit);
}

// En çok gelişen personeli bul (aylar arası)
export function getMostImproved(
    currentRecords: MonthlyRecord[],
    previousRecords: MonthlyRecord[],
    limit: number = 10
): Array<{ sicil: number; improvement: number }> {
    const previousMap = new Map(previousRecords.map(r => [r.sicil, r]));

    const improvements: Array<{ sicil: number; improvement: number }> = [];

    currentRecords
        .filter(r => r.test_sayisi >= MIN_TEST_FOR_ACCOUNTABILITY)
        .forEach(current => {
            const prev = previousMap.get(current.sicil);
            if (prev && prev.test_sayisi >= MIN_TEST_FOR_ACCOUNTABILITY) {
                const currentRate = current.yesil / current.test_sayisi * 100;
                const prevRate = prev.yesil / prev.test_sayisi * 100;
                improvements.push({
                    sicil: current.sicil,
                    improvement: currentRate - prevRate
                });
            }
        });

    return improvements
        .sort((a, b) => b.improvement - a.improvement)
        .slice(0, limit);
}

