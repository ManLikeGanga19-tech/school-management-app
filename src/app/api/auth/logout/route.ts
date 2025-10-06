// ============================================
// FILE: app/api/auth/logout/route.ts
// Logout API Endpoint
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { logoutUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;

        if (token) {
            await logoutUser();
        }

        // Clear cookie
        const response = NextResponse.json({ success: true });
        response.cookies.delete('auth-token');

        return response;
    } catch (error) {
        console.error('Logout API error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to logout',
            },
            { status: 500 }
        );
    }
}