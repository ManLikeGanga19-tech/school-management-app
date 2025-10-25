import { databases } from "../../appwrite/config";
import { ID, Query, Models } from "appwrite";
import { authService } from "./auth.service"; // ✅ Import to get schoolName from user profile

// ✅ Include termNumber in CreatePaymentData
export interface CreatePaymentData {
    studentId: string;
    studentName: string;
    studentClass: string;
    parentName: string;
    parentPhone: string;
    mpesaCode: string;
    amount: number;
    date: string;
    time: string;
    paymentMethod: string;
    schoolName: string;
    termNumber?: 1 | 2 | 3; // ✅ Added
}

// ✅ Include termNumber in PaymentDocument
export interface PaymentDocument extends Models.Document {
    userId: string;
    studentId: string;
    studentName: string;
    studentClass: string;
    parentName: string;
    parentPhone: string;
    mpesaCode: string;
    amount: number;
    date: string;
    time: string;
    paymentMethod: string;
    receiptNumber: string;
    termNumber?: 1 | 2 | 3; // ✅ Added
    schoolName?: string; // ✅ Ensures linkage to the school
    createdAt: string;
}

export const paymentService = {
    // ✅ Create a new payment with schoolName and termNumber
    async createPayment(userId: string, data: CreatePaymentData) {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const PAYMENTS_COLLECTION_ID =
                process.env.NEXT_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID!;

            // 🔹 Fetch user's school name from profile
            const userProfile = await authService.getUserProfile(userId);
            if (!userProfile?.schoolName) {
                throw new Error("User school name not found. Cannot create payment.");
            }

            const receiptNumber = `RCP${Date.now().toString().slice(-8)}`;

            const payment = await databases.createDocument<PaymentDocument>(
                DATABASE_ID,
                PAYMENTS_COLLECTION_ID,
                ID.unique(),
                {
                    userId,
                    schoolName: userProfile.schoolName,
                    studentId: data.studentId,
                    studentName: data.studentName,
                    studentClass: data.studentClass,
                    parentName: data.parentName,
                    parentPhone: data.parentPhone,
                    mpesaCode: data.mpesaCode,
                    amount: data.amount,
                    date: data.date,
                    time: data.time,
                    paymentMethod: data.paymentMethod,
                    termNumber: data.termNumber || undefined, // ✅ Safe optional term
                    receiptNumber,
                    createdAt: new Date().toISOString(),
                }
            );

            return payment;
        } catch (error: any) {
            console.error("💥 Payment creation failed:", error);
            throw new Error(error.message || "Failed to create payment");
        }
    },

    // ✅ Get all payments created by a specific user
    async getPayments(userId: string): Promise<PaymentDocument[]> {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const PAYMENTS_COLLECTION_ID =
                process.env.NEXT_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID!;

            const response = await databases.listDocuments<PaymentDocument>(
                DATABASE_ID,
                PAYMENTS_COLLECTION_ID,
                [Query.equal("userId", userId), Query.orderDesc("createdAt")]
            );

            return response.documents;
        } catch (error: any) {
            throw new Error(error.message || "Failed to fetch payments");
        }
    },

    // ✅ Get payments for a specific student
    async getStudentPayments(studentId: string): Promise<PaymentDocument[]> {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const PAYMENTS_COLLECTION_ID =
                process.env.NEXT_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID!;

            const response = await databases.listDocuments<PaymentDocument>(
                DATABASE_ID,
                PAYMENTS_COLLECTION_ID,
                [Query.equal("studentId", studentId), Query.orderDesc("createdAt")]
            );

            return response.documents;
        } catch (error: any) {
            throw new Error(error.message || "Failed to fetch student payments");
        }
    },

    // ✅ Fetch payments for an entire school (for secretary or admin)
    async getPaymentsBySchool(schoolName: string): Promise<PaymentDocument[]> {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const COLLECTION_ID =
                process.env.NEXT_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID!;

            const res = await databases.listDocuments<PaymentDocument>(
                DATABASE_ID,
                COLLECTION_ID,
                [Query.equal("schoolName", schoolName)]
            );

            return res.documents;
        } catch (error: any) {
            console.error("💥 Error fetching payments by school:", error);
            throw new Error(
                error.message || "Failed to fetch payments for this school"
            );
        }
    },

    // ✅ Delete payment
    async deletePayment(paymentId: string) {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const PAYMENTS_COLLECTION_ID =
                process.env.NEXT_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID!;

            await databases.deleteDocument(DATABASE_ID, PAYMENTS_COLLECTION_ID, paymentId);
            return { success: true };
        } catch (error: any) {
            throw new Error(error.message || "Failed to delete payment");
        }
    },
};
