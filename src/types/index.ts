// ============================================
// FILE: types/index.ts
// Fixed Type Definitions with Fee Structure Integration
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

    // NEW FIELDS (optional to maintain backward compatibility)
    studentType?: 'new' | 'old';
    enrollmentYear?: number;
    admissionFeePaid?: boolean;
    feeStructure?: string; // JSON string
    schoolName?: string;

    // TERM-BASED FEE TRACKING
    term1Paid?: boolean;
    term1Amount?: number;
    term1Balance?: number;
    term2Paid?: boolean;
    term2Amount?: number;
    term2Balance?: number;
    term3Paid?: boolean;
    term3Amount?: number;
    term3Balance?: number;

    // ✅ TRANSFER TRACKING FIELDS (NEW)
    isTransferred?: boolean; // true if transferred to another school
    transferReason?: string; // reason for transfer
    transferDate?: string; // ISO date string of transfer
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

// ============================================
// FEE STRUCTURE TYPES (NEW - Added below existing types)
// ============================================

export type StudentType = 'new' | 'old';

export interface FeeStructure {
    term1: number;
    term2: number;
    term3: number;
    totalAnnual: number;
    oneTimeFees?: {
        admissionFee: number;
        admissionForm: number;
        schoolBadge: number;
        schoolDiary: number;
        reportBook?: number;
        total: number;
    };
}

// Fee Structure Configuration
export const FEE_STRUCTURES = {
    // Daycare, PP1, PP2
    earlyYears: {
        old: {
            term1: 6000,
            term2: 5700,
            term3: 5700,
            totalAnnual: 17400,
        },
        new: {
            term1: 7500,
            term2: 5700,
            term3: 5700,
            totalAnnual: 18900,
            oneTimeFees: {
                admissionFee: 1000,
                admissionForm: 400,
                schoolBadge: 100,
                schoolDiary: 300,
                total: 1800,
            },
        },
    },
    // Grades 1-3
    lowerPrimary: {
        old: {
            term1: 6700,
            term2: 6500,
            term3: 6500,
            totalAnnual: 19700,
        },
        new: {
            term1: 8500,
            term2: 6500,
            term3: 6500,
            totalAnnual: 21500,
            oneTimeFees: {
                admissionFee: 1000,
                admissionForm: 300,
                schoolBadge: 100,
                schoolDiary: 250,
                reportBook: 250,
                total: 1900,
            },
        },
    },
    // Grades 4-6
    upperPrimary: {
        old: {
            term1: 7200,
            term2: 6800,
            term3: 6800,
            totalAnnual: 20800,
        },
        new: {
            term1: 8750,
            term2: 6800,
            term3: 6800,
            totalAnnual: 22350,
            oneTimeFees: {
                admissionFee: 1000,
                admissionForm: 450,
                schoolBadge: 100,
                schoolDiary: 350,
                total: 1900,
            },
        },
    },
    // Grades 7-8 (Junior Secondary)
    juniorSecondary: {
        old: {
            term1: 10000,
            term2: 10000,
            term3: 8500,
            totalAnnual: 28500,
        },
        new: {
            term1: 13000, // includes 3000 admission
            term2: 10000,
            term3: 8500,
            totalAnnual: 31500,
            oneTimeFees: {
                admissionFee: 3000,
                admissionForm: 0,
                schoolBadge: 0,
                schoolDiary: 0,
                total: 3000,
            },
        },
    },
};

// Helper function to get fee structure based on grade and student type
export function getFeeStructure(grade: string, studentType: StudentType): FeeStructure {
    // Early Years: Daycare, PP1, PP2
    if (['Daycare', 'PP1 (Pre-Primary 1)', 'PP2 (Pre-Primary 2)'].includes(grade)) {
        return FEE_STRUCTURES.earlyYears[studentType];
    }

    // Lower Primary: Grade 1-3
    if (['Grade 1', 'Grade 2', 'Grade 3'].includes(grade)) {
        return FEE_STRUCTURES.lowerPrimary[studentType];
    }

    // Upper Primary: Grade 4-6
    if (['Grade 4', 'Grade 5', 'Grade 6'].includes(grade)) {
        return FEE_STRUCTURES.upperPrimary[studentType];
    }

    // Junior Secondary: Grade 7-8
    if (['Grade 7', 'Grade 8'].includes(grade)) {
        return FEE_STRUCTURES.juniorSecondary[studentType];
    }

    // Fallback to lower primary if grade not found
    return FEE_STRUCTURES.lowerPrimary[studentType];
}

// Helper function to calculate total fees for a student
export function calculateStudentFees(grade: string, studentType: StudentType): number {
    const feeStructure = getFeeStructure(grade, studentType);
    return feeStructure.totalAnnual;
}
