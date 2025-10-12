import React, { useEffect, useState } from 'react';
import { Users, DollarSign, Bell, TrendingUp, AlertCircle, CheckCircle, User } from 'lucide-react';
import { StatsCard } from './stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Student, FeePayment } from '@/types';
import { studentService } from '@/lib/appwrite/student.service';
import { authService } from '@/lib/appwrite/auth.service';
import { paymentService } from '@/lib/appwrite/payment.service';
interface DashboardViewProps {
    students: Student[];
    payments: FeePayment[];
    currentUser?: {
        name: string;
        schoolName: string;
        role: string;
    } | null;
}

export function DashboardView({ students: propsStudents, payments: propsPayments, currentUser }: DashboardViewProps) {
    const [students, setStudents] = useState<Student[]>(propsStudents);
    const [payments, setPayments] = useState<FeePayment[]>(propsPayments);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        setError('');
        try {
            const user = await authService.getCurrentUser();
            if (!user) {
                setError('Please login to view dashboard');
                setIsLoading(false);
                return;
            }

            console.log('Fetching dashboard data for user:', user.$id);

            // Fetch students and payments from Appwrite
            const [studentsData, paymentsData] = await Promise.all([
                studentService.getStudents(user.$id),
                paymentService.getPayments(user.$id)
            ]);

            console.log('Students fetched for dashboard:', studentsData);
            console.log('Payments fetched for dashboard:', paymentsData);

            // Map $id to id for consistency
            const mappedStudents = studentsData.map(student => ({
                ...student,
                id: student.$id || student.$id,
            }));

            const mappedPayments = paymentsData.map(payment => ({
                ...payment,
                id: payment.$id || payment.$id,
            }));

            setStudents(mappedStudents);
            setPayments(mappedPayments);

        } catch (error: any) {
            console.error('Failed to fetch dashboard data:', error);
            setError(error.message || 'Failed to load dashboard data');
            setStudents(propsStudents);
            setPayments(propsPayments);
        } finally {
            setIsLoading(false);
        }
    };
    

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

    // Helper function to format role
    const formatRole = (role: string) => {
        return role.charAt(0).toUpperCase() + role.slice(1);
    };

    if (isLoading) {
        return (
            <div className="w-full max-w-full overflow-x-hidden px-2 sm:px-4">
                <Card>
                    <CardContent className="p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading dashboard...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full max-w-full overflow-x-hidden px-2 sm:px-4">
            {/* User Info Banner */}
            {currentUser && (
                <Card className="mb-4 sm:mb-6 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                <User className="text-white" size={20} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-base sm:text-lg font-bold text-blue-900 truncate">
                                    {currentUser.name}
                                </h3>
                                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-blue-700">
                                    <span className="font-medium">{currentUser.schoolName}</span>
                                    <span className="hidden sm:inline">•</span>
                                    <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-medium">
                                        {formatRole(currentUser.role)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Error Message */}
            {error && (
                <Card className="mb-4 sm:mb-6 bg-red-50 border-red-200">
                    <CardContent className="p-4">
                        <p className="text-red-600">{error}</p>
                    </CardContent>
                </Card>
            )}

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
                        {Object.keys(studentsByLevel).length > 0 ? (
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
                        ) : (
                            <p className="text-center text-gray-500 py-4">No students enrolled yet</p>
                        )}
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
                            {topDebtors.map((student, index) => {
                                const guardians = typeof student.guardians === 'string'
                                    ? JSON.parse(student.guardians)
                                    : student.guardians;

                                return (
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
                                                    {student.grade} • {guardians[0]?.phone || 'N/A'}
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
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}