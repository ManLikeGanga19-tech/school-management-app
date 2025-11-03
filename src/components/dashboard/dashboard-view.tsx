"use client";

import React, { useEffect, useState } from "react";
import {
    Users,
    DollarSign,
    Bell,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    UserCircle,
    School,
    PiggyBank,
    Building2,
} from "lucide-react";
import { StatsCard } from "./stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Student, FeePayment, calculateTotalArrears } from "@/types";
import { studentService } from "@/lib/appwrite/student.service";
import { authService } from "@/lib/appwrite/auth.service";
import { paymentService } from "@/lib/appwrite/payment.service";

interface DashboardViewProps {
    students: Student[];
    payments: FeePayment[];
    currentUser?: {
        name: string;
        schoolName: string;
        role: string;
    } | null;
}

export function DashboardView({
    students: propsStudents,
    payments: propsPayments,
    currentUser,
}: DashboardViewProps) {
    const [students, setStudents] = useState<Student[]>(propsStudents);
    const [payments, setPayments] = useState<FeePayment[]>(propsPayments);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        setError("");

        try {
            const user = await authService.getCurrentUser();
            if (!user) {
                setError("Please login to view dashboard");
                setIsLoading(false);
                return;
            }

            const profile = await authService.getUserProfile(user.$id);
            if (!profile?.schoolName) {
                setError("School information missing in your profile");
                setIsLoading(false);
                return;
            }

            console.log("Fetching dashboard data for:", profile.schoolName);

            const [studentsData, paymentsData] = await Promise.all([
                studentService.getStudentsBySchool(profile.schoolName),
                paymentService.getPaymentsBySchool(profile.schoolName),
            ]);

            const mappedStudents = studentsData.map((student) => ({
                ...student,
                id: student.$id || student.$id,
                guardians:
                    typeof student.guardians === "string"
                        ? JSON.parse(student.guardians)
                        : student.guardians,
            }));

            const mappedPayments = paymentsData.map((payment) => ({
                ...payment,
                id: payment.$id || payment.$id,
            }));

            setStudents(mappedStudents);
            setPayments(mappedPayments);
        } catch (error: any) {
            console.error("Failed to fetch dashboard data:", error);
            setError(error.message || "Failed to load dashboard data");
            setStudents(propsStudents);
            setPayments(propsPayments);
        } finally {
            setIsLoading(false);
        }
    };

    const totalStudents = students.length;
    const totalOutstanding = students.reduce((sum, s) => sum + s.feeBalance, 0);
    const totalCollected = students.reduce((sum, s) => sum + s.paidFees, 0);
    const studentsWithBalance = students.filter((s) => s.feeBalance > 0).length;
    const totalExpected = students.reduce((sum, s) => sum + s.totalFees, 0);
    const collectionRate =
        totalExpected > 0 ? ((totalCollected / totalExpected) * 100).toFixed(1) : 0;

    // 🆕 Calculate arrears metrics
    const totalArrears = students.reduce((sum, s) => sum + calculateTotalArrears(s), 0);
    const studentsWithArrears = students.filter((s) => calculateTotalArrears(s) > 0).length;
    const totalOwedIncludingArrears = totalOutstanding + totalArrears;

    const studentsByLevel = students.reduce((acc, student) => {
        let level = "Other";
        if (student.grade.includes("PP")) level = "Early Years";
        else if (["Grade 1", "Grade 2", "Grade 3"].some((g) => student.grade.includes(g)))
            level = "Lower Primary";
        else if (["Grade 4", "Grade 5", "Grade 6"].some((g) => student.grade.includes(g)))
            level = "Upper Primary";
        else if (["Grade 7", "Grade 8", "Grade 9"].some((g) => student.grade.includes(g)))
            level = "Junior Secondary";

        acc[level] = (acc[level] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const recentPayments = payments.filter((p) => {
        const paymentDate = new Date(p.date);
        return paymentDate >= sevenDaysAgo;
    });

    const recentPaymentsTotal = recentPayments.reduce((sum, p) => sum + p.amount, 0);

    // 🆕 Updated top debtors to include arrears
    const topDebtors = [...students]
        .filter((s) => s.feeBalance > 0 || calculateTotalArrears(s) > 0)
        .sort((a, b) => {
            const totalOwedA = a.feeBalance + calculateTotalArrears(a);
            const totalOwedB = b.feeBalance + calculateTotalArrears(b);
            return totalOwedB - totalOwedA;
        })
        .slice(0, 5);

    const fullyPaid = students.filter((s) => s.feeBalance === 0 && calculateTotalArrears(s) === 0).length;
    const partiallyPaid = students.filter(
        (s) => s.paidFees > 0 && (s.feeBalance > 0 || calculateTotalArrears(s) > 0)
    ).length;
    const notPaid = students.filter((s) => s.paidFees === 0).length;

    const formatRole = (role: string) =>
        role.charAt(0).toUpperCase() + role.slice(1);

    if (isLoading) {
        return (
            <div className="w-full max-w-full overflow-x-hidden px-2 sm:px-4">
                <Card className="shadow-md border-blue-100">
                    <CardContent className="p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 font-medium">Loading dashboard...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full max-w-full overflow-x-hidden px-2 sm:px-4">
            {/* 🔹 User Info Banner */}
            {currentUser && (
                <Card className="mb-4 sm:mb-6 bg-gradient-to-r from-green-50 via-blue-50 to-blue-100 border-blue-200 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-600 flex items-center justify-center shadow-inner">
                            <UserCircle className="text-white" size={28} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-lg sm:text-xl font-bold text-blue-900 truncate flex items-center gap-2">
                                <School className="text-blue-700" size={16} />
                                {currentUser.name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-blue-800">
                                <span className="font-semibold flex items-center gap-1">
                                    <Building2 size={14} /> {currentUser.schoolName}
                                </span>
                                <span className="hidden sm:inline">•</span>
                                <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-medium shadow-sm">
                                    {formatRole(currentUser.role)}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {error && (
                <Card className="mb-4 sm:mb-6 bg-red-50 border-red-200">
                    <CardContent className="p-4">
                        <p className="text-red-600 font-medium">{error}</p>
                    </CardContent>
                </Card>
            )}

            {/* 🔹 Dashboard Header */}
            <div className="mb-4 sm:mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
                    <TrendingUp className="text-blue-600" /> Dashboard Overview
                </h2>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                    Real-time insights into your school's operations
                </p>
            </div>

            {/* 🔹 Top Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
                <StatsCard
                    title="Total Students"
                    value={totalStudents}
                    icon={Users}
                    iconColor="text-blue-600"
                />

                {currentUser?.role !== "secretary" && (
                    <>
                        <StatsCard
                            title="Fees Collected"
                            value={`KES ${totalCollected.toLocaleString()}`}
                            icon={PiggyBank}
                            iconColor="text-green-600"
                            valueColor="text-green-700"
                        />
                        <StatsCard
                            title="Collection Rate"
                            value={`${collectionRate}%`}
                            icon={TrendingUp}
                            iconColor="text-purple-500"
                            valueColor="text-purple-700"
                        />
                    </>
                )}

                <StatsCard
                    title="Outstanding Fees"
                    value={`KES ${totalOutstanding.toLocaleString()}`}
                    icon={DollarSign}
                    iconColor="text-red-500"
                    valueColor="text-red-700"
                />
            </div>

            {/* 🆕 Arrears Alert Card (if arrears exist) */}
            {totalArrears > 0 && (
                <Card className="mb-6 sm:mb-8 border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 shadow-md">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-6 w-6 text-amber-600 mt-1 flex-shrink-0" />
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-amber-900 mb-2">
                                    Outstanding Arrears Detected
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="bg-white p-3 rounded-lg border border-amber-200">
                                        <p className="text-xs text-amber-700 mb-1">Total Arrears</p>
                                        <p className="text-xl font-bold text-amber-900">
                                            KES {totalArrears.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-amber-200">
                                        <p className="text-xs text-amber-700 mb-1">Students Affected</p>
                                        <p className="text-xl font-bold text-amber-900">
                                            {studentsWithArrears}
                                        </p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-amber-200">
                                        <p className="text-xs text-amber-700 mb-1">Total Owed</p>
                                        <p className="text-xl font-bold text-red-700">
                                            KES {totalOwedIncludingArrears.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 🔹 Secondary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <Card className="shadow-sm hover:shadow-md transition-shadow border-green-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <TrendingUp className="text-green-600" size={16} /> Last 7 Days
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-gray-800">
                            KES {recentPaymentsTotal.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            {recentPayments.length} transactions processed
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm hover:shadow-md transition-shadow border-blue-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <DollarSign className="text-blue-600" size={16} /> Expected Total
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-gray-800">
                            KES {totalExpected.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            Total fees for all enrolled students
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm hover:shadow-md transition-shadow border-orange-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <Bell className="text-orange-500" size={16} /> Pending Fees
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-orange-600">{studentsWithBalance}</p>
                        <p className="text-sm text-gray-500 mt-1">Students with unpaid balances</p>
                    </CardContent>
                </Card>
            </div>

            {/* 🔹 Students by Level + Payment Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card className="shadow-sm border-blue-100">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <School className="text-blue-600" /> Students by Level
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {Object.keys(studentsByLevel).length > 0 ? (
                            <div className="space-y-3">
                                {Object.entries(studentsByLevel).map(([level, count]) => (
                                    <div key={level} className="flex items-center justify-between">
                                        <span className="text-gray-700 font-medium">{level}</span>
                                        <span className="text-xl font-bold text-blue-700">
                                            {count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-4">
                                No students enrolled yet
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-green-100">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <DollarSign className="text-green-600" /> Payment Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="text-green-600" /> Fully Paid
                                </div>
                                <span className="font-bold text-green-700 text-xl">
                                    {fullyPaid}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="text-yellow-600" /> Partially Paid
                                </div>
                                <span className="font-bold text-yellow-700 text-xl">
                                    {partiallyPaid}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="text-red-600" /> Not Paid
                                </div>
                                <span className="font-bold text-red-700 text-xl">{notPaid}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 🔹 Top Debtors (Updated with Arrears) */}
            {topDebtors.length > 0 && (
                <Card className="shadow-sm border-red-100">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-red-600">
                            <AlertTriangle className="text-red-600" /> Highest Outstanding Fees
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {topDebtors.map((student, index) => {
                                const guardians =
                                    typeof student.guardians === "string"
                                        ? JSON.parse(student.guardians)
                                        : student.guardians;
                                const studentArrears = calculateTotalArrears(student);
                                const totalOwed = student.feeBalance + studentArrears;

                                return (
                                    <div
                                        key={student.id}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-red-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                                <span className="text-red-600 font-semibold text-sm">
                                                    {index + 1}
                                                </span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-800 truncate">
                                                    {student.firstName} {student.lastName}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {student.grade} • {guardians[0]?.phone || "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-red-600 text-sm sm:text-lg">
                                                KES {totalOwed.toLocaleString()}
                                            </p>
                                            {studentArrears > 0 && (
                                                <p className="text-xs text-amber-600 font-medium">
                                                    Arrears: KES {studentArrears.toLocaleString()}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500">
                                                {(
                                                    (totalOwed / student.totalFees) *
                                                    100
                                                ).toFixed(0)}
                                                % remaining
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