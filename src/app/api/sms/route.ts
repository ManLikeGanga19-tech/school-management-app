import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import AfricasTalking from 'africastalking';

type Body = {
    numbers: string[]; // E.164 format (+2547...)
    message: string;
};

// Batch helper: split array into chunks of size n
function chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}

export async function POST(req: NextRequest) {
    try {
        const body: Body = await req.json();

        // 🔍 Validate request
        if (!body || !Array.isArray(body.numbers) || body.numbers.length === 0) {
            return NextResponse.json({ error: 'No phone numbers provided' }, { status: 400 });
        }
        if (!body.message || body.message.trim() === '') {
            return NextResponse.json({ error: 'No message provided' }, { status: 400 });
        }

        const username = process.env.AFRICASTALKING_USERNAME;
        const apiKey = process.env.AFRICASTALKING_API_KEY;

        if (!username || !apiKey) {
            console.error("❌ Africa's Talking credentials missing");
            return NextResponse.json({ error: 'SMS service not configured' }, { status: 500 });
        }

        // ✅ Initialize Africa's Talking SDK
        const africasTalking = AfricasTalking({ apiKey, username });
        const sms = africasTalking.SMS;

        // 🧹 Clean and validate numbers
        const cleanedNumbers = body.numbers
            .map(num => num.trim())
            .filter(num => num.length > 0);
        if (cleanedNumbers.length === 0) {
            return NextResponse.json({ error: 'No valid phone numbers provided' }, { status: 400 });
        }

        console.log(`🚀 Preparing to send SMS to ${cleanedNumbers.length} recipients...`);

        // 🔹 Split into batches of 100 numbers (Africa’s Talking safe limit)
        const batches = chunkArray(cleanedNumbers, 100);

        let totalSent = 0;
        let totalSuccess = 0;
        let totalFailed = 0;
        const allResults: any[] = [];

        // 🔁 Process each batch sequentially
        for (const [index, batch] of batches.entries()) {
            console.log(`📦 Sending batch ${index + 1}/${batches.length} (${batch.length} recipients)...`);

            try {
                const result = await sms.send({
                    to: batch, // array input (preferred)
                    message: body.message,
                });

                const recipients = result.SMSMessageData?.Recipients || [];
                const successful = recipients.filter((r: any) => r.status === 'Success');
                const failed = recipients.filter((r: any) => r.status !== 'Success');

                totalSent += recipients.length;
                totalSuccess += successful.length;
                totalFailed += failed.length;
                allResults.push({ batch: index + 1, successful, failed });

                // Add small delay between batches (helps avoid throttling)
                await new Promise(res => setTimeout(res, 800));
            } catch (batchErr: any) {
                console.error(`💥 Error in batch ${index + 1}:`, batchErr);
                allResults.push({ batch: index + 1, error: batchErr.message || 'Batch send failed' });
            }
        }

        console.log(`✅ SMS sending complete: ${totalSuccess}/${totalSent} succeeded, ${totalFailed} failed.`);

        return NextResponse.json({
            ok: true,
            total: totalSent,
            successful: totalSuccess,
            failed: totalFailed,
            batches: batches.length,
            details: allResults,
        });
    } catch (err: any) {
        console.error('💥 SMS API error:', err);
        return NextResponse.json({
            error: err?.message || 'Failed to send SMS',
            details: err.toString(),
        }, { status: 500 });
    }
}
