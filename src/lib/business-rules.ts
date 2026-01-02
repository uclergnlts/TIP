// TIP Performans Sistemi - İş Kuralları

// Sorumluluk için minimum test sayısı
// Personelin TIP'den sorumlu tutulabilmesi için en az bu kadar test atılmalı
export const MIN_TEST_FOR_ACCOUNTABILITY = 40;

// Başarılı sayılma eşiği (yüzde)
// Personelin başarılı sayılabilmesi için minimum başarı oranı
export const MIN_SUCCESS_RATE = 75;

// İyi performans eşiği (yüzde)
export const GOOD_PERFORMANCE_RATE = 90;

// Mükemmel performans eşiği (yüzde)
export const EXCELLENT_PERFORMANCE_RATE = 98;

// Performans durumlarını belirle
export function getPerformanceStatus(successRate: number, testCount: number): {
    status: 'yetersiz_test' | 'basarisiz' | 'basarili' | 'iyi' | 'mukemmel';
    label: string;
    color: 'gray' | 'red' | 'amber' | 'blue' | 'green';
} {
    // Yetersiz test - sorumlu tutulamaz
    if (testCount < MIN_TEST_FOR_ACCOUNTABILITY) {
        return {
            status: 'yetersiz_test',
            label: 'Yetersiz Test',
            color: 'gray'
        };
    }

    // Başarısız - minimum başarı oranı altında
    if (successRate < MIN_SUCCESS_RATE) {
        return {
            status: 'basarisiz',
            label: 'Başarısız',
            color: 'red'
        };
    }

    // Mükemmel
    if (successRate >= EXCELLENT_PERFORMANCE_RATE) {
        return {
            status: 'mukemmel',
            label: 'Mükemmel',
            color: 'green'
        };
    }

    // İyi
    if (successRate >= GOOD_PERFORMANCE_RATE) {
        return {
            status: 'iyi',
            label: 'İyi',
            color: 'blue'
        };
    }

    // Başarılı (75-90 arası)
    return {
        status: 'basarili',
        label: 'Başarılı',
        color: 'amber'
    };
}

// Personel değerlendirmesi için açıklama metni
export function getAccountabilityMessage(testCount: number): string | null {
    if (testCount < MIN_TEST_FOR_ACCOUNTABILITY) {
        return `Bu personele ${testCount} adet test gönderilmiştir. Sorumluluk için en az ${MIN_TEST_FOR_ACCOUNTABILITY} test gereklidir.`;
    }
    return null;
}
