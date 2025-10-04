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

// Simulated user database (replace with actual API calls)
const MOCK_USERS = [
    {
        id: '1',
        email: 'admin@school.com',
        password: 'admin123', // In production, this would be hashed
        name: 'School Director',
        schoolName: 'Demo School',
        role: 'admin' as const
    }
];

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Find user
    const user = MOCK_USERS.find(u => u.email === email && u.password === password);

    if (!user) {
        return {
            success: false,
            error: 'Invalid email or password'
        };
    }

    // Generate token (in production, use JWT)
    const token = btoa(`${user.email}:${Date.now()}`);

    return {
        success: true,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            schoolName: user.schoolName,
            role: user.role
        },
        token
    };
}

export function saveAuthToken(token: string) {
    // In production, save to secure storage
    sessionStorage.setItem('auth_token', token);
}

export function getAuthToken(): string | null {
    return sessionStorage.getItem('auth_token');
}

export function removeAuthToken() {
    sessionStorage.removeItem('auth_token');
}

export function isAuthenticated(): boolean {
    return !!getAuthToken();
}