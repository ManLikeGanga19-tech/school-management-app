import { databases } from "../../appwrite/config";
import { ID, Query, Models } from "appwrite";

// ✅ Arrears History Record Interface
export interface ArrearsHistoryRecord extends Models.Document {
    studentId: string;
    admissionNumber: string;
    studentName: string;
    academicYear: string;
    term: 1 | 2 | 3;
    amount: number;
    enteredBy: string;
    enteredAt: string;
    schoolName: string;
}

// ✅ Create Arrears Record Data
export interface CreateArrearsData {
    studentId: string;
    admissionNumber: string;
    studentName: string;
    academicYear: string;
    term: 1 | 2 | 3;
    amount: number;
    enteredBy: string;
    schoolName: string;
}

// ✅ Arrears Summary (for reporting)
export interface ArrearsSummary {
    studentId: string;
    studentName: string;
    admissionNumber: string;
    term1Arrears: number;
    term2Arrears: number;
    term3Arrears: number;
    totalArrears: number;
    recordCount: number;
    lastUpdated: string;
}

export const arrearsService = {
    /**
     * ✅ Create a new arrears record
     */
    async createArrearsRecord(data: CreateArrearsData): Promise<ArrearsHistoryRecord> {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const ARREARS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_ARREARS_COLLECTION_ID!;

            const record = await databases.createDocument<ArrearsHistoryRecord>(
                DATABASE_ID,
                ARREARS_COLLECTION_ID,
                ID.unique(),
                {
                    studentId: data.studentId,
                    admissionNumber: data.admissionNumber,
                    studentName: data.studentName,
                    academicYear: data.academicYear,
                    term: data.term,
                    amount: data.amount,
                    enteredBy: data.enteredBy,
                    enteredAt: new Date().toISOString(),
                    schoolName: data.schoolName,
                }
            );

            console.log(`✅ Arrears record created for ${data.studentName}`);
            return record;
        } catch (error: any) {
            console.error("💥 Failed to create arrears record:", error);
            throw new Error(error.message || "Failed to create arrears record");
        }
    },

    /**
     * ✅ Get all arrears records for a specific student
     */
    async getStudentArrearsHistory(studentId: string): Promise<ArrearsHistoryRecord[]> {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const ARREARS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_ARREARS_COLLECTION_ID!;

            const response = await databases.listDocuments<ArrearsHistoryRecord>(
                DATABASE_ID,
                ARREARS_COLLECTION_ID,
                [
                    Query.equal("studentId", studentId),
                    Query.orderDesc("enteredAt"),
                    Query.limit(100), // Adjust as needed
                ]
            );

            return response.documents;
        } catch (error: any) {
            console.error("💥 Failed to fetch student arrears history:", error);
            throw new Error(error.message || "Failed to fetch arrears history");
        }
    },

    /**
     * ✅ Get all arrears records for a school
     */
    async getSchoolArrearsHistory(schoolName: string): Promise<ArrearsHistoryRecord[]> {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const ARREARS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_ARREARS_COLLECTION_ID!;

            const response = await databases.listDocuments<ArrearsHistoryRecord>(
                DATABASE_ID,
                ARREARS_COLLECTION_ID,
                [
                    Query.equal("schoolName", schoolName),
                    Query.orderDesc("enteredAt"),
                    Query.limit(1000), // Adjust based on school size
                ]
            );

            return response.documents;
        } catch (error: any) {
            console.error("💥 Failed to fetch school arrears history:", error);
            throw new Error(error.message || "Failed to fetch school arrears");
        }
    },

    /**
     * ✅ Get arrears for specific academic year and term
     */
    async getArrearsByPeriod(
        schoolName: string,
        academicYear: string,
        term?: 1 | 2 | 3
    ): Promise<ArrearsHistoryRecord[]> {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const ARREARS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_ARREARS_COLLECTION_ID!;

            const queries = [
                Query.equal("schoolName", schoolName),
                Query.equal("academicYear", academicYear),
            ];

            if (term) {
                queries.push(Query.equal("term", term));
            }

            queries.push(Query.orderDesc("enteredAt"));

            const response = await databases.listDocuments<ArrearsHistoryRecord>(
                DATABASE_ID,
                ARREARS_COLLECTION_ID,
                queries
            );

            return response.documents;
        } catch (error: any) {
            console.error("💥 Failed to fetch arrears by period:", error);
            throw new Error(error.message || "Failed to fetch arrears for period");
        }
    },

    /**
     * ✅ Get arrears summary for a student (aggregated view)
     */
    async getStudentArrearsSummary(studentId: string): Promise<ArrearsSummary | null> {
        try {
            const records = await this.getStudentArrearsHistory(studentId);

            if (records.length === 0) return null;

            const summary: ArrearsSummary = {
                studentId: records[0].studentId,
                studentName: records[0].studentName,
                admissionNumber: records[0].admissionNumber,
                term1Arrears: 0,
                term2Arrears: 0,
                term3Arrears: 0,
                totalArrears: 0,
                recordCount: records.length,
                lastUpdated: records[0].enteredAt,
            };

            // Aggregate by term (sum up latest amounts per term/year)
            const termMap = new Map<string, number>();

            records.forEach((record) => {
                const key = `${record.academicYear}-term${record.term}`;
                if (!termMap.has(key)) {
                    termMap.set(key, record.amount);
                }
            });

            records.forEach((record) => {
                if (record.term === 1) summary.term1Arrears += record.amount;
                if (record.term === 2) summary.term2Arrears += record.amount;
                if (record.term === 3) summary.term3Arrears += record.amount;
            });

            summary.totalArrears = summary.term1Arrears + summary.term2Arrears + summary.term3Arrears;

            return summary;
        } catch (error: any) {
            console.error("💥 Failed to get arrears summary:", error);
            throw new Error(error.message || "Failed to get arrears summary");
        }
    },

    /**
     * ✅ Delete an arrears record (for corrections/mistakes)
     */
    async deleteArrearsRecord(recordId: string): Promise<{ success: boolean }> {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const ARREARS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_ARREARS_COLLECTION_ID!;

            await databases.deleteDocument(DATABASE_ID, ARREARS_COLLECTION_ID, recordId);

            console.log(`✅ Arrears record ${recordId} deleted`);
            return { success: true };
        } catch (error: any) {
            console.error("💥 Failed to delete arrears record:", error);
            throw new Error(error.message || "Failed to delete arrears record");
        }
    },

    /**
     * ✅ Update an arrears record (for corrections)
     */
    async updateArrearsRecord(
        recordId: string,
        updates: Partial<Pick<ArrearsHistoryRecord, "amount" | "academicYear" | "term">>
    ): Promise<ArrearsHistoryRecord> {
        try {
            const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
            const ARREARS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_ARREARS_COLLECTION_ID!;

            const record = await databases.updateDocument<ArrearsHistoryRecord>(
                DATABASE_ID,
                ARREARS_COLLECTION_ID,
                recordId,
                updates
            );

            console.log(`✅ Arrears record ${recordId} updated`);
            return record;
        } catch (error: any) {
            console.error("💥 Failed to update arrears record:", error);
            throw new Error(error.message || "Failed to update arrears record");
        }
    },

    /**
     * ✅ Get total arrears amount for a school
     */
    async getSchoolTotalArrears(schoolName: string): Promise<number> {
        try {
            const records = await this.getSchoolArrearsHistory(schoolName);

            // Get unique student-term combinations and sum their latest arrears
            const latestArrearsMap = new Map<string, number>();

            records.forEach((record) => {
                const key = `${record.studentId}-${record.academicYear}-term${record.term}`;
                if (!latestArrearsMap.has(key)) {
                    latestArrearsMap.set(key, record.amount);
                }
            });

            const total = Array.from(latestArrearsMap.values()).reduce((sum, amount) => sum + amount, 0);

            return total;
        } catch (error: any) {
            console.error("💥 Failed to calculate school total arrears:", error);
            throw new Error(error.message || "Failed to calculate total arrears");
        }
    },

    /**
     * ✅ Get arrears report for all students in a school (grouped by student)
     */
    async getSchoolArrearsReport(schoolName: string): Promise<ArrearsSummary[]> {
        try {
            const records = await this.getSchoolArrearsHistory(schoolName);

            // Group by studentId
            const studentMap = new Map<string, ArrearsHistoryRecord[]>();

            records.forEach((record) => {
                if (!studentMap.has(record.studentId)) {
                    studentMap.set(record.studentId, []);
                }
                studentMap.get(record.studentId)!.push(record);
            });

            // Generate summaries
            const summaries: ArrearsSummary[] = [];

            for (const [studentId, studentRecords] of studentMap.entries()) {
                const summary: ArrearsSummary = {
                    studentId,
                    studentName: studentRecords[0].studentName,
                    admissionNumber: studentRecords[0].admissionNumber,
                    term1Arrears: 0,
                    term2Arrears: 0,
                    term3Arrears: 0,
                    totalArrears: 0,
                    recordCount: studentRecords.length,
                    lastUpdated: studentRecords[0].enteredAt,
                };

                // Get latest arrears per term
                const term1Records = studentRecords.filter((r) => r.term === 1);
                const term2Records = studentRecords.filter((r) => r.term === 2);
                const term3Records = studentRecords.filter((r) => r.term === 3);

                if (term1Records.length > 0) summary.term1Arrears = term1Records[0].amount;
                if (term2Records.length > 0) summary.term2Arrears = term2Records[0].amount;
                if (term3Records.length > 0) summary.term3Arrears = term3Records[0].amount;

                summary.totalArrears = summary.term1Arrears + summary.term2Arrears + summary.term3Arrears;

                if (summary.totalArrears > 0) {
                    summaries.push(summary);
                }
            }

            // Sort by total arrears (highest first)
            summaries.sort((a, b) => b.totalArrears - a.totalArrears);

            return summaries;
        } catch (error: any) {
            console.error("💥 Failed to generate school arrears report:", error);
            throw new Error(error.message || "Failed to generate arrears report");
        }
    },
};