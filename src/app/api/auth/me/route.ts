
// ============================================
// FILE: app/api/auth/me/route.ts
// Get Current User (Verify Session)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Not authenticated',
                },
                { status: 401 }
            );
        }

        const result = await verifySession();

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error,
                },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            user: result.user,
        });
    } catch (error) {
        console.error('Me API error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to get user',
            },
            { status: 500 }
        );
    }
}