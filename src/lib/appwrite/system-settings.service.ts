// ============================================
// FILE: lib/appwrite/systemSettingsService.ts
// Synced with Appwrite Schema + Safe Writes + Auto-Creation
// ============================================

import { databases } from "../../appwrite/config";
import { ID, Query } from "appwrite";

export interface SystemSettings {
    userId?: string;
    academicYear: string;
    currentTerm: 1 | 2 | 3; // handled as number in app, stored as string in DB
    term1StartDate: string;
    term1EndDate: string;
    term2StartDate: string;
    term2EndDate: string;
    term3StartDate: string;
    term3EndDate: string;
    schoolName: string;
    lastUpdatedBy: string;
    schoolId?: string;
    $createdAt?: string;
    $updatedAt?: string;
}

export const systemSettingsService = {
    // ============================================
    // ✅ Get current system settings (safe)
    // ============================================
    async getSettings(
        schoolName: string,
        collectionId?: string
    ): Promise<SystemSettings | null> {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const SETTINGS_COLLECTION_ID =
                collectionId ||
                process.env.NEXT_PUBLIC_APPWRITE_SETTINGS_COLLECTION_ID ||
                "system_settings";

            let response;

            try {
                response = await databases.listDocuments(
                    DATABASE_ID,
                    SETTINGS_COLLECTION_ID,
                    [Query.equal("schoolName", schoolName), Query.limit(1)]
                );
            } catch (err: any) {
                console.warn("⚠️ Query failed, falling back:", err.message);
                response = await databases.listDocuments(
                    DATABASE_ID,
                    SETTINGS_COLLECTION_ID,
                    [Query.limit(1)]
                );
            }

            if (!response.documents.length) {
                console.warn(`⚠️ No system settings found for ${schoolName}`);
                return null;
            }

            const doc = response.documents[0];
            return {
                ...doc,
                currentTerm: parseInt(doc.currentTerm, 10) as 1 | 2 | 3,
            } as unknown as SystemSettings;
        } catch (error: any) {
            console.error("Failed to get system settings:", error);
            throw new Error(error.message || "Failed to get system settings");
        }
    },

    // ============================================
    // ✅ Create initial settings (schema-safe)
    // ============================================
    async createSettings(
        data: Omit<SystemSettings, "$id" | "$createdAt" | "$updatedAt">,
        collectionId?: string
    ): Promise<SystemSettings> {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const SETTINGS_COLLECTION_ID =
                collectionId ||
                process.env.NEXT_PUBLIC_APPWRITE_SETTINGS_COLLECTION_ID ||
                "system_settings";

            const payload = {
                academicYear: data.academicYear,
                currentTerm: data.currentTerm.toString(), // store as string
                term1StartDate: data.term1StartDate,
                term1EndDate: data.term1EndDate,
                term2StartDate: data.term2StartDate,
                term2EndDate: data.term2EndDate,
                term3StartDate: data.term3StartDate,
                term3EndDate: data.term3EndDate,
                schoolName: data.schoolName,
                lastUpdatedBy: data.lastUpdatedBy,
                schoolId: data.schoolId || "",
            };

            const settings = await databases.createDocument(
                DATABASE_ID,
                SETTINGS_COLLECTION_ID,
                ID.unique(),
                payload
            );

            console.log("✅ Created system settings for", data.schoolName);

            return {
                ...settings,
                currentTerm: parseInt(settings.currentTerm, 10) as 1 | 2 | 3,
            } as unknown as SystemSettings;
        } catch (error: any) {
            console.error("Create settings error:", error);
            throw new Error(error.message || "Failed to create settings");
        }
    },

    // ============================================
    // ✅ Update settings (safe schema fields only)
    // ============================================
    async updateSettings(
        settingsId: string,
        data: Partial<SystemSettings>,
        collectionId?: string
    ): Promise<SystemSettings> {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const SETTINGS_COLLECTION_ID =
                collectionId ||
                process.env.NEXT_PUBLIC_APPWRITE_SETTINGS_COLLECTION_ID ||
                "system_settings";

            const safeData: Record<string, any> = {};

            if (data.academicYear !== undefined) safeData.academicYear = data.academicYear;
            if (data.currentTerm !== undefined)
                safeData.currentTerm = data.currentTerm.toString();
            if (data.term1StartDate !== undefined)
                safeData.term1StartDate = data.term1StartDate;
            if (data.term1EndDate !== undefined)
                safeData.term1EndDate = data.term1EndDate;
            if (data.term2StartDate !== undefined)
                safeData.term2StartDate = data.term2StartDate;
            if (data.term2EndDate !== undefined)
                safeData.term2EndDate = data.term2EndDate;
            if (data.term3StartDate !== undefined)
                safeData.term3StartDate = data.term3StartDate;
            if (data.term3EndDate !== undefined)
                safeData.term3EndDate = data.term3EndDate;
            if (data.schoolName !== undefined) safeData.schoolName = data.schoolName;
            if (data.lastUpdatedBy !== undefined) safeData.lastUpdatedBy = data.lastUpdatedBy;
            if (data.schoolId !== undefined) safeData.schoolId = data.schoolId;

            const settings = await databases.updateDocument(
                DATABASE_ID,
                SETTINGS_COLLECTION_ID,
                settingsId,
                safeData
            );

            return {
                ...settings,
                currentTerm: parseInt(settings.currentTerm, 10) as 1 | 2 | 3,
            } as unknown as SystemSettings;
        } catch (error: any) {
            console.error("Update settings error:", error);
            throw new Error(error.message || "Failed to update settings");
        }
    },

    // ============================================
    // ✅ Get settings by document ID
    // ============================================
    async getSettingsByDocId(
        settingsId: string,
        collectionId?: string
    ): Promise<SystemSettings | null> {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const SETTINGS_COLLECTION_ID =
                collectionId ||
                process.env.NEXT_PUBLIC_APPWRITE_SETTINGS_COLLECTION_ID ||
                "system_settings";

            const settings = await databases.getDocument(
                DATABASE_ID,
                SETTINGS_COLLECTION_ID,
                settingsId
            );

            return {
                ...settings,
                currentTerm: parseInt(settings.currentTerm, 10) as 1 | 2 | 3,
            } as unknown as SystemSettings;
        } catch (error: any) {
            throw new Error(error.message || "Failed to get settings");
        }
    },

    // ============================================
    // ✅ Get current active term (auto-create if missing)
    // ============================================
    async getCurrentTerm(
        schoolName: string,
        collectionId?: string
    ): Promise<1 | 2 | 3> {
        let settings = await this.getSettings(schoolName, collectionId);

        if (!settings) {
            console.warn(`⚠️ No settings found for ${schoolName}, creating defaults...`);
            settings = await this.createSettings(
                {
                    academicYear: new Date().getFullYear().toString(),
                    currentTerm: 1,
                    term1StartDate: new Date().toISOString(),
                    term1EndDate: new Date().toISOString(),
                    term2StartDate: new Date().toISOString(),
                    term2EndDate: new Date().toISOString(),
                    term3StartDate: new Date().toISOString(),
                    term3EndDate: new Date().toISOString(),
                    schoolName,
                    lastUpdatedBy: "system",
                },
                collectionId
            );
        }

        return settings.currentTerm;
    },

    // ============================================
    // ✅ Term change notification
    // ============================================
    async notifyTermChange(
        nextTerm: 1 | 2 | 3,
        schoolName: string
    ): Promise<void> {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const NOTIFICATIONS_COLLECTION_ID =
                process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID!;

            const now = new Date().toISOString();
            const message = `Welcome to Term ${nextTerm}. Please review fee records for the new term.`;

            await databases.createDocument(
                DATABASE_ID,
                NOTIFICATIONS_COLLECTION_ID,
                ID.unique(),
                {
                    title: `Term ${nextTerm} Activated`,
                    message,
                    schoolName,
                    read: false,
                    createdAt: now,
                }
            );
        } catch (error: any) {
            console.error("Failed to create term change notification:", error);
        }
    },
};
