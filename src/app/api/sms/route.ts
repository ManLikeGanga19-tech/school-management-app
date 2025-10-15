import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import AfricasTalking from 'africastalking';

type Body = {
    numbers: string[]; // E.164 numbers like +2547...
    message: string;
};

export async function POST(req: NextRequest) {
    try {
        const body: Body = await req.json();

        // Validate request
        if (!body || !Array.isArray(body.numbers) || body.numbers.length === 0) {
            return NextResponse.json({ error: 'No phone numbers provided' }, { status: 400 });
        }
        if (!body.message || body.message.trim() === '') {
            return NextResponse.json({ error: 'No message provided' }, { status: 400 });
        }

        const username = process.env.AFRICASTALKING_USERNAME;
        const apiKey = process.env.AFRICASTALKING_API_KEY;

        console.log("AT Username:", process.env.AFRICASTALKING_USERNAME);
        console.log("AT API Key:", process.env.AFRICASTALKING_API_KEY ? "Loaded" : "Missing");


        if (!username || !apiKey) {
            console.error("Africa's Talking credentials missing");
            return NextResponse.json({ error: 'SMS service not configured' }, { status: 500 });
        }

        // Initialize Africa's Talking
        const africasTalking = AfricasTalking({ apiKey, username });
        const sms = africasTalking.SMS;

        // Clean phone numbers
        const cleanedNumbers = body.numbers.map(num => num.trim()).filter(num => num.length > 0);
        if (cleanedNumbers.length === 0) {
            return NextResponse.json({ error: 'No valid phone numbers provided' }, { status: 400 });
        }

        console.log('Sending SMS to:', cleanedNumbers);
        console.log('Message:', body.message);

        // Send SMS without specifying sender ID
        const result = await sms.send({
            to: cleanedNumbers.join(','), // Bulk SMS
            message: body.message,
            // ⚠️ No 'from' property here; uses Africa's Talking default short code
        });

        console.log('SMS send result:', result);

        // Parse recipients
        const recipients = result.SMSMessageData?.Recipients || [];
        const successful = recipients.filter((r: any) => r.status === 'Success');
        const failed = recipients.filter((r: any) => r.status !== 'Success');

        return NextResponse.json({
            ok: true,
            total: recipients.length,
            successful: successful.length,
            failed: failed.length,
            details: result,
        }, { status: 200 });

    } catch (err: any) {
        console.error('SMS API error:', err);
        return NextResponse.json({
            error: err?.message || 'Failed to send SMS',
            details: err.toString(),
        }, { status: 500 });
    }
}
