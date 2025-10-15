// ============================================
// FILE: types/index.ts
// Fixed Type Definitions
// ============================================

export interface Guardian {
    id: string;
    name: string;
    phone: string;
    email: string;
    relationship: string;
}

export interface Student {
    id: string;
    $id?: string; // Appwrite document ID
    userId?: string; // User who owns this student
    firstName: string;
    lastName: string;
    grade: string;
    admissionNumber: string;
    dateOfBirth: string;
    guardians: Guardian[]; // Always array after parsing
    feeBalance: number;
    totalFees: number;
    paidFees: number;
    createdAt?: string;
    $createdAt?: string; // Appwrite timestamp
    $updatedAt?: string; // Appwrite timestamp
}

export interface FeePayment {
    id: string;
    $id?: string; // Appwrite document ID
    studentId: string;
    studentName: string;
    studentClass: string;
    parentName: string;
    parentPhone: string;
    amount: number;
    date: string;
    time: string;
    paymentMethod: string;
    mpesaCode: string;
    receiptNumber: string;
    createdAt?: string;
    $createdAt?: string;
    $updatedAt?: string;
}

export type View = 'dashboard' | 'students' | 'payments' | 'sms';