import { NextRequest, NextResponse } from 'next/server';
import { generateMonthlyReportPDF } from '@/lib/pdf-generator';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month');

        if (!month) {
            return NextResponse.json(
                { error: 'Ay bilgisi gerekli (örn: 2024-12)' },
                { status: 400 }
            );
        }

        const pdfBuffer = await generateMonthlyReportPDF(month);

        // Dosya adı
        const fileName = `TIP_Aylik_Rapor_${month}.pdf`;

        return new NextResponse(new Uint8Array(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Content-Length': pdfBuffer.length.toString(),
            },
        });

    } catch (error) {
        console.error('PDF error:', error);
        return NextResponse.json(
            { error: 'PDF oluşturulurken hata: ' + (error as Error).message },
            { status: 500 }
        );
    }
}
