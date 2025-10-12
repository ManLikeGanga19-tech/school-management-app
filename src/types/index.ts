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
    guardians: Guardian[] | string; // Can be array or JSON string from Appwrite
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
    studentClass: string;      // Student's grade/class
    parentName: string;         // Guardian's name
    parentPhone: string;        // Guardian's phone number
    amount: number;
    date: string;
    time: string;               // Payment time
    paymentMethod: string;
    mpesaCode: string;          // M-Pesa transaction code
    receiptNumber: string;
    createdAt?: string;
    $createdAt?: string; // Appwrite timestamp
    $updatedAt?: string; // Appwrite timestamp
}

export type View = 'dashboard' | 'students' | 'payments' | 'sms';