import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import AfricasTalking from 'africastalking';

type Body = {
    numbers: string[]; // phone numbers input
    message: string;
};

// ✅ Helper: normalize Kenyan numbers to E.164 format
function normalizePhoneNumber(num: string): string | null {
    // Remove spaces, dashes, and parentheses
    num = num.replace(/[\s\-\(\)]/g, '');

    // Already in correct +254 format
    if (num.startsWith('+254')) return num;

    // Starts with 254 but missing '+'
    if (num.startsWith('254')) return `+${num}`;

    // Starts with 07 (Kenyan local)
    if (num.startsWith('07')) return `+254${num.slice(1)}`;

    // Starts with 7 (short local)
    if (num.startsWith('7')) return `+254${num}`;

    // Invalid number
    return null;
}

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

        // 🧹 Clean + normalize numbers
        const cleanedNumbers = body.numbers
            .map(num => normalizePhoneNumber(num.trim()))
            .filter((num): num is string => !!num); // remove nulls

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
                    to: batch,
                    message: body.message,
                    from: process.env.AFRICASTALKING_SENDER_ID || 'AFRICASTKNG',

                });
                
                console.log("📨 Africa's Talking Response:", JSON.stringify(result, null, 2));

                const recipients = result.SMSMessageData?.Recipients || [];
                const successful = recipients.filter((r: any) => r.status === 'Success');
                const failed = recipients.filter((r: any) => r.status !== 'Success');

                totalSent += recipients.length;
                totalSuccess += successful.length;
                totalFailed += failed.length;
                allResults.push({ batch: index + 1, successful, failed });

                // Small delay between batches (avoid throttling)
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
