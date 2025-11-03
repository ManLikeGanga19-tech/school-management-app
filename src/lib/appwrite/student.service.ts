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
    isTransferred?: boolean;
    transferReason?: string;
    transferDate?: string;
    term1Arrears?: number;
    term2Arrears?: number;
    term3Arrears?: number;
    totalArrears?: number;
    lastArrearsUpdate?: string;
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
    isTransferred?: boolean;
    transferReason?: string;
    transferDate?: string;
    term1Arrears?: number;
    term2Arrears?: number;
    term3Arrears?: number;
    totalArrears?: number;
    lastArrearsUpdate?: string;
}

export const studentService = {
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
                    term1Arrears: 0,
                    term2Arrears: 0,
                    term3Arrears: 0,
                    totalArrears: 0,
                    lastArrearsUpdate: new Date().toISOString(),
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

    async transferStudent(studentId: string, newClass: string) {
        try {
            return await this.updateStudent(studentId, { grade: newClass });
        } catch (error: any) {
            throw new Error(error.message || "Failed to transfer student");
        }
    },

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

    // 🆕 Smart payment allocation with arrears + surplus handling
    async updateTermFeesWithArrears(studentId: string, currentTerm: 1 | 2 | 3, paidAmount: number) {
        try {
            const student = await this.getStudent(studentId);
            const updateData: UpdateStudentData = {};

            let remainingPayment = paidAmount;

            // 🎯 STEP 1: Pay Term 1 Arrears First
            if (student.term1Arrears && student.term1Arrears > 0 && remainingPayment > 0) {
                const payment = Math.min(remainingPayment, student.term1Arrears);
                updateData.term1Arrears = student.term1Arrears - payment;
                remainingPayment -= payment;
                console.log(`💰 Paid Term 1 Arrears: KES ${payment}, Remaining: KES ${updateData.term1Arrears}`);
            }

            // 🎯 STEP 2: Pay Term 2 Arrears
            if (student.term2Arrears && student.term2Arrears > 0 && remainingPayment > 0) {
                const payment = Math.min(remainingPayment, student.term2Arrears);
                updateData.term2Arrears = student.term2Arrears - payment;
                remainingPayment -= payment;
                console.log(`💰 Paid Term 2 Arrears: KES ${payment}, Remaining: KES ${updateData.term2Arrears}`);
            }

            // 🎯 STEP 3: Pay Term 3 Arrears
            if (student.term3Arrears && student.term3Arrears > 0 && remainingPayment > 0) {
                const payment = Math.min(remainingPayment, student.term3Arrears);
                updateData.term3Arrears = student.term3Arrears - payment;
                remainingPayment -= payment;
                console.log(`💰 Paid Term 3 Arrears: KES ${payment}, Remaining: KES ${updateData.term3Arrears}`);
            }

            // 🎯 STEP 4: Pay Current Term Balance
            if (remainingPayment > 0) {
                const termBalance = student[`term${currentTerm}Balance` as keyof StudentDocument] as number;
                const termAmount = student[`term${currentTerm}Amount` as keyof StudentDocument] as number;

                const currentBalance = termBalance ?? termAmount ?? 0;

                // Allow negative balance (overpayment/surplus)
                const newTermBalance = currentBalance - remainingPayment;
                const isTermCleared = newTermBalance <= 0;

                (updateData as any)[`term${currentTerm}Balance`] = newTermBalance;
                (updateData as any)[`term${currentTerm}Paid`] = isTermCleared;

                remainingPayment -= Math.min(remainingPayment, currentBalance);
                console.log(`💰 Paid Current Term ${currentTerm}: Balance: KES ${newTermBalance}`);
            }

            // 🎯 STEP 5: Apply Surplus to Next Terms (if overpaid current term)
            if (remainingPayment > 0) {
                // Apply to next term in sequence
                const nextTerm = (currentTerm % 3) + 1 as 1 | 2 | 3;
                const nextTermBalance = student[`term${nextTerm}Balance` as keyof StudentDocument] as number || 0;

                if (nextTermBalance > 0) {
                    const payment = Math.min(remainingPayment, nextTermBalance);
                    const newNextTermBalance = nextTermBalance - payment;

                    (updateData as any)[`term${nextTerm}Balance`] = newNextTermBalance;
                    (updateData as any)[`term${nextTerm}Paid`] = newNextTermBalance <= 0;

                    remainingPayment -= payment;
                    console.log(`💚 Surplus applied to Term ${nextTerm}: KES ${payment}, Balance: KES ${newNextTermBalance}`);
                }

                // If still surplus, apply to the term after next
                if (remainingPayment > 0) {
                    const thirdTerm = ((currentTerm + 1) % 3) + 1 as 1 | 2 | 3;
                    const thirdTermBalance = student[`term${thirdTerm}Balance` as keyof StudentDocument] as number || 0;

                    if (thirdTermBalance > 0) {
                        const payment = Math.min(remainingPayment, thirdTermBalance);
                        const newThirdTermBalance = thirdTermBalance - payment;

                        (updateData as any)[`term${thirdTerm}Balance`] = newThirdTermBalance;
                        (updateData as any)[`term${thirdTerm}Paid`] = newThirdTermBalance <= 0;

                        remainingPayment -= payment;
                        console.log(`💚 Surplus applied to Term ${thirdTerm}: KES ${payment}, Balance: KES ${newThirdTermBalance}`);
                    }
                }
            }

            // 🎯 STEP 6: Update Total Arrears
            const newTotalArrears =
                (updateData.term1Arrears ?? student.term1Arrears ?? 0) +
                (updateData.term2Arrears ?? student.term2Arrears ?? 0) +
                (updateData.term3Arrears ?? student.term3Arrears ?? 0);

            updateData.totalArrears = newTotalArrears;
            updateData.lastArrearsUpdate = new Date().toISOString();

            // 🎯 STEP 7: Update Overall Fees
            const newPaidFees = (student.paidFees || 0) + paidAmount;
            const newFeeBalance = Math.max((student.totalFees || 0) - newPaidFees, 0);

            updateData.paidFees = newPaidFees;
            updateData.feeBalance = newFeeBalance;

            console.log(`✅ Payment allocated successfully. Total arrears: KES ${newTotalArrears}`);

            return await this.updateStudent(studentId, updateData);
        } catch (error: any) {
            console.error("💥 updateTermFeesWithArrears error:", error);
            throw new Error(error.message || "Failed to update term fees with arrears");
        }
    },

    async rolloverToNextTerm(studentId: string, fromTerm: 1 | 2 | 3) {
        try {
            const student = await this.getStudent(studentId);
            const updateData: UpdateStudentData = {};

            const termBalance = student[`term${fromTerm}Balance` as keyof StudentDocument] as number || 0;

            if (termBalance > 0) {
                const arrearsField = `term${fromTerm}Arrears` as keyof UpdateStudentData;
                const currentArrears = student[arrearsField as keyof StudentDocument] as number || 0;

                (updateData as any)[arrearsField] = currentArrears + termBalance;
                (updateData as any)[`term${fromTerm}Paid`] = false;

                console.log(`📊 Rolled over Term ${fromTerm}: KES ${termBalance} moved to arrears`);
            }

            const newTotalArrears =
                (updateData.term1Arrears ?? student.term1Arrears ?? 0) +
                (updateData.term2Arrears ?? student.term2Arrears ?? 0) +
                (updateData.term3Arrears ?? student.term3Arrears ?? 0);

            updateData.totalArrears = newTotalArrears;
            updateData.lastArrearsUpdate = new Date().toISOString();

            return await this.updateStudent(studentId, updateData);
        } catch (error: any) {
            console.error("💥 rolloverToNextTerm error:", error);
            throw new Error(error.message || "Failed to rollover to next term");
        }
    },

    async rolloverAllStudentsToNextTerm(schoolName: string, fromTerm: 1 | 2 | 3) {
        try {
            const students = await this.getStudentsBySchool(schoolName);
            const results = {
                total: students.length,
                successful: 0,
                failed: 0,
                errors: [] as string[],
            };

            for (const student of students) {
                try {
                    await this.rolloverToNextTerm(student.$id, fromTerm);
                    results.successful++;
                } catch (error: any) {
                    results.failed++;
                    results.errors.push(`${student.firstName} ${student.lastName}: ${error.message}`);
                    console.error(`Failed to rollover student ${student.$id}:`, error);
                }
            }

            console.log(`✅ Rollover complete: ${results.successful}/${results.total} students updated`);
            return results;
        } catch (error: any) {
            console.error("💥 rolloverAllStudentsToNextTerm error:", error);
            throw new Error(error.message || "Failed to rollover all students");
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