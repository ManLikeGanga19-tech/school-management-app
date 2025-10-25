import { account, databases } from "../../appwrite/config";
import { ID, Query } from "appwrite";

export type UserRole = "admin" | "secretary";

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignUpCredentials {
    email: string;
    password: string;
    name: string;
    schoolName: string;
    role?: UserRole;
}

export interface UserProfile {
    $id?: string;
    userId: string;
    email: string;
    name: string;
    schoolName: string;
    role: UserRole;
    createdAt: string;
    createdBy?: string;
    isActive?: boolean;
}

export interface SecretaryCredentials {
    email: string;
    password: string;
    name: string;
}

export const ROLE_PERMISSIONS = {
    admin: {
        canAddStudents: true,
        canEditStudents: true,
        canDeleteStudents: true,
        canViewStudents: true,
        canAddPayments: true,
        canEditPayments: true,
        canDeletePayments: true,
        canViewPayments: true,
        canSendSMS: true,
        canManageUsers: true,
        canViewReports: true,
        canTransferStudents: true,
        canAccessDashboard: true,
    },
    secretary: {
        canAddStudents: true,
        canEditStudents: true,
        canDeleteStudents: false,
        canViewStudents: true,
        canAddPayments: true,
        canEditPayments: true,
        canDeletePayments: false,
        canViewPayments: true,
        canSendSMS: true,
        canManageUsers: false,
        canViewReports: false,
        canTransferStudents: false,
        canAccessDashboard: false,
    },
} as const;

export const authService = {
    // ----------------------------------------
    // ADMIN SIGNUP
    // ----------------------------------------
    async signUp({ email, password, name, schoolName, role = "admin" }: SignUpCredentials) {
        try {
            if (role !== "admin") throw new Error("Only administrators can register schools");

            const user = await account.create(ID.unique(), email, password, name);

            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!;

            await databases.createDocument(DATABASE_ID, USERS_COLLECTION_ID, user.$id, {
                userId: user.$id,
                email,
                name,
                schoolName,
                role: "admin",
                isActive: true,
                createdAt: new Date().toISOString(),
            });

            return user;
        } catch (error: any) {
            console.error("Admin signup error:", error);
            throw new Error(error.message || "Failed to create admin account");
        }
    },

    // ----------------------------------------
    // CREATE SECRETARY (AUTH + DB)
    // ----------------------------------------
    async createSecretary(adminId: string, secretaryData: SecretaryCredentials) {
        try {
            const adminProfile = await this.getUserProfile(adminId);
            if (adminProfile.role !== "admin") {
                throw new Error("Only administrators can create secretary accounts");
            }

            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!;
            const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
            const PROJECT = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
            const API_KEY = process.env.NEXT_PUBLIC_APPWRITE_API_KEY!;

            // Check if email already exists
            const existing = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
                Query.equal("email", secretaryData.email),
            ]);
            if (existing.documents.length > 0)
                throw new Error("A user with this email already exists");

            const userId = ID.unique();

            // Create Appwrite Auth user (server-side)
            const res = await fetch(`${ENDPOINT}/users`, {
                method: "POST",
                headers: {
                    "X-Appwrite-Project": PROJECT,
                    "X-Appwrite-Key": API_KEY,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId,
                    email: secretaryData.email,
                    password: secretaryData.password,
                    name: secretaryData.name,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                console.error("❌ Appwrite Auth creation failed:", data);
                throw new Error(data.message || "Failed to create secretary auth account");
            }

            // Create DB record
            const profile = await databases.createDocument(
                DATABASE_ID,
                USERS_COLLECTION_ID,
                userId,
                {
                    userId,
                    email: secretaryData.email,
                    name: secretaryData.name,
                    schoolName: adminProfile.schoolName,
                    role: "secretary",
                    isActive: true,
                    createdBy: adminId,
                    createdAt: new Date().toISOString(),
                }
            );

            console.log("✅ Secretary profile created:", profile.$id);

            return {
                success: true,
                secretary: profile,
                message: "Secretary created and ready to log in.",
            };
        } catch (error: any) {
            console.error("Create Secretary Error:", error);
            throw new Error(error.message || "Failed to create secretary account");
        }
    },

    // ----------------------------------------
    // LOGIN
    // ----------------------------------------
    async login({ email, password }: LoginCredentials) {
        try {
            const session = await account.createEmailPasswordSession(email, password);
            console.log("✅ Login successful:", session);

            // Fetch profile to check active status
            const profile = await this.getUserProfile(session.userId);
            if (!profile.isActive) {
                await account.deleteSession("current");
                throw new Error(
                    "Your account is deactivated. Please contact the admin to reactivate."
                );
            }

            return session;
        } catch (error: any) {
            console.error("🚨 Login failed for:", email);
            console.error("Error details:", error);
            throw new Error(error.message || "Invalid credentials.");
        }
    },

    // ----------------------------------------
    // CURRENT USER
    // ----------------------------------------
    async getCurrentUser() {
        try {
            return await account.get();
        } catch {
            return null;
        }
    },

    async getUserProfile(userId: string): Promise<UserProfile> {
        const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
        const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!;
        const profile = await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, userId);
        return profile as unknown as UserProfile;
    },

    async getUserPermissions(userId: string) {
        const profile = await this.getUserProfile(userId);
        return ROLE_PERMISSIONS[profile.role];
    },

    // ----------------------------------------
    // SCHOOL USERS
    // ----------------------------------------
    async getSchoolSecretaries(adminId: string) {
        const adminProfile = await this.getUserProfile(adminId);
        const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
        const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!;

        const response = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
            Query.equal("schoolName", adminProfile.schoolName),
            Query.equal("role", "secretary"),
        ]);

        return response.documents;
    },

    // ----------------------------------------
    // GET LINKED SCHOOL DATA
    // ----------------------------------------
    async getLinkedSchoolProfile(userId: string) {
        try {
            const profile = await this.getUserProfile(userId);

            if (profile.role === "admin") {
                return {
                    schoolName: profile.schoolName,
                    createdBy: profile.userId,
                };
            } else if (profile.role === "secretary") {
                const adminProfile = await this.getUserProfile(profile.createdBy!);
                return {
                    schoolName: adminProfile.schoolName,
                    createdBy: profile.createdBy,
                };
            }

            throw new Error("Unknown role");
        } catch (error: any) {
            console.error("getLinkedSchoolProfile Error:", error);
            throw new Error("Failed to get linked school data");
        }
    },

    // ----------------------------------------
    // SECRETARY MANAGEMENT (UPDATED)
    // ----------------------------------------

    // ✅ Deactivate Secretary
    async deleteSecretary(adminId: string, secretaryId: string) {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!;

            await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, secretaryId, {
                isActive: false,
            });

            console.log(`🗑️ Secretary ${secretaryId} deactivated by admin ${adminId}`);
            return { success: true };
        } catch (error: any) {
            console.error("💥 Failed to deactivate secretary:", error);
            throw new Error(error.message || "Failed to deactivate secretary");
        }
    },

    // ✅ Reactivate Secretary (no duplicate creation)
    async activateSecretaryAccount(email: string, password: string, secretaryId: string) {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!;

            // Simply mark active, don’t recreate Appwrite user
            await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, secretaryId, {
                isActive: true,
            });

            console.log(`✅ Secretary ${email} reactivated successfully`);
            return { success: true };
        } catch (error: any) {
            console.error("💥 Failed to reactivate secretary:", error);
            throw new Error(error.message || "Failed to reactivate secretary");
        }
    },

    // ✅ Update Secretary Info
    async updateSecretary(adminId: string, secretaryId: string, updates: any) {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!;

            const res = await databases.updateDocument(
                DATABASE_ID,
                USERS_COLLECTION_ID,
                secretaryId,
                updates
            );

            console.log(`🔄 Secretary ${secretaryId} updated by admin ${adminId}`);
            return res;
        } catch (error: any) {
            console.error("💥 Failed to update secretary:", error);
            throw new Error(error.message || "Failed to update secretary info");
        }
    },

    // ----------------------------------------
    // LOGOUT
    // ----------------------------------------
    async logout() {
        await account.deleteSession("current");
        if (typeof window !== "undefined") {
            localStorage.removeItem("userRole");
            localStorage.removeItem("userId");
        }
    },
};
