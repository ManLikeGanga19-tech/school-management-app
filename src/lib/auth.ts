// ============================================
// FILE: lib/auth.ts (Frontend - Client Side)
// Updated to integrate with backend API
// ============================================
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
}

export interface User {
    id: string;
    email: string;
    name: string;
    schoolName: string;
    role: 'admin' | 'director';
}

export interface AuthResponse {
    success: boolean;
    user?: User;
    token?: string;
    error?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// ============================================
// Login user - Calls backend API
// ============================================
export async function loginUser(email: string, password: string): Promise<AuthResponse> {
    try {
        // ✅ Default credentials for development
        if (process.env.NODE_ENV === 'development') {
            const defaultEmail = 'admin@demo.com';
            const defaultPassword = 'password123';

            if (email === defaultEmail && password === defaultPassword) {
                // Simulate a successful login
                const mockUser: User = {
                    id: 'dev-user-1',
                    email: defaultEmail,
                    name: 'Demo Admin',
                    schoolName: 'Demo School',
                    role: 'admin',
                };

                saveAuthToken('dev-token');
                return {
                    success: true,
                    user: mockUser,
                    token: 'dev-token',
                };
            }
        }

        // Normal API login request
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include', // Important: Sends cookies
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: data.error || 'Login failed',
            };
        }

        return data;
    } catch (error) {
        console.error('Login error:', error);
        return {
            success: false,
            error: 'Network error. Please check your connection.',
        };
    }
}

// ============================================
// Auth Token Helpers
// ============================================
export function saveAuthToken(token: string) {
    if (typeof window !== 'undefined') {
        sessionStorage.setItem('isAuthenticated', 'true');
    }
}

export function getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
        return sessionStorage.getItem('isAuthenticated');
    }
    return null;
}

export function removeAuthToken() {
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem('isAuthenticated');
    }
}

export function isAuthenticated(): boolean {
    return !!getAuthToken();
}

// ============================================
// Logout user - Calls backend API
// ============================================
export async function logoutUser(): Promise<void> {
    try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        });

        removeAuthToken();
    } catch (error) {
        console.error('Logout error:', error);
        removeAuthToken();
    }
}

// ============================================
// Verify session - Calls backend API
// ============================================
export async function verifySession(): Promise<AuthResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            method: 'GET',
            credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
            removeAuthToken();
            return {
                success: false,
                error: data.error || 'Session expired',
            };
        }

        return {
            success: true,
            user: data.user,
        };
    } catch (error) {
        console.error('Session verification error:', error);
        removeAuthToken();
        return {
            success: false,
            error: 'Failed to verify session',
        };
    }
}

// ============================================
// Get current user from session
// ============================================
export async function getCurrentUser(): Promise<User | null> {
    const result = await verifySession();
    return result.success ? result.user || null : null;
}

// ============================================
// Register user - Future feature
// ============================================
export async function registerUser(data: {
    email: string;
    password: string;
    name: string;
    schoolName: string;
    role?: 'admin' | 'director' | 'accountant';
    systemKey: string;
}): Promise<AuthResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            credentials: 'include',
        });

        const result = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: result.error || 'Registration failed',
            };
        }

        return result;
    } catch (error) {
        console.error('Registration error:', error);
        return {
            success: false,
            error: 'Network error. Please try again.',
        };
    }
}
