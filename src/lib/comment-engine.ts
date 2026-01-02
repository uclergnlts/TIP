import type { PersonnelKPI, Comment, MonthlyRecord } from '@/types';
import {
    MIN_TEST_FOR_ACCOUNTABILITY,
    MIN_SUCCESS_RATE,
    GOOD_PERFORMANCE_RATE,
    EXCELLENT_PERFORMANCE_RATE,
    getPerformanceStatus
} from './business-rules';

// Yorum tipleri için ikonlar
const ICONS = {
    success: '✅',
    warning: '⚠️',
    info: 'ℹ️',
    achievement: '🏆',
    improvement: '📈',
    decline: '📉',
    perfect: '🎯',
    risk: '🔴',
    notApplicable: '⏸️'
};

// Personel için otomatik yorumlar üret
export function generatePersonnelComments(
    kpi: PersonnelKPI,
    record: MonthlyRecord,
    previousRecord?: MonthlyRecord
): Comment[] {
    const comments: Comment[] = [];

    // Önce test yeterliliği kontrolü
    if (record.test_sayisi < MIN_TEST_FOR_ACCOUNTABILITY) {
        comments.push({
            type: 'info',
            icon: ICONS.notApplicable,
            text: `Bu ay ${record.test_sayisi} adet test atılmıştır. Sorumluluk için en az ${MIN_TEST_FOR_ACCOUNTABILITY} test gereklidir.`
        });
        return comments; // Yetersiz test durumunda diğer yorumları ekleme
    }

    // Performans durumu
    const status = getPerformanceStatus(kpi.basariOrani, record.test_sayisi);

    // Başarı oranı yorumları (yeni eşikler)
    if (kpi.basariOrani >= EXCELLENT_PERFORMANCE_RATE) {
        comments.push({
            type: 'achievement',
            icon: ICONS.perfect,
            text: `Mükemmel! %${kpi.basariOrani.toFixed(1)} başarı oranına ulaştınız.`
        });
    } else if (kpi.basariOrani >= GOOD_PERFORMANCE_RATE) {
        comments.push({
            type: 'success',
            icon: ICONS.success,
            text: `Başarı oranınız %${kpi.basariOrani.toFixed(1)} ile çok iyi seviyede.`
        });
    } else if (kpi.basariOrani >= MIN_SUCCESS_RATE) {
        comments.push({
            type: 'success',
            icon: ICONS.success,
            text: `Başarı oranınız %${kpi.basariOrani.toFixed(1)} ile başarılı sayılmaktadır.`
        });
    } else {
        comments.push({
            type: 'warning',
            icon: ICONS.risk,
            text: `Başarı oranınız %${kpi.basariOrani.toFixed(1)} - minimum %${MIN_SUCCESS_RATE} gerekli. İyileştirme programına dahil edileceksiniz.`
        });
    }

    // Aylık değişim yorumları
    if (previousRecord && kpi.aylikDegisim !== undefined) {
        if (kpi.aylikDegisim > 2) {
            comments.push({
                type: 'success',
                icon: ICONS.improvement,
                text: `Geçen aya göre başarı oranınız %${kpi.aylikDegisim.toFixed(1)} arttı!`
            });
        } else if (kpi.aylikDegisim < -2) {
            comments.push({
                type: 'warning',
                icon: ICONS.decline,
                text: `Geçen aya göre başarı oranınız %${Math.abs(kpi.aylikDegisim).toFixed(1)} düştü.`
            });
        } else {
            comments.push({
                type: 'info',
                icon: ICONS.info,
                text: 'Performansınız geçen ayla benzer seviyede.'
            });
        }
    }

    // Kırmızı (kaçırılan test) yorumları
    if (record.kirmizi === 0) {
        comments.push({
            type: 'achievement',
            icon: ICONS.perfect,
            text: 'Bu ay hiç test kaçırmadınız! Harika!'
        });
    } else if (previousRecord && kpi.kirmiziDegisim !== undefined) {
        if (kpi.kirmiziDegisim < 0) {
            comments.push({
                type: 'success',
                icon: ICONS.success,
                text: `Kaçırılan test sayınız ${previousRecord.kirmizi}'den ${record.kirmizi}'e düştü.`
            });
        } else if (kpi.kirmiziDegisim > 0) {
            comments.push({
                type: 'warning',
                icon: ICONS.risk,
                text: `Kaçırılan test sayınız ${previousRecord.kirmizi}'den ${record.kirmizi}'e çıktı.`
            });
        }
    }

    // Percentile yorumları
    if (kpi.percentile !== undefined) {
        if (kpi.percentile >= 90) {
            comments.push({
                type: 'achievement',
                icon: ICONS.achievement,
                text: `Benzer iş yükündeki personelin en iyi %${100 - kpi.percentile} içindesiniz!`
            });
        } else if (kpi.percentile >= 75) {
            comments.push({
                type: 'success',
                icon: ICONS.success,
                text: `Grubunuzun %${kpi.percentile}'ından daha iyi performans gösterdiniz.`
            });
        } else if (kpi.percentile < 25) {
            comments.push({
                type: 'warning',
                icon: ICONS.warning,
                text: 'Performansınız grup ortalamasının altında - destek alabilirsiniz.'
            });
        }
    }

    // Sarı (yanlış alarm) yorumu
    if (kpi.sariOrani > 1) {
        comments.push({
            type: 'info',
            icon: ICONS.info,
            text: `Yanlış alarm oranınız %${kpi.sariOrani.toFixed(2)} - görüntü analizi eğitimi önerilir.`
        });
    }

    return comments;
}

// Amir için özet yorum üret
export function generateSummaryComment(
    currentStats: { ortalamaBasari: number; toplamKirmizi: number; toplamPersonel: number },
    previousStats?: { ortalamaBasari: number; toplamKirmizi: number; toplamPersonel: number }
): string[] {
    const summaries: string[] = [];

    // Genel başarı değerlendirmesi (yeni eşikler)
    if (currentStats.ortalamaBasari >= EXCELLENT_PERFORMANCE_RATE) {
        summaries.push(`Ekip ortalaması %${currentStats.ortalamaBasari.toFixed(1)} ile mükemmel seviyede.`);
    } else if (currentStats.ortalamaBasari >= GOOD_PERFORMANCE_RATE) {
        summaries.push(`Ekip ortalaması %${currentStats.ortalamaBasari.toFixed(1)} ile çok iyi seviyede.`);
    } else if (currentStats.ortalamaBasari >= MIN_SUCCESS_RATE) {
        summaries.push(`Ekip ortalaması %${currentStats.ortalamaBasari.toFixed(1)} ile başarılı sayılmaktadır.`);
    } else {
        summaries.push(`Ekip ortalaması %${currentStats.ortalamaBasari.toFixed(1)} - minimum %${MIN_SUCCESS_RATE} altında! Genel eğitim planlanmalı.`);
    }

    // Aylık karşılaştırma
    if (previousStats) {
        const basariDegisim = currentStats.ortalamaBasari - previousStats.ortalamaBasari;
        const kirmiziDegisim = currentStats.toplamKirmizi - previousStats.toplamKirmizi;

        if (basariDegisim > 0) {
            summaries.push(`Geçen aya göre %${basariDegisim.toFixed(1)} iyileşme sağlandı.`);
        } else if (basariDegisim < 0) {
            summaries.push(`Geçen aya göre %${Math.abs(basariDegisim).toFixed(1)} düşüş yaşandı.`);
        }

        if (kirmiziDegisim < 0) {
            summaries.push(`Toplam kaçırılan test ${Math.abs(kirmiziDegisim)} adet azaldı.`);
        } else if (kirmiziDegisim > 0) {
            summaries.push(`Toplam kaçırılan test ${kirmiziDegisim} adet arttı - dikkat edilmeli.`);
        }
    }

    return summaries;
}

