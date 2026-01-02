import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseExcelFile } from '@/lib/excel-parser';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const month = formData.get('month') as string;

        if (!file) {
            return NextResponse.json(
                { error: 'Dosya bulunamadı' },
                { status: 400 }
            );
        }

        if (!month) {
            return NextResponse.json(
                { error: 'Ay bilgisi gerekli (örn: 2024-12)' },
                { status: 400 }
            );
        }

        // Dosyayı buffer'a çevir
        const buffer = Buffer.from(await file.arrayBuffer());

        // Excel'i parse et
        const { personnel, records, groupSummaries, errors } = parseExcelFile(buffer, month);

        if (errors.length > 0) {
            return NextResponse.json(
                { error: errors.join(', '), personnel: [], records: [] },
                { status: 400 }
            );
        }

        if (personnel.length === 0) {
            return NextResponse.json(
                { error: 'Dosyada geçerli veri bulunamadı' },
                { status: 400 }
            );
        }

        // Transaction başlat
        const transaction = await db.transaction('write');

        try {
            // 1. Personel Ekle/Güncelle
            for (const person of personnel) {
                await transaction.execute({
                    sql: `INSERT INTO personnel (sicil, ad_soyad, gorev, grup)
                      VALUES (?, ?, ?, ?)
                      ON CONFLICT(sicil) DO UPDATE SET
                        ad_soyad = excluded.ad_soyad,
                        gorev = excluded.gorev,
                        grup = excluded.grup`,
                    args: [person.sicil, person.ad_soyad, person.gorev, person.grup]
                });
            }

            // 2. Aylık Kayıtları Ekle/Güncelle
            // Note: table name changed from monthly_records to monthly_stats based on db.ts schema
            for (const record of records) {
                await transaction.execute({
                    sql: `INSERT INTO monthly_stats (sicil, ay, kontrol_edilen_bagaj, atilan_tip_sayisi, yakalanan_tip, yanlis_alarm, kacirilan_tip, basari_orani)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                          ON CONFLICT(sicil, ay) DO UPDATE SET
                            kontrol_edilen_bagaj = excluded.kontrol_edilen_bagaj,
                            atilan_tip_sayisi = excluded.atilan_tip_sayisi,
                            yakalanan_tip = excluded.yakalanan_tip,
                            yanlis_alarm = excluded.yanlis_alarm,
                            kacirilan_tip = excluded.kacirilan_tip,
                            basari_orani = excluded.basari_orani`,
                    args: [
                        record.sicil,
                        record.ay,
                        record.bagaj_sayisi,
                        record.test_sayisi,
                        record.yesil,
                        record.sari,
                        record.kirmizi,
                        record.basari_orani
                    ]
                });
            }

            // 3. Grup Özetlerini Ekle/Güncelle
            for (const summary of groupSummaries) {
                await transaction.execute({
                    sql: `INSERT INTO group_summaries (ay, grup, toplam_bagaj, toplam_test, toplam_yesil, toplam_sari, toplam_kirmizi, basari_orani)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                          ON CONFLICT(ay, grup) DO UPDATE SET
                            toplam_bagaj = excluded.toplam_bagaj,
                            toplam_test = excluded.toplam_test,
                            toplam_yesil = excluded.toplam_yesil,
                            toplam_sari = excluded.toplam_sari,
                            toplam_kirmizi = excluded.toplam_kirmizi,
                            basari_orani = excluded.basari_orani`,
                    args: [
                        month,
                        summary.grup,
                        summary.toplamBagaj,
                        summary.toplamTest,
                        summary.toplamYesil,
                        summary.toplamSari,
                        summary.toplamKirmizi,
                        summary.basariOrani
                    ]
                });
            }

            // 4. Yüklenen ayı kaydet
            await transaction.execute({
                sql: `INSERT OR IGNORE INTO loaded_months (ay) VALUES (?)`,
                args: [month]
            });


            await transaction.commit();

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

        // Mesaja grup özetlerini ekle
        const groupInfo = groupSummaries.length > 0
            ? ` Grup özetleri: ${groupSummaries.map(g => `${g.grup}=%${g.basariOrani.toFixed(1)}`).join(', ')}`
            : '';

        return NextResponse.json({
            success: true,
            message: `${personnel.length} personel ve ${records.length} kayıt başarıyla yüklendi.${groupInfo}`,
            personnelCount: personnel.length,
            recordCount: records.length,
            groupSummaryCount: groupSummaries.length,
            month
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Dosya işlenirken hata oluştu: ' + (error as Error).message },
            { status: 500 }
        );
    }
}
