import { NextRequest, NextResponse } from 'next/server';
import { generatePersonnelReportPDF } from '@/lib/pdf-generator';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sicil = searchParams.get('sicil');
        const month = searchParams.get('month');

        if (!sicil) {
            return NextResponse.json(
                { error: 'Sicil numarası gerekli' },
                { status: 400 }
            );
        }

        const pdfBuffer = await generatePersonnelReportPDF(parseInt(sicil), month || undefined);

        // Dosya adı
        const fileName = `TIP_Rapor_${sicil}_${month || 'son'}.pdf`;

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
