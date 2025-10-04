import React from 'react';
import { Users, DollarSign, Bell, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { StatsCard } from './stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Student, FeePayment } from '@/types';

interface DashboardViewProps {
    students: Student[];
    payments: FeePayment[];
}

export function DashboardView({ students, payments }: DashboardViewProps) {
    const totalStudents = students.length;
    const totalOutstanding = students.reduce((sum, s) => sum + s.feeBalance, 0);
    const totalCollected = students.reduce((sum, s) => sum + s.paidFees, 0);
    const studentsWithBalance = students.filter(s => s.feeBalance > 0).length;
    const totalExpected = students.reduce((sum, s) => sum + s.totalFees, 0);
    const collectionRate = totalExpected > 0 ? ((totalCollected / totalExpected) * 100).toFixed(1) : 0;

    const studentsByLevel = students.reduce((acc, student) => {
        let level = 'Other';
        if (student.grade.includes('PP')) level = 'Early Years';
        else if (student.grade.includes('Grade 1') || student.grade.includes('Grade 2') || student.grade.includes('Grade 3')) level = 'Lower Primary';
        else if (student.grade.includes('Grade 4') || student.grade.includes('Grade 5') || student.grade.includes('Grade 6')) level = 'Upper Primary';
        else if (student.grade.includes('Grade 7') || student.grade.includes('Grade 8') || student.grade.includes('Grade 9')) level = 'Junior Secondary';

        acc[level] = (acc[level] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const recentPayments = payments.filter(p => {
        const paymentDate = new Date(p.date);
        return paymentDate >= sevenDaysAgo;
    });

    const recentPaymentsTotal = recentPayments.reduce((sum, p) => sum + p.amount, 0);

    const topDebtors = [...students]
        .filter(s => s.feeBalance > 0)
        .sort((a, b) => b.feeBalance - a.feeBalance)
        .slice(0, 5);

    const fullyPaid = students.filter(s => s.feeBalance === 0).length;
    const partiallyPaid = students.filter(s => s.paidFees > 0 && s.feeBalance > 0).length;
    const notPaid = students.filter(s => s.paidFees === 0).length;

    return (
        <div className="w-full max-w-full overflow-x-hidden px-2 sm:px-4">
            {/* Header */}
            <div className="mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-3xl font-bold text-gray-800">Dashboard</h2>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                    Overview of your school management system
                </p>
            </div>

            {/* Main Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
                <StatsCard title="Total Students" value={totalStudents} icon={Users} iconColor="text-blue-500" />
                <StatsCard title="Fees Collected" value={`KES ${totalCollected.toLocaleString()}`} icon={DollarSign} iconColor="text-green-500" valueColor="text-green-600" />
                <StatsCard title="Outstanding Fees" value={`KES ${totalOutstanding.toLocaleString()}`} icon={DollarSign} iconColor="text-red-500" valueColor="text-red-600" />
                <StatsCard title="Collection Rate" value={`${collectionRate}%`} icon={TrendingUp} iconColor="text-purple-500" valueColor="text-purple-600" />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
                <Card>
                    <CardHeader className="pb-2 sm:pb-3">
                        <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Last 7 Days</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline justify-between">
                            <div>
                                <p className="text-lg sm:text-2xl font-bold text-gray-800 break-all">
                                    KES {recentPaymentsTotal.toLocaleString()}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                    {recentPayments.length} transactions
                                </p>
                            </div>
                            <TrendingUp className="text-green-500 flex-shrink-0 ml-2" size={18} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2 sm:pb-3">
                        <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Expected Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline justify-between">
                            <div>
                                <p className="text-lg sm:text-2xl font-bold text-gray-800 break-all">
                                    KES {totalExpected.toLocaleString()}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500 mt-1">Total fees for all students</p>
                            </div>
                            <DollarSign className="text-blue-500 flex-shrink-0 ml-2" size={18} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2 sm:pb-3">
                        <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Pending Fees</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline justify-between">
                            <div>
                                <p className="text-lg sm:text-2xl font-bold text-orange-600">{studentsWithBalance}</p>
                                <p className="text-xs sm:text-sm text-gray-500 mt-1">Students with balance</p>
                            </div>
                            <Bell className="text-orange-500 flex-shrink-0 ml-2" size={18} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Students by Level + Payment Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {/* Students by Level */}
                <Card>
                    <CardHeader className="pb-3 sm:pb-4">
                        <CardTitle className="text-sm sm:text-lg">Students by Level</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 sm:space-y-4">
                            {Object.entries(studentsByLevel).map(([level, count]) => (
                                <div key={level} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${level === 'Early Years' ? 'bg-pink-500' :
                                                level === 'Lower Primary' ? 'bg-blue-500' :
                                                    level === 'Upper Primary' ? 'bg-green-500' :
                                                        level === 'Junior Secondary' ? 'bg-purple-500' : 'bg-gray-500'
                                            }`}></div>
                                        <span className="font-medium text-gray-700 text-xs sm:text-base truncate">{level}</span>
                                    </div>
                                    <span className="text-lg sm:text-2xl font-bold text-gray-800 flex-shrink-0">{count}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Status */}
                <Card>
                    <CardHeader className="pb-3 sm:pb-4">
                        <CardTitle className="text-sm sm:text-lg">Payment Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 sm:space-y-4">
                            <div className="flex items-center justify-between p-3 sm:p-4 bg-green-50 rounded-lg">
                                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                    <CheckCircle className="text-green-600 flex-shrink-0" size={18} />
                                    <span className="font-medium text-gray-700 text-xs sm:text-base truncate">Fully Paid</span>
                                </div>
                                <span className="text-lg sm:text-2xl font-bold text-green-600">{fullyPaid}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 sm:p-4 bg-orange-50 rounded-lg">
                                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                    <AlertCircle className="text-orange-600 flex-shrink-0" size={18} />
                                    <span className="font-medium text-gray-700 text-xs sm:text-base truncate">Partially Paid</span>
                                </div>
                                <span className="text-lg sm:text-2xl font-bold text-orange-600">{partiallyPaid}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 sm:p-4 bg-red-50 rounded-lg">
                                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                    <AlertCircle className="text-red-600 flex-shrink-0" size={18} />
                                    <span className="font-medium text-gray-700 text-xs sm:text-base truncate">Not Paid</span>
                                </div>
                                <span className="text-lg sm:text-2xl font-bold text-red-600">{notPaid}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Debtors */}
            {topDebtors.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                            <AlertCircle className="text-red-500 flex-shrink-0" size={16} />
                            <span className="truncate">Action Required - Highest Outstanding Fees</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 sm:space-y-3">
                            {topDebtors.map((student, index) => (
                                <div key={student.id} className="flex items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors gap-3">
                                    <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                            <span className="text-red-600 font-bold text-xs sm:text-sm">{index + 1}</span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-gray-800 text-xs sm:text-base truncate">
                                                {student.firstName} {student.lastName}
                                            </p>
                                            <p className="text-xs sm:text-sm text-gray-500 truncate">
                                                {student.grade} • {student.guardians[0]?.phone}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-sm sm:text-lg font-bold text-red-600 whitespace-nowrap">
                                            KES {student.feeBalance.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-gray-500 whitespace-nowrap">
                                            {((student.feeBalance / student.totalFees) * 100).toFixed(0)}% remaining
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
