'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { studentService } from '@/lib/appwrite/student.service';
import { arrearsService } from '@/lib/appwrite/arrears.service';
import { authService } from '@/lib/appwrite/auth.service';
import { Student } from '@/types';
import { Search, History, AlertCircle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { ArrearsHistoryRecord } from '@/lib/appwrite/arrears.service';

export function ArrearsManagement() {
    const [students, setStudents] = useState<Student[]>([]);
    const [arrearsData, setArrearsData] = useState<
        Record<string, { academicYear: string; term: 1 | 2 | 3; amount: number }>
    >({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [schoolName, setSchoolName] = useState('');
    const [selectedStudentHistory, setSelectedStudentHistory] = useState<ArrearsHistoryRecord[]>([]);
    const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

    // ✅ Load students
    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        setIsLoading(true);
        try {
            const user = await authService.getCurrentUser();
            if (!user) throw new Error('User not authenticated');

            const profile = await authService.getUserProfile(user.$id);
            if (!profile?.schoolName) throw new Error('Missing school name in profile');

            setSchoolName(profile.schoolName);

            const fetched = await studentService.getStudentsBySchool(profile.schoolName);
            const mappedStudents: Student[] = fetched.map((doc: any) => ({
                id: doc.$id,
                firstName: doc.firstName,
                lastName: doc.lastName,
                admissionNumber: doc.admissionNumber,
                grade: doc.grade,
                dateOfBirth: doc.dateOfBirth || '',
                guardians: [],
                feeBalance: doc.feeBalance ?? 0,
                totalFees: doc.totalFees ?? 0,
                paidFees: doc.paidFees ?? 0,
                term1Arrears: doc.term1Arrears ?? 0,
                term2Arrears: doc.term2Arrears ?? 0,
                term3Arrears: doc.term3Arrears ?? 0,
                totalArrears: doc.totalArrears ?? 0,
            }));

            setStudents(mappedStudents);

            // Initialize arrears form state
            const init: Record<
                string,
                { academicYear: string; term: 1 | 2 | 3; amount: number }
            > = {};
            mappedStudents.forEach((s) => {
                init[s.id] = { academicYear: '', term: 1, amount: 0 };
            });
            setArrearsData(init);
        } catch (error: any) {
            console.error('Failed to fetch students:', error);
            toast.error('Failed to load students', {
                description: error.message || 'Could not load arrears data',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // ✅ Handle form input
    const handleChange = (
        id: string,
        field: keyof { academicYear: string; term: 1 | 2 | 3; amount: number },
        value: string | number
    ) => {
        setArrearsData((prev) => ({
            ...prev,
            [id]: { ...prev[id], [field]: value },
        }));
    };

    // ✅ Save arrears entry
    const handleSave = async (student: Student) => {
        const entry = arrearsData[student.id];

        // Validation
        if (!entry?.academicYear || !entry?.term || !entry?.amount) {
            toast.error('Missing fields', {
                description: 'Please fill all arrears details before saving.',
            });
            return;
        }

        if (entry.amount <= 0) {
            toast.error('Invalid amount', {
                description: 'Arrears amount must be greater than 0.',
            });
            return;
        }

        setIsSaving(student.id);

        try {
            const user = await authService.getCurrentUser();
            if (!user) throw new Error('User not authenticated');

            const arrearsField = `term${entry.term}Arrears` as
                | 'term1Arrears'
                | 'term2Arrears'
                | 'term3Arrears';

            // 🎯 STEP 1: Create arrears history record in separate collection
            await arrearsService.createArrearsRecord({
                studentId: student.id,
                admissionNumber: student.admissionNumber,
                studentName: `${student.firstName} ${student.lastName}`,
                academicYear: entry.academicYear,
                term: entry.term,
                amount: entry.amount,
                enteredBy: user.$id,
                schoolName: schoolName,
            });

            // 🎯 STEP 2: Update student's arrears fields
            const currentTermArrears = student[arrearsField] ?? 0;
            const newTermArrears = currentTermArrears + entry.amount;

            const updateData: any = {
                [arrearsField]: newTermArrears,
                lastArrearsUpdate: new Date().toISOString(),
                totalArrears:
                    (arrearsField === 'term1Arrears' ? newTermArrears : student.term1Arrears ?? 0) +
                    (arrearsField === 'term2Arrears' ? newTermArrears : student.term2Arrears ?? 0) +
                    (arrearsField === 'term3Arrears' ? newTermArrears : student.term3Arrears ?? 0),
            };

            await studentService.updateStudent(student.id, updateData);

            // 🎯 STEP 3: Update local state
            setStudents((prev) =>
                prev.map((s) =>
                    s.id === student.id
                        ? {
                            ...s,
                            [arrearsField]: newTermArrears,
                            totalArrears: updateData.totalArrears,
                        }
                        : s
                )
            );

            // 🎯 STEP 4: Reset form for this student
            setArrearsData((prev) => ({
                ...prev,
                [student.id]: { academicYear: '', term: 1, amount: 0 },
            }));

            toast.success('Arrears Recorded ✅', {
                description: `${student.firstName} ${student.lastName} - Term ${entry.term}, Year ${entry.academicYear}: KES ${entry.amount.toLocaleString()}`,
            });
        } catch (error: any) {
            console.error('Failed to update arrears:', error);
            toast.error('Update Failed', {
                description: error.message || 'Could not update arrears record',
            });
        } finally {
            setIsSaving(null);
        }
    };

    // ✅ View student arrears history
    const viewHistory = async (student: Student) => {
        try {
            const history = await arrearsService.getStudentArrearsHistory(student.id);
            setSelectedStudentHistory(history);
            setIsHistoryDialogOpen(true);
        } catch (error: any) {
            console.error('Failed to fetch history:', error);
            toast.error('Failed to load history', {
                description: error.message || 'Could not load arrears history',
            });
        }
    };

    // ✅ Search filter
    const filteredStudents = students.filter((s) => {
        const query = search.toLowerCase();
        return (
            s.firstName.toLowerCase().includes(query) ||
            s.lastName.toLowerCase().includes(query) ||
            s.admissionNumber.toLowerCase().includes(query)
        );
    });

    return (
        <div className="space-y-6">
            <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                        <CardTitle className="text-blue-900 text-lg flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Arrears Management
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                            Record and track student fee arrears by term and academic year
                        </p>
                    </div>

                    {/* 🔍 Search */}
                    <div className="relative w-full md:w-1/3">
                        <Search className="absolute left-3 top-2.5 text-gray-400 h-4 w-4" />
                        <Input
                            type="text"
                            placeholder="Search by name or admission number..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-3 py-2 w-full"
                        />
                    </div>
                </CardHeader>

                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-gray-600">Loading student data...</div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="text-center py-6 text-gray-500">
                            {search ? 'No students found matching your search.' : 'No students found.'}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full border border-gray-200 rounded-lg bg-white">
                                <thead className="bg-blue-100 text-gray-700">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Name</th>
                                        <th className="px-4 py-2 text-left">Admission No.</th>
                                        <th className="px-4 py-2 text-left">Class</th>
                                        <th className="px-4 py-2 text-left">Current Arrears</th>
                                        <th className="px-4 py-2 text-left">Academic Year</th>
                                        <th className="px-4 py-2 text-left">Term</th>
                                        <th className="px-4 py-2 text-left">Amount (KES)</th>
                                        <th className="px-4 py-2 text-left">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map((student) => (
                                        <tr
                                            key={student.id}
                                            className="border-t hover:bg-blue-50 transition-colors"
                                        >
                                            <td className="px-4 py-2 font-medium text-gray-800">
                                                {student.firstName} {student.lastName}
                                            </td>
                                            <td className="px-4 py-2 text-gray-700">
                                                {student.admissionNumber}
                                            </td>
                                            <td className="px-4 py-2 text-gray-700">{student.grade}</td>
                                            <td className="px-4 py-2">
                                                <div className="space-y-1">
                                                    <div
                                                        className={`font-semibold ${(student.totalArrears ?? 0) > 0
                                                                ? 'text-red-600'
                                                                : 'text-green-600'
                                                            }`}
                                                    >
                                                        KES {(student.totalArrears ?? 0).toLocaleString()}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        T1: {student.term1Arrears ?? 0} | T2:{' '}
                                                        {student.term2Arrears ?? 0} | T3:{' '}
                                                        {student.term3Arrears ?? 0}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2">
                                                <Input
                                                    type="text"
                                                    placeholder="e.g. 2024"
                                                    value={arrearsData[student.id]?.academicYear || ''}
                                                    onChange={(e) =>
                                                        handleChange(student.id, 'academicYear', e.target.value)
                                                    }
                                                    className="w-28"
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <select
                                                    value={arrearsData[student.id]?.term || 1}
                                                    onChange={(e) =>
                                                        handleChange(
                                                            student.id,
                                                            'term',
                                                            parseInt(e.target.value) as 1 | 2 | 3
                                                        )
                                                    }
                                                    className="border rounded-md p-2 w-full focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value={1}>Term 1</option>
                                                    <option value={2}>Term 2</option>
                                                    <option value={3}>Term 3</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-2">
                                                <Input
                                                    type="number"
                                                    placeholder="Amount"
                                                    value={arrearsData[student.id]?.amount || ''}
                                                    onChange={(e) =>
                                                        handleChange(
                                                            student.id,
                                                            'amount',
                                                            parseFloat(e.target.value) || 0
                                                        )
                                                    }
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={() => handleSave(student)}
                                                        disabled={isSaving === student.id}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                                        size="sm"
                                                    >
                                                        {isSaving === student.id ? 'Saving...' : 'Save'}
                                                    </Button>
                                                    <Button
                                                        onClick={() => viewHistory(student)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex items-center gap-1"
                                                    >
                                                        <History className="h-4 w-4" />
                                                        History
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 📜 Arrears History Dialog */}
            <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <History className="h-5 w-5" />
                            Arrears History
                        </DialogTitle>
                    </DialogHeader>

                    {selectedStudentHistory.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No arrears history found for this student.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-lg">
                                    {selectedStudentHistory[0]?.studentName}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Admission No: {selectedStudentHistory[0]?.admissionNumber}
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full border border-gray-200 rounded-lg">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-4 py-2 text-left">Date Entered</th>
                                            <th className="px-4 py-2 text-left">Academic Year</th>
                                            <th className="px-4 py-2 text-left">Term</th>
                                            <th className="px-4 py-2 text-left">Amount (KES)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedStudentHistory.map((record) => (
                                            <tr key={record.$id} className="border-t hover:bg-gray-50">
                                                <td className="px-4 py-2">
                                                    {new Date(record.enteredAt).toLocaleDateString('en-GB', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </td>
                                                <td className="px-4 py-2">{record.academicYear}</td>
                                                <td className="px-4 py-2">Term {record.term}</td>
                                                <td className="px-4 py-2 font-semibold text-red-600">
                                                    {record.amount.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-100 font-semibold">
                                        <tr>
                                            <td colSpan={3} className="px-4 py-2 text-right">
                                                Total:
                                            </td>
                                            <td className="px-4 py-2 text-red-600">
                                                KES{' '}
                                                {selectedStudentHistory
                                                    .reduce((sum, r) => sum + r.amount, 0)
                                                    .toLocaleString()}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}