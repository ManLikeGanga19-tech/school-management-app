'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
    Student,
    Guardian,
    calculateTotalOwed,
    SystemSettings,
} from '@/types';
import {
    CheckCircle2,
    XCircle,
    Calendar,
    User,
    Phone,
    Mail,
    GraduationCap,
    Hash,
    Cake,
    DollarSign,
    AlertTriangle,
    History,
    RefreshCw,
} from 'lucide-react';
import { arrearsService, ArrearsHistoryRecord } from '@/lib/appwrite/arrears.service';
import { studentService } from '@/lib/appwrite/student.service';
import { systemSettingsService } from '@/lib/appwrite/system-settings.service';
import { authService } from '@/lib/appwrite/auth.service';
import { toast } from 'sonner';

const formatDate = (iso?: string) => {
    if (!iso) return 'N/A';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
};

interface StudentDetailCardProps {
    student: Student | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function StudentDetailCard({ student: initialStudent, open, onOpenChange }: StudentDetailCardProps) {
    const [student, setStudent] = useState<Student | null>(initialStudent);
    const [arrearsHistory, setArrearsHistory] = useState<ArrearsHistoryRecord[]>([]);
    const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Use system settings academic year, fallback to current year
    const currentAcademicYear = systemSettings?.academicYear || new Date().getFullYear().toString();

    // Fetch system settings, arrears history and student data when dialog opens
    useEffect(() => {
        if (open && student?.id) {
            fetchSystemSettings();
            fetchArrearsHistory();
            refreshStudentData();
        }
    }, [open, student?.id]);

    // Update local student state when prop changes
    useEffect(() => {
        setStudent(initialStudent);
    }, [initialStudent]);

    const fetchSystemSettings = async () => {
        try {
            const user = await authService.getCurrentUser();
            if (!user) return;

            const profile = await authService.getUserProfile(user.$id);
            if (!profile?.schoolName) return;

            const settings = await systemSettingsService.getSettings(profile.schoolName);
            setSystemSettings(settings);
        } catch (error: any) {
            console.error('Failed to fetch system settings:', error);
            // Use fallback year if settings not available
        }
    };

    const fetchArrearsHistory = async () => {
        if (!student?.id) return;

        setIsLoadingHistory(true);
        try {
            const history = await arrearsService.getStudentArrearsHistory(student.id);
            setArrearsHistory(history);
        } catch (error: any) {
            console.error('Failed to fetch arrears history:', error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const refreshStudentData = async () => {
        if (!student?.id) return;

        setIsRefreshing(true);
        try {
            const updatedStudent = await studentService.getStudent(student.id);
            setStudent({
                ...updatedStudent,
                id: updatedStudent.$id,
                guardians: typeof updatedStudent.guardians === 'string'
                    ? JSON.parse(updatedStudent.guardians)
                    : updatedStudent.guardians,
            });
        } catch (error: any) {
            console.error('Failed to refresh student data:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleRefresh = async () => {
        await Promise.all([
            fetchSystemSettings(),
            refreshStudentData(),
            fetchArrearsHistory()
        ]);
        toast.success('Data refreshed', {
            description: 'Student information updated successfully',
        });
    };

    if (!student) return null;

    const guardians =
        typeof student.guardians === 'string'
            ? JSON.parse(student.guardians)
            : (student.guardians as Guardian[]);

    const feeStructure = student.feeStructure ? JSON.parse(student.feeStructure) : null;

    // Calculate current year arrears (from current year's terms)
    const currentYearArrears = (student.term1Arrears || 0) + (student.term2Arrears || 0) + (student.term3Arrears || 0);

    // Separate history by current year vs previous years
    const currentYearHistory = arrearsHistory.filter(
        record => record.academicYear === currentAcademicYear
    );
    const previousYearsHistory = arrearsHistory.filter(
        record => record.academicYear !== currentAcademicYear
    );

    // Calculate previous years total
    const previousYearsTotal = previousYearsHistory.reduce((sum, record) => sum + record.amount, 0);

    const totalOwed = calculateTotalOwed(student);
    const hasOutstandingArrears = currentYearArrears > 0 || previousYearsTotal > 0;

    const renderCurrentTermCard = (
        term: 1 | 2 | 3,
        termPaid: boolean | undefined,
        termAmount: number | undefined,
        termBalance: number | undefined,
        termArrears: number | undefined
    ) => {
        const amount = termAmount ?? feeStructure?.[`term${term}`] ?? 0;
        const balance = typeof termBalance === 'number' ? termBalance : amount;
        const isPaid = typeof termPaid === 'boolean' ? termPaid : balance <= 0;
        const arrears = termArrears || 0;

        return (
            <Card
                key={term}
                className={`border-2 transition-shadow hover:shadow-md ${isPaid && arrears === 0
                        ? 'border-green-400 bg-green-50/50'
                        : arrears > 0
                            ? 'border-red-400 bg-red-50/50'
                            : 'border-orange-400 bg-orange-50/50'
                    }`}
            >
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            {isPaid && arrears === 0 ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                                <XCircle className="h-5 w-5 text-orange-600" />
                            )}
                            <span className="text-base font-semibold text-gray-900">
                                Term {term} - {currentAcademicYear}
                            </span>
                        </div>
                        <Badge
                            variant={isPaid && arrears === 0 ? 'default' : 'destructive'}
                            className="text-xs"
                        >
                            {isPaid && arrears === 0 ? 'PAID' : arrears > 0 ? 'HAS ARREARS' : 'UNPAID'}
                        </Badge>
                    </div>

                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Term Fee:</span>
                            <span className="font-semibold">KES {amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Balance:</span>
                            <span className={`font-semibold ${isPaid ? 'text-green-600' : 'text-red-600'}`}>
                                KES {balance.toLocaleString()}
                            </span>
                        </div>
                        {arrears > 0 && (
                            <div className="flex justify-between border-t pt-1 mt-1">
                                <span className="text-red-700 font-medium">Arrears:</span>
                                <span className="font-bold text-red-700">
                                    KES {arrears.toLocaleString()}
                                </span>
                            </div>
                        )}
                    </div>

                    <Separator className="my-2" />
                    <p className={`text-center text-xs font-semibold ${isPaid && arrears === 0
                            ? 'text-green-700'
                            : arrears > 0
                                ? 'text-red-700'
                                : 'text-orange-700'
                        }`}>
                        {isPaid && arrears === 0
                            ? 'Fully Paid'
                            : arrears > 0
                                ? `Arrears: KES ${arrears.toLocaleString()}`
                                : 'Pending Payment'}
                    </p>
                </CardContent>
            </Card>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
                <DialogHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 rounded-lg">
                                <GraduationCap className="h-5 w-5 text-blue-600" />
                            </div>
                            Student Profile
                        </DialogTitle>
                        <Button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            {isRefreshing ? 'Refreshing...' : 'Refresh'}
                        </Button>
                    </div>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Student Info */}
                    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start flex-wrap gap-3">
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-gray-900">
                                        {student.firstName} {student.lastName}
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline" className="bg-white text-xs">
                                            <Hash className="h-3 w-3 mr-1" />
                                            {student.admissionNumber}
                                        </Badge>
                                        <Badge className="bg-blue-600 text-xs">{student.grade}</Badge>
                                    </div>
                                </div>
                                <div className="text-right text-sm space-y-1">
                                    <div className="flex items-center gap-1.5 text-gray-600">
                                        <Cake className="h-4 w-4" />
                                        <span>{student.dateOfBirth}</span>
                                    </div>
                                    {student.enrollmentYear && (
                                        <div className="flex items-center gap-1.5 text-gray-600">
                                            <Calendar className="h-4 w-4" />
                                            <span>Joined {student.enrollmentYear}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Guardian Info */}
                    <Card>
                        <CardHeader className="bg-gray-50 py-3">
                            <h4 className="text-base font-semibold flex items-center gap-2">
                                <User className="h-4 w-4 text-blue-600" />
                                Guardian Information
                            </h4>
                        </CardHeader>
                        <CardContent className="p-4">
                            {guardians.map((g: Guardian, i: number) => (
                                <div key={g.id || i} className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm">{g.name}</span>
                                        <Badge variant="outline" className="text-xs">
                                            {g.relationship}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                                        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded">
                                            <Phone className="h-3 w-3" />
                                            {g.phone}
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded">
                                            <Mail className="h-3 w-3" />
                                            {g.email}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Previous Years Arrears */}
                    {previousYearsHistory.length > 0 && (
                        <Card className="border-2 border-red-300 bg-gradient-to-r from-red-50 to-pink-50">
                            <CardHeader className="bg-red-100 py-3">
                                <h4 className="text-base font-semibold flex items-center gap-2 text-red-900">
                                    <AlertTriangle className="h-5 w-5 text-red-700" />
                                    Previous Years Arrears
                                </h4>
                            </CardHeader>
                            <CardContent className="p-4">
                                {isLoadingHistory ? (
                                    <div className="text-center py-4 text-gray-500">Loading history...</div>
                                ) : (
                                    <div className="space-y-3">
                                        {previousYearsHistory
                                            .sort((a, b) =>
                                                new Date(b.enteredAt).getTime() - new Date(a.enteredAt).getTime()
                                            )
                                            .map((record) => (
                                                <Card key={record.$id} className="bg-white border-red-200">
                                                    <CardContent className="p-3">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Badge className="bg-red-600 text-white text-xs">
                                                                        {record.academicYear}
                                                                    </Badge>
                                                                    <Badge variant="outline" className="text-xs">
                                                                        Term {record.term}
                                                                    </Badge>
                                                                </div>
                                                                <div className="text-sm space-y-1">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">Amount:</span>
                                                                        <span className="font-bold text-red-900">
                                                                            KES {record.amount.toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between text-xs text-gray-500">
                                                                        <span>Recorded:</span>
                                                                        <span>{formatDate(record.enteredAt)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <AlertTriangle className="h-5 w-5 text-red-600 ml-2 flex-shrink-0" />
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}

                                        <Separator className="my-2" />

                                        <div className="bg-red-100 rounded-lg p-3">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm font-semibold text-red-900">
                                                        Total Previous Years Arrears
                                                    </p>
                                                    <p className="text-xs text-red-700">
                                                        Before {currentAcademicYear}
                                                    </p>
                                                </div>
                                                <p className="text-2xl font-bold text-red-700">
                                                    KES {previousYearsTotal.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Current Year Arrears History */}
                    {currentYearHistory.length > 0 && (
                        <Card className="border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50">
                            <CardHeader className="bg-amber-100 py-3">
                                <h4 className="text-base font-semibold flex items-center gap-2 text-amber-900">
                                    <History className="h-5 w-5 text-amber-700" />
                                    {currentAcademicYear} Arrears History
                                </h4>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="space-y-2">
                                    {currentYearHistory
                                        .sort((a, b) =>
                                            new Date(b.enteredAt).getTime() - new Date(a.enteredAt).getTime()
                                        )
                                        .map((record) => (
                                            <div
                                                key={record.$id}
                                                className="flex items-center justify-between bg-white p-2 rounded border border-amber-200"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-xs">
                                                        Term {record.term}
                                                    </Badge>
                                                    <span className="text-xs text-gray-500">
                                                        {formatDate(record.enteredAt)}
                                                    </span>
                                                </div>
                                                <span className="font-semibold text-amber-900">
                                                    KES {record.amount.toLocaleString()}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Current Academic Year Fee Status */}
                    <Card>
                        <CardHeader className="bg-green-50 py-3">
                            <h4 className="text-base font-semibold flex items-center gap-2 text-green-900">
                                <DollarSign className="h-5 w-5 text-green-600" />
                                Current Academic Year ({currentAcademicYear}) - Fee Status
                            </h4>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            {renderCurrentTermCard(
                                1,
                                (student as any).term1Paid,
                                (student as any).term1Amount,
                                (student as any).term1Balance,
                                student.term1Arrears
                            )}
                            {renderCurrentTermCard(
                                2,
                                (student as any).term2Paid,
                                (student as any).term2Amount,
                                (student as any).term2Balance,
                                student.term2Arrears
                            )}
                            {renderCurrentTermCard(
                                3,
                                (student as any).term3Paid,
                                (student as any).term3Amount,
                                (student as any).term3Balance,
                                student.term3Arrears
                            )}

                            {/* Annual Summary */}
                            <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-2 mt-4">
                                <CardContent className="p-4">
                                    <h5 className="text-sm font-semibold text-center mb-3 text-gray-700">
                                        {currentAcademicYear} Annual Summary
                                    </h5>
                                    <div className="grid grid-cols-3 gap-3 text-center">
                                        <div>
                                            <p className="text-xs text-gray-600">Total Fees</p>
                                            <p className="text-base font-bold text-gray-900">
                                                {student.totalFees.toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600">Paid</p>
                                            <p className="text-base font-bold text-green-600">
                                                {student.paidFees.toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600">Balance</p>
                                            <p className="text-base font-bold text-red-600">
                                                {student.feeBalance.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {currentYearArrears > 0 && (
                                        <>
                                            <Separator className="my-3" />
                                            <div className="bg-amber-100 -mx-4 px-4 py-2 rounded">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-amber-700 font-medium">
                                                        Current Year Arrears:
                                                    </span>
                                                    <span className="text-lg font-bold text-amber-900">
                                                        KES {currentYearArrears.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {hasOutstandingArrears && (
                                        <>
                                            <Separator className="my-3" />
                                            <div className="bg-red-100 -mx-4 -mb-4 px-4 py-3 rounded-b-lg">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="text-xs text-red-700 font-medium">
                                                            TOTAL AMOUNT OWED
                                                        </p>
                                                        <p className="text-[10px] text-red-600">
                                                            (Current Balance + All Arrears)
                                                        </p>
                                                    </div>
                                                    <p className="text-xl font-bold text-red-700">
                                                        KES {totalOwed.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
}