import { databases } from "../../appwrite/config";
import { ID, Query, Models } from "appwrite";
import { authService } from "./auth.service";
import { StudentType, getFeeStructure } from "@/types";

export interface Guardian {
    id: string;
    name: string;
    phone: string;
    email: string;
    relationship: string;
}

export interface CreateStudentData {
    firstName: string;
    lastName: string;
    grade: string;
    admissionNumber: string;
    dateOfBirth: string;
    totalFees: number;
    guardianName: string;
    guardianPhone: string;
    guardianEmail: string;
    relationship: string;
    studentType: StudentType;
    enrollmentYear: number;
    schoolName: string;
}

export interface UpdateStudentData {
    firstName?: string;
    lastName?: string;
    grade?: string;
    admissionNumber?: string;
    dateOfBirth?: string;
    totalFees?: number;
    paidFees?: number;
    feeBalance?: number;
    guardians?: string;
    studentType?: StudentType;
    enrollmentYear?: number;
    admissionFeePaid?: boolean;
    feeStructure?: string;
    term1Paid?: boolean;
    term1Amount?: number;
    term1Balance?: number;
    term2Paid?: boolean;
    term2Amount?: number;
    term2Balance?: number;
    term3Paid?: boolean;
    term3Amount?: number;
    term3Balance?: number;
    // 👇 new transfer fields
    isTransferred?: boolean;
    transferReason?: string;
    transferDate?: string;
}

export interface StudentDocument extends Models.Document {
    userId: string;
    firstName: string;
    lastName: string;
    grade: string;
    admissionNumber: string;
    dateOfBirth: string;
    totalFees: number;
    paidFees: number;
    feeBalance: number;
    guardians: string;
    schoolName?: string;
    studentType?: StudentType;
    enrollmentYear?: number;
    admissionFeePaid?: boolean;
    feeStructure?: string;
    term1Paid?: boolean;
    term1Amount?: number;
    term1Balance?: number;
    term2Paid?: boolean;
    term2Amount?: number;
    term2Balance?: number;
    term3Paid?: boolean;
    term3Amount?: number;
    term3Balance?: number;
    createdAt: string;
    // 👇 new transfer tracking fields
    isTransferred?: boolean;
    transferReason?: string;
    transferDate?: string;
}

export const studentService = {
    // ✅ Create new student
    async createStudent(userId: string, data: CreateStudentData) {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const STUDENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID!;

            const userProfile = await authService.getUserProfile(userId);
            if (!userProfile?.schoolName) {
                throw new Error("User school name not found. Cannot create student record.");
            }

            const feeStructure = getFeeStructure(data.grade, data.studentType);
            const totalFees = feeStructure.totalAnnual;

            const guardian: Guardian = {
                id: ID.unique(),
                name: data.guardianName,
                phone: data.guardianPhone,
                email: data.guardianEmail,
                relationship: data.relationship,
            };

            const student = await databases.createDocument<StudentDocument>(
                DATABASE_ID,
                STUDENTS_COLLECTION_ID,
                ID.unique(),
                {
                    userId,
                    schoolName: data.schoolName || userProfile.schoolName,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    grade: data.grade,
                    admissionNumber: data.admissionNumber,
                    dateOfBirth: data.dateOfBirth,
                    totalFees,
                    paidFees: 0,
                    feeBalance: totalFees,
                    guardians: JSON.stringify([guardian]),
                    studentType: data.studentType,
                    enrollmentYear: data.enrollmentYear,
                    admissionFeePaid: false,
                    feeStructure: JSON.stringify(feeStructure),
                    term1Paid: false,
                    term1Amount: feeStructure.term1,
                    term1Balance: feeStructure.term1,
                    term2Paid: false,
                    term2Amount: feeStructure.term2,
                    term2Balance: feeStructure.term2,
                    term3Paid: false,
                    term3Amount: feeStructure.term3,
                    term3Balance: feeStructure.term3,
                    isTransferred: false,
                    transferReason: "",
                    transferDate: "",
                    createdAt: new Date().toISOString(),
                }
            );

            return student;
        } catch (error: any) {
            console.error("💥 Failed to create student:", error);
            throw new Error(error.message || "Failed to create student");
        }
    },

    async getStudents(userId: string): Promise<StudentDocument[]> {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const STUDENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID!;

            const response = await databases.listDocuments<StudentDocument>(
                DATABASE_ID,
                STUDENTS_COLLECTION_ID,
                [Query.equal("userId", userId)]
            );

            return response.documents.map((doc) => ({
                ...doc,
                guardians: JSON.parse(doc.guardians),
            }));
        } catch (error: any) {
            throw new Error(error.message || "Failed to fetch students");
        }
    },

    async getStudent(studentId: string): Promise<StudentDocument> {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const STUDENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID!;

            const student = await databases.getDocument<StudentDocument>(
                DATABASE_ID,
                STUDENTS_COLLECTION_ID,
                studentId
            );

            return { ...student, guardians: JSON.parse(student.guardians) };
        } catch (error: any) {
            throw new Error(error.message || "Failed to fetch student");
        }
    },

    async updateStudent(studentId: string, data: UpdateStudentData): Promise<StudentDocument> {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const STUDENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID!;

            if (data.grade || data.studentType) {
                const currentStudent = await this.getStudent(studentId);
                const grade = data.grade || currentStudent.grade;
                const studentType = data.studentType || (currentStudent.studentType as StudentType) || "old";

                const feeStructure = getFeeStructure(grade, studentType);
                const totalFees = feeStructure.totalAnnual;

                data.feeStructure = JSON.stringify(feeStructure);
                data.totalFees = totalFees;
                data.term1Amount = feeStructure.term1;
                data.term2Amount = feeStructure.term2;
                data.term3Amount = feeStructure.term3;

                if (!currentStudent.term1Paid) data.term1Balance = feeStructure.term1;
                if (!currentStudent.term2Paid) data.term2Balance = feeStructure.term2;
                if (!currentStudent.term3Paid) data.term3Balance = feeStructure.term3;

                const paidFees = data.paidFees ?? currentStudent.paidFees;
                data.feeBalance = totalFees - paidFees;
            }

            const student = await databases.updateDocument<StudentDocument>(
                DATABASE_ID,
                STUDENTS_COLLECTION_ID,
                studentId,
                data
            );

            return { ...student, guardians: JSON.parse(student.guardians) };
        } catch (error: any) {
            throw new Error(error.message || "Failed to update student");
        }
    },

    async deleteStudent(studentId: string) {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const STUDENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID!;
            await databases.deleteDocument(DATABASE_ID, STUDENTS_COLLECTION_ID, studentId);
            return { success: true };
        } catch (error: any) {
            throw new Error(error.message || "Failed to delete student");
        }
    },

    // ✅ Transfer to another class (within same school)
    async transferStudent(studentId: string, newClass: string) {
        try {
            return await this.updateStudent(studentId, { grade: newClass });
        } catch (error: any) {
            throw new Error(error.message || "Failed to transfer student");
        }
    },

    // ✅ Mark student as transferred to another school
    async markAsTransferred(studentId: string, reason: string) {
        try {
            const updateData: UpdateStudentData = {
                isTransferred: true,
                transferReason: reason,
                transferDate: new Date().toISOString(),
            };

            return await this.updateStudent(studentId, updateData);
        } catch (error: any) {
            console.error("💥 markAsTransferred error:", error);
            throw new Error(error.message || "Failed to mark student as transferred");
        }
    },

    async updateStudentFees(studentId: string, paidAmount: number) {
        try {
            const student = await this.getStudent(studentId);
            const newPaidFees = student.paidFees + paidAmount;
            const newFeeBalance = Math.max(student.totalFees - newPaidFees, 0);

            return await this.updateStudent(studentId, {
                paidFees: newPaidFees,
                feeBalance: newFeeBalance,
            });
        } catch (error: any) {
            throw new Error(error.message || "Failed to update student fees");
        }
    },

    async updateTermFees(studentId: string, term: 1 | 2 | 3, paidAmount: number) {
        try {
            const student = await this.getStudent(studentId);
            const updateData: UpdateStudentData = {};

            const termAmount = student[`term${term}Amount` as keyof StudentDocument] as number;
            const termBalance = student[`term${term}Balance` as keyof StudentDocument] as number;

            const newTermBalance = Math.max((termBalance ?? termAmount ?? 0) - paidAmount, 0);
            const isTermCleared = newTermBalance <= 0;

            (updateData as any)[`term${term}Balance`] = newTermBalance;
            (updateData as any)[`term${term}Paid`] = isTermCleared;

            const newPaidFees = (student.paidFees || 0) + paidAmount;
            const newFeeBalance = Math.max((student.totalFees || 0) - newPaidFees, 0);

            updateData.paidFees = newPaidFees;
            updateData.feeBalance = newFeeBalance;

            return await this.updateStudent(studentId, updateData);
        } catch (error: any) {
            console.error("💥 updateTermFees error:", error);
            throw new Error(error.message || "Failed to update term fees");
        }
    },

    async getStudentsBySchool(schoolName: string): Promise<StudentDocument[]> {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID!;

            const res = await databases.listDocuments<StudentDocument>(
                DATABASE_ID,
                COLLECTION_ID,
                [Query.equal("schoolName", schoolName)]
            );

            return res.documents.map((doc) => ({
                ...doc,
                guardians: JSON.parse(doc.guardians),
            }));
        } catch (error: any) {
            console.error("💥 Error fetching students by school:", error);
            throw new Error(error.message || "Failed to fetch students for this school");
        }
    },
};
