// src/lib/sms.ts
export async function sendSms(numbers: string[], message: string, sender?: string) {
    const res = await fetch('/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numbers, message, sender }),
    });

    if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || `SMS API error: ${res.status}`);
    }

    return res.json();
}
