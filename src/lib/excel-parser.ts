import * as XLSX from 'xlsx';
import type { ExcelRow, Personnel, MonthlyRecord } from '@/types';

// Grup özet verisi tipi
export interface GroupSummary {
    grup: string;
    toplamBagaj: number;
    toplamTest: number;
    toplamYesil: number;
    toplamSari: number;
    toplamKirmizi: number;
    basariOrani: number;
}

// Kolon isimlerini normalize et
function normalizeColumnName(name: string): string {
    if (!name) return '';
    return name
        .toString()
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/\n/g, ' ')
        .trim();
}

// Kolon eşleştirme haritası
const COLUMN_MAPPINGS: Record<string, string[]> = {
    siraNo: ['s.no', 'sira', 'sıra', 'no'],
    sicil: ['sicili', 'sicil', 'sicil no', 'sicil numarası'],
    adSoyad: ['adı soyadı', 'ad soyad', 'adsoyad', 'isim'],
    gorev: ['görevi', 'gorev', 'görev', 'unvan'],
    grup: ['grubu', 'grup', 'group'],
    bagajSayisi: ['kontrol edilen bagaj', 'bagaj sayısı', 'bagaj', 'kontrol edilen'],
    testSayisi: ['atılan test', 'test sayısı', 'test', 'atılan'],
    yakalanan: ['yakalanan', 'yeşil', 'yesil', 'yakalanan test'],
    yanlis: ['yanlış', 'sarı', 'sari', 'yanlis'],
    kacirilan: ['kaçırılan', 'kırmızı', 'kirmizi', 'kacirilan'],
    basariDurumu: ['başarı durumu', 'başarı', 'basari', 'başarı oranı'],
    sariDegerlendirme: ['sarı değerlendirmesi', 'sarı değerlendirme', 'sari degerlendirme']
};

// Kolon indexlerini bul
function findColumnIndexes(headers: string[]): Record<string, number> {
    const indexes: Record<string, number> = {};

    headers.forEach((header, index) => {
        const normalized = normalizeColumnName(header);

        for (const [key, patterns] of Object.entries(COLUMN_MAPPINGS)) {
            if (patterns.some(pattern => normalized.includes(pattern))) {
                if (!(key in indexes)) { // İlk eşleşmeyi al
                    indexes[key] = index;
                }
            }
        }
    });

    return indexes;
}

// Sayısal değeri güvenli oku
function safeNumber(value: unknown): number {
    if (value === null || value === undefined || value === '') return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
}

// Grup özet satırını parse et (tek satırlık özetler için)
function parseGroupSummaryRow(row: unknown[], columnIndexes: Record<string, number>): GroupSummary | null {
    const firstCell = String(row[0] || '').toUpperCase();

    // "X GRUBU TOPLAMI" formatını kontrol et
    const match = firstCell.match(/([A-Z])\s*GRUBU\s*TOPLAMI/);
    if (!match) return null;

    const grup = match[1];

    return {
        grup,
        toplamBagaj: safeNumber(row[columnIndexes.bagajSayisi]),
        toplamTest: safeNumber(row[columnIndexes.testSayisi]),
        toplamYesil: safeNumber(row[columnIndexes.yakalanan]),
        toplamSari: safeNumber(row[columnIndexes.yanlis]),
        toplamKirmizi: safeNumber(row[columnIndexes.kacirilan]),
        basariOrani: safeNumber(row[columnIndexes.basariDurumu])
    };
}

// Karşılaştırma tablosunu tara (A, B, C, D grupları için)
function parseComparisonTable(rawData: unknown[][]): GroupSummary[] {
    const summaries: GroupSummary[] = [];

    // Tablo başlığını bul
    let tableHeaderRow = -1;
    for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row) continue;

        // 5. kolonda "Grubu" veya "Grup" yazan satırı ara
        if (row[5] && String(row[5]).includes('Grubu') && row[11] && String(row[11]).includes('Başarı')) {
            tableHeaderRow = i;
            break;
        }
    }

    if (tableHeaderRow === -1) return [];

    // Başlığın altındaki satırları oku (A, B, C, D grupları)
    for (let i = tableHeaderRow + 1; i < Math.min(tableHeaderRow + 10, rawData.length); i++) {
        const row = rawData[i];
        if (!row) continue;

        const groupNameCell = String(row[5] || '');
        const match = groupNameCell.match(/([A-Z])\s*Grubu/i);

        if (match) {
            const grup = match[1].toUpperCase();

            // Mevcut satırdaki verileri oku (sabit indexler)
            // Index 5: Grup Adı
            // Index 6: Bagaj
            // Index 7: Test
            // Index 8: Yeşil
            // Index 9: Sarı (Yanlış)
            // Index 10: Kırmızı (Kaçırılan)
            // Index 11: Başarı Oranı

            summaries.push({
                grup,
                toplamBagaj: safeNumber(row[6]),
                toplamTest: safeNumber(row[7]),
                toplamYesil: safeNumber(row[8]),
                toplamSari: safeNumber(row[9]),
                toplamKirmizi: safeNumber(row[10]),
                basariOrani: safeNumber(row[11])
            });
        }
    }

    return summaries;
}

// Excel dosyasını parse et
export function parseExcelFile(buffer: Buffer, month: string): {
    personnel: Personnel[];
    records: MonthlyRecord[];
    groupSummaries: GroupSummary[];
    errors: string[];
} {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Tüm veriyi raw olarak al
    const rawData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });

    if (rawData.length < 3) {
        return { personnel: [], records: [], groupSummaries: [], errors: ['Excel dosyası çok az veri içeriyor'] };
    }

    // Header satırını bul (genellikle 2. satır)
    let headerRowIndex = 1;
    for (let i = 0; i < Math.min(5, rawData.length); i++) {
        const row = rawData[i] as string[];
        if (row && row.some(cell =>
            cell && normalizeColumnName(String(cell)).includes('sicil')
        )) {
            headerRowIndex = i;
            break;
        }
    }

    const headers = (rawData[headerRowIndex] as string[]).map(h => String(h || ''));
    const columnIndexes = findColumnIndexes(headers);

    const personnel: Personnel[] = [];
    const records: MonthlyRecord[] = [];
    let groupSummaries: GroupSummary[] = [];
    const errors: string[] = [];

    // Gerekli kolonların varlığını kontrol et
    if (!('sicil' in columnIndexes)) {
        errors.push('Sicil kolonu bulunamadı');
        return { personnel, records, groupSummaries, errors };
    }

    // Karşılaştırma tablosunu ara
    const comparisonSummaries = parseComparisonTable(rawData);
    if (comparisonSummaries.length > 0) {
        groupSummaries = comparisonSummaries;
    }

    // Veri satırlarını işle
    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const row = rawData[i] as unknown[];
        if (!row || row.length === 0) continue;

        // Grup özet satırı mı kontrol et (Eğer karşılaştırma tablosu bulunamadıysa buradan al)
        if (groupSummaries.length === 0) {
            const groupSummary = parseGroupSummaryRow(row, columnIndexes);
            if (groupSummary) {
                groupSummaries.push(groupSummary);
                continue; // Normal kayıt olarak işleme
            }
        } else {
            // Karşılaştırma tablosu varsa bile "B GRUBU TOPLAMI" gibi satırları personel listesine eklememek için kontrol et
            const firstCell = String(row[0] || '').toUpperCase();
            if (firstCell.includes('GRUBU TOPLAMI')) continue;
        }

        const sicil = safeNumber(row[columnIndexes.sicil]);
        if (!sicil || sicil === 0) continue; // Geçersiz sicil atla

        // Personel bilgileri
        const person: Personnel = {
            sicil,
            ad_soyad: String(row[columnIndexes.adSoyad] || '').trim(),
            gorev: String(row[columnIndexes.gorev] || '').trim(),
            grup: String(row[columnIndexes.grup] || '').trim()
        };

        // Aylık kayıt
        const record: MonthlyRecord = {
            sicil,
            ay: month,
            bagaj_sayisi: safeNumber(row[columnIndexes.bagajSayisi]),
            test_sayisi: safeNumber(row[columnIndexes.testSayisi]),
            yesil: safeNumber(row[columnIndexes.yakalanan]),
            sari: safeNumber(row[columnIndexes.yanlis]),
            kirmizi: safeNumber(row[columnIndexes.kacirilan]),
            basari_orani: safeNumber(row[columnIndexes.basariDurumu]),
            sari_orani: safeNumber(row[columnIndexes.sariDegerlendirme])
        };

        personnel.push(person);
        records.push(record);
    }

    // Grup özetleri bulunduysa logla
    if (groupSummaries.length > 0) {
        console.log(`Excel'den ${groupSummaries.length} grup özeti okundu:`,
            groupSummaries.map(g => `${g.grup}: %${g.basariOrani.toFixed(1)}`).join(', ')
        );
    }

    return { personnel, records, groupSummaries, errors };
}

// Ay formatını standartlaştır
export function formatMonth(input: string): string {
    // "2024-10" veya "Ekim 2024" veya "10/2024" formatlarını kabul et
    const match = input.match(/(\d{4})[/-]?(\d{1,2})|(\d{1,2})[/-](\d{4})/);
    if (match) {
        const year = match[1] || match[4];
        const month = (match[2] || match[3]).padStart(2, '0');
        return `${year}-${month}`;
    }
    return input;
}

