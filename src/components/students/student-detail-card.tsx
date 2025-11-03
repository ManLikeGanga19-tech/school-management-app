'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Student, Guardian, getArrearsBreakdown, calculateTotalOwed, hasArrears } from '@/types';
import { CheckCircle2, XCircle, Calendar, User, Phone, Mail, GraduationCap, Hash, Cake, DollarSign, AlertTriangle } from 'lucide-react';

interface StudentDetailCardProps {
    student: Student | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function StudentDetailCard({ student, open, onOpenChange }: StudentDetailCardProps) {
    if (!student) return null;

    const guardians = (typeof student.guardians === 'string'
        ? JSON.parse(student.guardians)
        : student.guardians) as Guardian[];

    const feeStructure = student.feeStructure ? JSON.parse(student.feeStructure) : null;

    // 🆕 Get arrears breakdown
    const arrearsBreakdown = getArrearsBreakdown(student);
    const hasOutstandingArrears = hasArrears(student);
    const totalOwed = calculateTotalOwed(student);

    const renderTermCard = (
        term: 1 | 2 | 3,
        termPaid: boolean | undefined,
        termAmount: number | undefined,
        termBalance: number | undefined,
        termArrears: number | undefined
    ) => {
        const amount = termAmount || feeStructure?.[`term${term}`] || 0;
        const balance = termBalance || amount;
        const isPaid = termPaid || false;
        const arrears = termArrears || 0;

        return (
            <Card
                key={term}
                className={`border-2 transition-shadow hover:shadow-md ${arrears > 0
                        ? 'border-red-400 bg-red-50/50'
                        : isPaid
                            ? 'border-green-400 bg-green-50/50'
                            : 'border-orange-400 bg-orange-50/50'
                    }`}
            >
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            {arrears > 0 ? (
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                            ) : isPaid ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                                <XCircle className="h-5 w-5 text-orange-600" />
                            )}
                            <span className="text-base font-semibold text-gray-900">Term {term}</span>
                        </div>
                        <Badge
                            variant={arrears > 0 ? 'destructive' : isPaid ? 'default' : 'destructive'}
                            className="text-xs"
                        >
                            {arrears > 0 ? 'ARREARS' : isPaid ? 'PAID' : 'UNPAID'}
                        </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                        {/* 🆕 Show Arrears if exists */}
                        {arrears > 0 && (
                            <>
                                <div className="flex justify-between bg-red-100 -mx-4 px-4 py-2">
                                    <span className="text-red-700 font-semibold">Arrears:</span>
                                    <span className="font-bold text-red-700">
                                        KES {arrears.toLocaleString()}
                                    </span>
                                </div>
                                <Separator />
                            </>
                        )}

                        <div className="flex justify-between">
                            <span className="text-gray-600">Total Fee:</span>
                            <span className="font-semibold">KES {amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Balance:</span>
                            <span
                                className={`font-semibold ${isPaid ? 'text-green-600' : 'text-red-600'
                                    }`}
                            >
                                KES {balance.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    <Separator className="my-2" />

                    <p
                        className={`text-center text-xs font-semibold ${arrears > 0
                                ? 'text-red-700'
                                : isPaid
                                    ? 'text-green-700'
                                    : 'text-orange-700'
                            }`}
                    >
                        {arrears > 0
                            ? `⚠️ Has Outstanding Arrears`
                            : isPaid
                                ? 'Fully Paid'
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
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                            <GraduationCap className="h-5 w-5 text-blue-600" />
                        </div>
                        Student Profile
                    </DialogTitle>
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
                                        <Badge className="bg-blue-600 text-xs">
                                            {student.grade}
                                        </Badge>
                                        {student.studentType && (
                                            <Badge
                                                variant={
                                                    student.studentType === 'new' ? 'default' : 'secondary'
                                                }
                                                className="text-xs"
                                            >
                                                {student.studentType === 'new'
                                                    ? '🆕 New'
                                                    : '🔄 Returning'}
                                            </Badge>
                                        )}
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
                                            <span>Enrolled {student.enrollmentYear}</span>
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
                            {guardians.map((g, i) => (
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

                    {/* 🆕 Arrears Alert (if exists) */}
                    {hasOutstandingArrears && (
                        <Card className="border-2 border-red-300 bg-red-50">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <h5 className="font-semibold text-red-900 mb-2">
                                            Outstanding Arrears Detected
                                        </h5>
                                        <div className="space-y-1 text-sm">
                                            {arrearsBreakdown.term1 > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-red-700">Term 1 Arrears:</span>
                                                    <span className="font-semibold text-red-900">
                                                        KES {arrearsBreakdown.term1.toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                            {arrearsBreakdown.term2 > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-red-700">Term 2 Arrears:</span>
                                                    <span className="font-semibold text-red-900">
                                                        KES {arrearsBreakdown.term2.toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                            {arrearsBreakdown.term3 > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-red-700">Term 3 Arrears:</span>
                                                    <span className="font-semibold text-red-900">
                                                        KES {arrearsBreakdown.term3.toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                            <Separator className="my-2" />
                                            <div className="flex justify-between pt-1">
                                                <span className="text-red-700 font-semibold">Total Arrears:</span>
                                                <span className="font-bold text-red-900">
                                                    KES {arrearsBreakdown.total.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Fee Payment Status */}
                    <Card>
                        <CardHeader className="bg-gray-50 py-3">
                            <h4 className="text-base font-semibold flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                Fee Payment Status
                            </h4>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            {renderTermCard(
                                1,
                                student.term1Paid,
                                student.term1Amount,
                                student.term1Balance,
                                student.term1Arrears
                            )}
                            {renderTermCard(
                                2,
                                student.term2Paid,
                                student.term2Amount,
                                student.term2Balance,
                                student.term2Arrears
                            )}
                            {renderTermCard(
                                3,
                                student.term3Paid,
                                student.term3Amount,
                                student.term3Balance,
                                student.term3Arrears
                            )}

                            {/* Annual Summary */}
                            <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-2 mt-4">
                                <CardContent className="p-4">
                                    <h5 className="text-sm font-semibold text-center mb-3 text-gray-700">
                                        Annual Summary
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

                                    {/* 🆕 Total Owed (Balance + Arrears) */}
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
                                                            (Balance + Arrears)
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