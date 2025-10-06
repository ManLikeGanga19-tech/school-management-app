// ============================================
// FILE: app/api/auth/register/route.ts
// Register API Endpoint (System Owner Only)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth';
import { z } from 'zod';

// Validation schema
const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    schoolName: z.string().min(2, 'School name must be at least 2 characters'),
    role: z.enum(['admin', 'director', 'accountant']).optional(),
    systemKey: z.string(), // Secret key to prevent unauthorized registrations
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const validation = registerSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: validation.error.issues[0].message,
                },
                { status: 400 }
            );
        }

        const { systemKey, ...userData } = validation.data;

        // Verify system key (prevents unauthorized account creation)
        if (systemKey !== process.env.SYSTEM_REGISTRATION_KEY) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Unauthorized: Invalid system key',
                },
                { status: 403 }
            );
        }

        // Register user
        const result = await registerUser({ ...userData, systemKey });

        if (!result.success) {
            return NextResponse.json(result, { status: 400 });
        }

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error('Registration API error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'An unexpected error occurred',
            },
            { status: 500 }
        );
    }
}