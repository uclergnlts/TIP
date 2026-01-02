import PDFDocument from 'pdfkit';
import { getDb } from './db';
import { calculatePersonnelKPI, calculateMonthlyStats } from './kpi-calculator';
import { generatePersonnelComments, generateSummaryComment } from './comment-engine';
import type { Personnel, MonthlyRecord } from '@/types';

// Türkçe ay isimleri
const monthNames: Record<string, string> = {
    '01': 'Ocak', '02': 'Şubat', '03': 'Mart', '04': 'Nisan',
    '05': 'Mayıs', '06': 'Haziran', '07': 'Temmuz', '08': 'Ağustos',
    '09': 'Eylül', '10': 'Ekim', '11': 'Kasım', '12': 'Aralık'
};

function formatMonth(ay: string): string {
    const [year, month] = ay.split('-');
    return `${monthNames[month] || month} ${year}`;
}

function formatDate(): string {
    const now = new Date();
    return now.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

// Personel TIP Raporu PDF oluştur
export async function generatePersonnelReportPDF(sicil: number, month?: string): Promise<Buffer> {
    const db = getDb();

    // Personel bilgisi
    const personnel = db.prepare('SELECT * FROM personnel WHERE sicil = ?').get(sicil) as Personnel;
    if (!personnel) throw new Error('Personel bulunamadı');

    // Aylık kayıtlar
    const records = db.prepare(`
    SELECT * FROM monthly_records WHERE sicil = ? ORDER BY ay DESC LIMIT 6
  `).all(sicil) as MonthlyRecord[];

    if (records.length === 0) throw new Error('Kayıt bulunamadı');

    const currentRecord = month
        ? records.find(r => r.ay === month) || records[0]
        : records[0];
    const previousRecord = records[1];

    // KPI ve yorumlar
    const allRecordsInMonth = db.prepare('SELECT * FROM monthly_records WHERE ay = ?')
        .all(currentRecord.ay) as MonthlyRecord[];

    const kpi = calculatePersonnelKPI(currentRecord, previousRecord, allRecordsInMonth);
    const comments = generatePersonnelComments(kpi, currentRecord, previousRecord);

    // PDF oluştur
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            info: {
                Title: `TIP Raporu - ${personnel.ad_soyad}`,
                Author: 'TIP Performans Analiz Sistemi'
            }
        });

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Başlık
        doc.fontSize(20).font('Helvetica-Bold')
            .text('TIP PERFORMANS RAPORU', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica')
            .text(formatMonth(currentRecord.ay), { align: 'center' });
        doc.moveDown(1);

        // Personel bilgileri kutusu
        doc.rect(50, doc.y, 495, 80).stroke();
        const boxY = doc.y + 15;
        doc.fontSize(14).font('Helvetica-Bold')
            .text(personnel.ad_soyad, 70, boxY);
        doc.fontSize(10).font('Helvetica')
            .text(`Sicil No: ${personnel.sicil}`, 70, boxY + 20)
            .text(`Görev: ${personnel.gorev || 'Güvenlik Görevlisi'}`, 70, boxY + 35)
            .text(`Grup: ${personnel.grup} Grubu`, 70, boxY + 50);

        // Başarı oranı sağ tarafta
        doc.fontSize(32).font('Helvetica-Bold')
            .text(`%${kpi.basariOrani.toFixed(1)}`, 380, boxY + 10);
        doc.fontSize(10).font('Helvetica')
            .text('Başarı Oranı', 380, boxY + 50);

        doc.y = boxY + 80;
        doc.moveDown(1);

        // KPI Tablosu
        doc.fontSize(12).font('Helvetica-Bold').text('PERFORMANS ÖZETİ');
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const col1 = 50, col2 = 200, col3 = 350;

        // Tablo başlıkları
        doc.fontSize(10).font('Helvetica-Bold')
            .text('Metrik', col1, tableTop)
            .text('Değer', col2, tableTop)
            .text('Durum', col3, tableTop);

        doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();

        // Tablo verileri
        const tableData = [
            ['Kontrol Edilen Bagaj', currentRecord.bagaj_sayisi.toLocaleString(), ''],
            ['Atılan Test', currentRecord.test_sayisi.toString(), ''],
            ['Yakalanan (Yeşil)', currentRecord.yesil.toString(), 'Başarılı'],
            ['Yanlış Alarm (Sarı)', currentRecord.sari.toString(), currentRecord.sari > 10 ? 'Dikkat' : 'Normal'],
            ['Kaçırılan (Kırmızı)', currentRecord.kirmizi.toString(), currentRecord.kirmizi > 0 ? 'Kritik' : 'Mükemmel'],
            ['Başarı Oranı', `%${kpi.basariOrani.toFixed(2)}`, kpi.basariOrani >= 98 ? 'Mükemmel' : kpi.basariOrani >= 95 ? 'İyi' : 'Geliştirilmeli'],
            ['Kırmızı Oranı', `%${kpi.kirmiziOrani.toFixed(2)}`, ''],
            ['Sarı Oranı', `%${kpi.sariOrani.toFixed(2)}`, '']
        ];

        let rowY = tableTop + 25;
        doc.font('Helvetica');
        tableData.forEach(([label, value, status]) => {
            doc.text(label, col1, rowY)
                .text(value, col2, rowY)
                .text(status, col3, rowY);
            rowY += 18;
        });

        doc.y = rowY + 10;
        doc.moveDown(1);

        // Karşılaştırma
        if (previousRecord) {
            doc.fontSize(12).font('Helvetica-Bold').text('AYLIK KARŞILAŞTIRMA');
            doc.moveDown(0.5);

            const degisim = kpi.aylikDegisim || 0;
            const kirmiziDegisim = kpi.kirmiziDegisim || 0;

            doc.fontSize(10).font('Helvetica')
                .text(`Önceki Ay: ${formatMonth(previousRecord.ay)}`)
                .text(`Başarı Değişimi: ${degisim >= 0 ? '+' : ''}${degisim.toFixed(2)}%`)
                .text(`Kırmızı Değişimi: ${kirmiziDegisim >= 0 ? '+' : ''}${kirmiziDegisim} adet`);

            doc.moveDown(1);
        }

        // Yorumlar
        if (comments.length > 0) {
            doc.fontSize(12).font('Helvetica-Bold').text('DEĞERLENDİRME');
            doc.moveDown(0.5);

            doc.fontSize(10).font('Helvetica');
            comments.forEach(comment => {
                doc.text(`${comment.icon} ${comment.text}`);
                doc.moveDown(0.3);
            });
            doc.moveDown(1);
        }

        // Percentile
        if (kpi.percentile !== undefined) {
            doc.fontSize(10).font('Helvetica')
                .text(`Sıralama: Benzer iş yükündeki personelin %${kpi.percentile}'ından daha iyi performans gösterdiniz.`);
            doc.moveDown(1);
        }

        // Geçmiş tablosu
        if (records.length > 1) {
            doc.fontSize(12).font('Helvetica-Bold').text('SON 6 AY GEÇMİŞİ');
            doc.moveDown(0.5);

            const historyTop = doc.y;
            doc.fontSize(9).font('Helvetica-Bold')
                .text('Dönem', 50, historyTop)
                .text('Test', 150, historyTop)
                .text('Yeşil', 210, historyTop)
                .text('Kırmızı', 270, historyTop)
                .text('Sarı', 330, historyTop)
                .text('Başarı', 390, historyTop);

            doc.moveTo(50, historyTop + 12).lineTo(450, historyTop + 12).stroke();

            let historyY = historyTop + 18;
            doc.font('Helvetica');
            records.slice(0, 6).forEach(r => {
                const rate = r.test_sayisi > 0 ? (r.yesil / r.test_sayisi * 100).toFixed(1) : '0';
                doc.text(formatMonth(r.ay), 50, historyY)
                    .text(r.test_sayisi.toString(), 150, historyY)
                    .text(r.yesil.toString(), 210, historyY)
                    .text(r.kirmizi.toString(), 270, historyY)
                    .text(r.sari.toString(), 330, historyY)
                    .text(`%${rate}`, 390, historyY);
                historyY += 15;
            });
        }

        // Footer
        doc.fontSize(8).font('Helvetica')
            .text(`Rapor Tarihi: ${formatDate()}`, 50, 780)
            .text('TIP Performans Analiz Sistemi', 50, 795, { align: 'center' });

        doc.end();
    });
}

// Aylık Genel Değerlendirme Raporu
export async function generateMonthlyReportPDF(month: string): Promise<Buffer> {
    const db = getDb();

    // Bu ayın kayıtları
    const records = db.prepare('SELECT * FROM monthly_records WHERE ay = ?').all(month) as MonthlyRecord[];
    if (records.length === 0) throw new Error('Kayıt bulunamadı');

    // Önceki ay
    const [year, mon] = month.split('-');
    const prevMonth = parseInt(mon) === 1
        ? `${parseInt(year) - 1}-12`
        : `${year}-${(parseInt(mon) - 1).toString().padStart(2, '0')}`;

    const prevRecords = db.prepare('SELECT * FROM monthly_records WHERE ay = ?').all(prevMonth) as MonthlyRecord[];

    // İstatistikler
    const currentStats = calculateMonthlyStats(records, month);
    const prevStats = prevRecords.length > 0 ? calculateMonthlyStats(prevRecords, prevMonth) : null;

    // Yorumlar
    const summaryComments = generateSummaryComment(currentStats, prevStats || undefined);

    // Personel bilgileri
    const personnelMap = new Map(
        (db.prepare('SELECT * FROM personnel').all() as Personnel[]).map(p => [p.sicil, p])
    );

    // En iyi ve en kötü performans
    const sortedBySuccess = [...records]
        .filter(r => r.test_sayisi >= 50)
        .sort((a, b) => (b.yesil / b.test_sayisi) - (a.yesil / a.test_sayisi));

    const topPerformers = sortedBySuccess.slice(0, 10);
    const riskPersonnel = sortedBySuccess.slice(-5).reverse();

    // PDF oluştur
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            info: {
                Title: `TIP Aylık Rapor - ${formatMonth(month)}`,
                Author: 'TIP Performans Analiz Sistemi'
            }
        });

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Başlık
        doc.fontSize(20).font('Helvetica-Bold')
            .text('AYLIK TIP DEĞERLENDİRME RAPORU', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(14).font('Helvetica')
            .text(formatMonth(month), { align: 'center' });
        doc.moveDown(1);

        // Genel İstatistikler
        doc.fontSize(12).font('Helvetica-Bold').text('GENEL İSTATİSTİKLER');
        doc.moveDown(0.5);

        const statsData = [
            ['Toplam Personel', currentStats.toplamPersonel.toString()],
            ['Toplam Kontrol Bagaj', currentStats.toplamBagaj.toLocaleString()],
            ['Toplam Atılan Test', currentStats.toplamTest.toLocaleString()],
            ['Toplam Yakalanan (Yeşil)', currentStats.toplamYesil.toLocaleString()],
            ['Toplam Yanlış Alarm (Sarı)', currentStats.toplamSari.toString()],
            ['Toplam Kaçırılan (Kırmızı)', currentStats.toplamKirmizi.toString()],
            ['Ortalama Başarı Oranı', `%${currentStats.ortalamaBasari.toFixed(2)}`]
        ];

        doc.fontSize(10).font('Helvetica');
        statsData.forEach(([label, value]) => {
            doc.text(`${label}: ${value}`);
        });
        doc.moveDown(1);

        // Karşılaştırma
        if (prevStats) {
            doc.fontSize(12).font('Helvetica-Bold').text('ÖNCEKI AY KARŞILAŞTIRMASI');
            doc.moveDown(0.5);

            const basariDegisim = currentStats.ortalamaBasari - prevStats.ortalamaBasari;
            const kirmiziDegisim = currentStats.toplamKirmizi - prevStats.toplamKirmizi;

            doc.fontSize(10).font('Helvetica')
                .text(`Önceki Ay: ${formatMonth(prevMonth)}`)
                .text(`Başarı Değişimi: ${basariDegisim >= 0 ? '+' : ''}${basariDegisim.toFixed(2)}%`)
                .text(`Kırmızı Değişimi: ${kirmiziDegisim >= 0 ? '+' : ''}${kirmiziDegisim} adet`);
            doc.moveDown(1);
        }

        // Değerlendirme yorumları
        if (summaryComments.length > 0) {
            doc.fontSize(12).font('Helvetica-Bold').text('DEĞERLENDİRME');
            doc.moveDown(0.5);

            doc.fontSize(10).font('Helvetica');
            summaryComments.forEach(comment => {
                doc.text(`• ${comment}`);
            });
            doc.moveDown(1);
        }

        // En iyi performans
        doc.fontSize(12).font('Helvetica-Bold').text('EN İYİ PERFORMANS (İLK 10)');
        doc.moveDown(0.5);

        const topTableY = doc.y;
        doc.fontSize(9).font('Helvetica-Bold')
            .text('#', 50, topTableY)
            .text('Sicil', 70, topTableY)
            .text('Ad Soyad', 120, topTableY)
            .text('Test', 280, topTableY)
            .text('Yeşil', 320, topTableY)
            .text('Kırmızı', 360, topTableY)
            .text('Başarı', 410, topTableY);

        doc.moveTo(50, topTableY + 12).lineTo(460, topTableY + 12).stroke();

        let topRowY = topTableY + 18;
        doc.font('Helvetica');
        topPerformers.forEach((r, i) => {
            const p = personnelMap.get(r.sicil);
            const rate = (r.yesil / r.test_sayisi * 100).toFixed(1);
            doc.text((i + 1).toString(), 50, topRowY)
                .text(r.sicil.toString(), 70, topRowY)
                .text(p?.ad_soyad || '-', 120, topRowY)
                .text(r.test_sayisi.toString(), 280, topRowY)
                .text(r.yesil.toString(), 320, topRowY)
                .text(r.kirmizi.toString(), 360, topRowY)
                .text(`%${rate}`, 410, topRowY);
            topRowY += 14;
        });

        doc.y = topRowY + 10;
        doc.moveDown(1);

        // Dikkat gerektiren personel
        if (riskPersonnel.length > 0) {
            doc.fontSize(12).font('Helvetica-Bold').text('DİKKAT GEREKTİREN PERSONEL');
            doc.moveDown(0.5);

            const riskTableY = doc.y;
            doc.fontSize(9).font('Helvetica-Bold')
                .text('#', 50, riskTableY)
                .text('Sicil', 70, riskTableY)
                .text('Ad Soyad', 120, riskTableY)
                .text('Test', 280, riskTableY)
                .text('Kırmızı', 320, riskTableY)
                .text('Başarı', 380, riskTableY);

            doc.moveTo(50, riskTableY + 12).lineTo(430, riskTableY + 12).stroke();

            let riskRowY = riskTableY + 18;
            doc.font('Helvetica');
            riskPersonnel.forEach((r, i) => {
                const p = personnelMap.get(r.sicil);
                const rate = (r.yesil / r.test_sayisi * 100).toFixed(1);
                doc.text((i + 1).toString(), 50, riskRowY)
                    .text(r.sicil.toString(), 70, riskRowY)
                    .text(p?.ad_soyad || '-', 120, riskRowY)
                    .text(r.test_sayisi.toString(), 280, riskRowY)
                    .text(r.kirmizi.toString(), 320, riskRowY)
                    .text(`%${rate}`, 380, riskRowY);
                riskRowY += 14;
            });
        }

        // Footer
        doc.fontSize(8).font('Helvetica')
            .text(`Rapor Tarihi: ${formatDate()}`, 50, 780)
            .text('TIP Performans Analiz Sistemi', 50, 795, { align: 'center' });

        doc.end();
    });
}
