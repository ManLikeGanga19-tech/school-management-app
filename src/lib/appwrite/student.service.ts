import { databases } from '../../appwrite/config';
import { ID, Query } from 'appwrite';
import { Models } from 'appwrite';

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
}

// Define the Student document type
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
    createdAt: string;
}

export const studentService = {
    // Create a new student
    async createStudent(userId: string, data: CreateStudentData) {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const STUDENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID!;

            // Create guardian object
            const guardian: Guardian = {
                id: ID.unique(),
                name: data.guardianName,
                phone: data.guardianPhone,
                email: data.guardianEmail,
                relationship: data.relationship,
            };

            const student = await databases.createDocument(
                DATABASE_ID,
                STUDENTS_COLLECTION_ID,
                ID.unique(),
                {
                    userId: userId,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    grade: data.grade,
                    admissionNumber: data.admissionNumber,
                    dateOfBirth: data.dateOfBirth,
                    totalFees: data.totalFees,
                    paidFees: 0,
                    feeBalance: data.totalFees,
                    guardians: JSON.stringify([guardian]),
                    createdAt: new Date().toISOString(),
                }
            );

            return student;
        } catch (error: any) {
            throw new Error(error.message || 'Failed to create student');
        }
    },

    // Get all students for a user
    async getStudents(userId: string) {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const STUDENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID!;

            const response = await databases.listDocuments<StudentDocument>(
                DATABASE_ID,
                STUDENTS_COLLECTION_ID,
                [Query.equal('userId', userId)]
            );

            // Parse guardians JSON string back to array
            const students = response.documents.map(doc => ({
                ...doc,
                guardians: JSON.parse(doc.guardians),
            }));

            return students;
        } catch (error: any) {
            throw new Error(error.message || 'Failed to fetch students');
        }
    },

    // Get a single student by ID
    async getStudent(studentId: string) {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const STUDENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID!;

            const student = await databases.getDocument<StudentDocument>(
                DATABASE_ID,
                STUDENTS_COLLECTION_ID,
                studentId
            );

            return {
                ...student,
                guardians: JSON.parse(student.guardians),
            };
        } catch (error: any) {
            throw new Error(error.message || 'Failed to fetch student');
        }
    },

    // Update a student
    async updateStudent(studentId: string, data: UpdateStudentData) {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const STUDENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID!;

            const student = await databases.updateDocument<StudentDocument>(
                DATABASE_ID,
                STUDENTS_COLLECTION_ID,
                studentId,
                data
            );

            return {
                ...student,
                guardians: JSON.parse(student.guardians),
            };
        } catch (error: any) {
            throw new Error(error.message || 'Failed to update student');
        }
    },

    // Delete a student
    async deleteStudent(studentId: string) {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const STUDENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID!;

            await databases.deleteDocument(
                DATABASE_ID,
                STUDENTS_COLLECTION_ID,
                studentId
            );

            return { success: true };
        } catch (error: any) {
            throw new Error(error.message || 'Failed to delete student');
        }
    },

    // Transfer student to a new class
    async transferStudent(studentId: string, newClass: string) {
        try {
            return await this.updateStudent(studentId, { grade: newClass });
        } catch (error: any) {
            throw new Error(error.message || 'Failed to transfer student');
        }
    },

    // Update student fees
    async updateStudentFees(studentId: string, paidAmount: number) {
        try {
            const student = await this.getStudent(studentId);
            const newPaidFees = student.paidFees + paidAmount;
            const newFeeBalance = student.totalFees - newPaidFees;

            return await this.updateStudent(studentId, {
                paidFees: newPaidFees,
                feeBalance: newFeeBalance,
            });
        } catch (error: any) {
            throw new Error(error.message || 'Failed to update student fees');
        }
    },
};