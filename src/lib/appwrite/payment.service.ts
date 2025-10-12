import { databases } from '../../appwrite/config';
import { ID, Query } from 'appwrite';
import { Models } from 'appwrite';

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
}

// Define the Payment document type
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
    createdAt: string;
}

export const paymentService = {
    // Create a new payment
    async createPayment(userId: string, data: CreatePaymentData) {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const PAYMENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID!;

            // Generate receipt number
            const receiptNumber = `RCP${Date.now().toString().slice(-8)}`;

            const payment = await databases.createDocument(
                DATABASE_ID,
                PAYMENTS_COLLECTION_ID,
                ID.unique(),
                {
                    userId: userId,
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
                    receiptNumber: receiptNumber,
                    createdAt: new Date().toISOString(),
                }
            );

            return payment;
        } catch (error: any) {
            throw new Error(error.message || 'Failed to create payment');
        }
    },

    // Get all payments for a user
    async getPayments(userId: string) {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const PAYMENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID!;

            const response = await databases.listDocuments<PaymentDocument>(
                DATABASE_ID,
                PAYMENTS_COLLECTION_ID,
                [
                    Query.equal('userId', userId),
                    Query.orderDesc('createdAt')
                ]
            );

            return response.documents;
        } catch (error: any) {
            throw new Error(error.message || 'Failed to fetch payments');
        }
    },

    // Get payments for a specific student
    async getStudentPayments(studentId: string) {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const PAYMENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID!;

            const response = await databases.listDocuments<PaymentDocument>(
                DATABASE_ID,
                PAYMENTS_COLLECTION_ID,
                [
                    Query.equal('studentId', studentId),
                    Query.orderDesc('createdAt')
                ]
            );

            return response.documents;
        } catch (error: any) {
            throw new Error(error.message || 'Failed to fetch student payments');
        }
    },

    // Delete a payment
    async deletePayment(paymentId: string) {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const PAYMENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID!;

            await databases.deleteDocument(
                DATABASE_ID,
                PAYMENTS_COLLECTION_ID,
                paymentId
            );

            return { success: true };
        } catch (error: any) {
            throw new Error(error.message || 'Failed to delete payment');
        }
    },
};