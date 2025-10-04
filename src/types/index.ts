export interface Guardian {
    id: string;
    name: string;
    phone: string;
    email: string;
    relationship: string;
}

export interface Student {
    id: string;
    firstName: string;
    lastName: string;
    grade: string;
    admissionNumber: string;
    dateOfBirth: string;
    guardians: Guardian[];
    feeBalance: number;
    totalFees: number;
    paidFees: number;
}

export interface FeePayment {
    id: string;
    studentId: string;
    studentName: string;
    studentClass: string;      // Added: Student's grade/class
    parentName: string;         // Added: Guardian's name
    parentPhone: string;        // Added: Guardian's phone number
    amount: number;
    date: string;
    time: string;               // Added: Payment time
    paymentMethod: string;
    mpesaCode: string;          // Added: M-Pesa transaction code
    receiptNumber: string;
}

export type View = 'dashboard' | 'students' | 'payments' | 'sms';