import { account, databases } from '../../appwrite/config';
import { ID } from 'appwrite';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignUpCredentials {
    email: string;
    password: string;
    name: string;
    schoolName: string;
    role?: 'admin' | 'director' | 'accountant';
}

export const authService = {
    // Sign up new user with school data
    async signUp({ email, password, name, schoolName, role = 'admin' }: SignUpCredentials) {
        try {
            // Create user account in Appwrite Auth
            const user = await account.create(ID.unique(), email, password, name);

            // Store additional user data in database (schoolName, role)
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!;

            await databases.createDocument(
                DATABASE_ID,
                USERS_COLLECTION_ID,
                user.$id,
                {
                    userId: user.$id,
                    email: email,
                    name: name,
                    schoolName: schoolName,
                    role: role,
                    createdAt: new Date().toISOString(),
                }
            );

            // REMOVED: await this.login({ email, password });
            // User will need to login manually from the login page

            return user;
        } catch (error: any) {
            throw new Error(error.message || 'Failed to create account');
        }
    },

    // Login
    async login({ email, password }: LoginCredentials) {
        try {
            const session = await account.createEmailPasswordSession(email, password);
            return session;
        } catch (error: any) {
            throw new Error(error.message || 'Failed to login');
        }
    },

    // Get current logged-in user
    async getCurrentUser() {
        try {
            return await account.get();
        } catch (error) {
            return null;
        }
    },

    // Get user profile data from database
    async getUserProfile(userId: string) {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!;

            return await databases.getDocument(
                DATABASE_ID,
                USERS_COLLECTION_ID,
                userId
            );
        } catch (error: any) {
            throw new Error(error.message || 'Failed to get user profile');
        }
    },

    // Logout
    async logout() {
        try {
            await account.deleteSession('current');
        } catch (error: any) {
            throw new Error(error.message || 'Failed to logout');
        }
    },

    // Logout from all devices
    async logoutAll() {
        try {
            await account.deleteSessions();
        } catch (error: any) {
            throw new Error(error.message || 'Failed to logout from all devices');
        }
    },

    // Check if user is logged in
    async isLoggedIn() {
        try {
            const user = await this.getCurrentUser();
            return !!user;
        } catch (error) {
            return false;
        }
    },

    // Get all active sessions
    async getSessions() {
        try {
            return await account.listSessions();
        } catch (error: any) {
            throw new Error(error.message || 'Failed to get sessions');
        }
    }
};