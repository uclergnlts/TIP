import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ month: string }> }
) {
    try {
        const { month } = await params;

        if (!month) {
            return NextResponse.json(
                { error: 'Ay parametresi gerekli' },
                { status: 400 }
            );
        }

        // Transaction başlat
        const transaction = await db.transaction('write');

        try {
            // 1. Aylık kayıtları sil
            await transaction.execute({
                sql: 'DELETE FROM monthly_stats WHERE ay = ?',
                args: [month]
            });

            // 2. Grup özetlerini sil
            await transaction.execute({
                sql: 'DELETE FROM group_summaries WHERE ay = ?',
                args: [month]
            });

            // 3. Yüklenen aylar tablosundan sil
            await transaction.execute({
                sql: 'DELETE FROM loaded_months WHERE ay = ?',
                args: [month]
            });

            await transaction.commit();

            return NextResponse.json({
                success: true,
                message: `${month} dönemine ait tüm veriler silindi.`
            });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json(
            { error: 'Silme işlemi sırasında hata oluştu: ' + (error as Error).message },
            { status: 500 }
        );
    }
}
