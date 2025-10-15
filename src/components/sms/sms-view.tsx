// ============================================
// FILE: components/sms/sms-view.tsx
// MOBILE-RESPONSIVE VERSION (CLEANER + NEATER)
// ============================================

'use client';

import React, { useState } from 'react';
import { Send, Users, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SendSMSDialog } from './send-sms-dialog';
import { Student } from '@/types';

interface SMSViewProps {
    students: Student[];
    onSendSMS: (selectedIds: string[], message: string, messageType?: 'fee' | 'general') => void;
}

export function SMSView({ students, onSendSMS }: SMSViewProps) {
    const [showSendDialog, setShowSendDialog] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [messageType, setMessageType] = useState<'fee' | 'general'>('fee');

    const studentsWithBalance = students.filter((s) => s.feeBalance > 0);
    const allStudents = students;

    const toggleStudent = (studentId: string) => {
        setSelectedStudents((prev) =>
            prev.includes(studentId)
                ? prev.filter((id) => id !== studentId)
                : [...prev, studentId]
        );
    };

    const selectAllWithBalance = () => {
        if (selectedStudents.length === studentsWithBalance.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(studentsWithBalance.map((s) => s.id));
        }
    };

    const selectAllStudents = () => {
        if (selectedStudents.length === allStudents.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(allStudents.map((s) => s.id));
        }
    };

    const handleSendFeeReminder = () => {
        setMessageType('fee');
        setShowSendDialog(true);
    };

    const handleSendGeneralMessage = () => {
        setMessageType('general');
        setShowSendDialog(true);
    };

    const handleSend = (message: string) => {
        onSendSMS(selectedStudents, message, messageType);
        setSelectedStudents([]);
    };

    return (
        <div className="w-full px-3 sm:px-6 py-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
                <div className="text-center sm:text-left w-full">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                        SMS Notifications
                    </h2>
                    <p className="text-gray-600 mt-1 text-sm sm:text-base">
                        Send bulk SMS to parents and guardians
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="fee-reminders" className="space-y-5">
                <TabsList
                    className="grid grid-cols-2 rounded-lg overflow-hidden text-[13px] sm:text-base"
                >
                    <TabsTrigger
                        value="fee-reminders"
                        className="flex flex-row items-center justify-center gap-2 py-2 sm:py-3 min-w-0 text-center whitespace-nowrap"
                    >
                        <AlertCircle className="flex-none" size={16} />
                        <span className="truncate">Fee Reminders</span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="general-messages"
                        className="flex flex-row items-center justify-center gap-2 py-2 sm:py-3 min-w-0 text-center whitespace-nowrap"
                    >
                        <Users className="flex-none" size={16} />
                        <span className="truncate">General Messages</span>
                    </TabsTrigger>
                </TabsList>



                {/* Fee Reminders Tab */}
                <TabsContent value="fee-reminders" className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-orange-50 p-4 rounded-lg border border-orange-200 shadow-sm">
                        <div className="text-center sm:text-left w-full sm:w-auto">
                            <p className="font-semibold text-orange-900">
                                {studentsWithBalance.length} students with outstanding fees
                            </p>
                            <p className="text-sm text-orange-700">
                                {selectedStudents.length > 0
                                    ? `${selectedStudents.length} selected`
                                    : 'Select students to send fee reminders'}
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={selectAllWithBalance}
                                className="w-full sm:w-auto"
                            >
                                {selectedStudents.length === studentsWithBalance.length
                                    ? 'Deselect All'
                                    : 'Select All'}
                            </Button>
                            <Button
                                onClick={handleSendFeeReminder}
                                className="bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto"
                                disabled={studentsWithBalance.length === 0}
                            >
                                <Send size={16} className="mr-2" />
                                Send Fee Reminder
                            </Button>
                        </div>
                    </div>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <AlertCircle className="text-orange-500" size={20} />
                                Students with Outstanding Fees
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {studentsWithBalance.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p className="text-lg">🎉 All students have cleared their fees!</p>
                                    <p className="text-sm mt-2">
                                        No fee reminders needed at this time.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {studentsWithBalance.map((student) => {
                                        const guardianPhone =
                                            student.guardians[0]?.phone || 'No phone';
                                        const guardianName =
                                            student.guardians[0]?.name || 'No guardian';

                                        return (
                                            <div
                                                key={student.id}
                                                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition"
                                            >
                                                <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1 min-w-0 mb-2 sm:mb-0">
                                                    <Checkbox
                                                        checked={selectedStudents.includes(student.id)}
                                                        onCheckedChange={() => toggleStudent(student.id)}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold truncate text-sm sm:text-base">
                                                            {student.firstName} {student.lastName}
                                                        </p>
                                                        <p className="text-xs sm:text-sm text-gray-600 truncate">
                                                            {student.grade} • {guardianName} • {guardianPhone}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0 sm:ml-4">
                                                    <p className="font-semibold text-red-600 text-sm sm:text-base">
                                                        KES {student.feeBalance.toLocaleString()}
                                                    </p>
                                                    <p className="text-xs text-gray-500">Outstanding</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* General Messages Tab */}
                <TabsContent value="general-messages" className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm">
                        <div className="text-center sm:text-left w-full sm:w-auto">
                            <p className="font-semibold text-blue-900">
                                {allStudents.length} total students
                            </p>
                            <p className="text-sm text-blue-700">
                                {selectedStudents.length > 0
                                    ? `${selectedStudents.length} selected`
                                    : 'Select students to send general announcements'}
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={selectAllStudents}
                                className="w-full sm:w-auto"
                            >
                                {selectedStudents.length === allStudents.length
                                    ? 'Deselect All'
                                    : 'Select All'}
                            </Button>
                            <Button
                                onClick={handleSendGeneralMessage}
                                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                            >
                                <Send size={16} className="mr-2" />
                                Send Announcement
                            </Button>
                        </div>
                    </div>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <Users className="text-blue-500" size={20} />
                                All Students & Parents
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {allStudents.map((student) => {
                                    const guardianPhone =
                                        student.guardians[0]?.phone || 'No phone';
                                    const guardianName =
                                        student.guardians[0]?.name || 'No guardian';
                                    const guardianEmail =
                                        student.guardians[0]?.email || 'No email';

                                    return (
                                        <div
                                            key={student.id}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition"
                                        >
                                            <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1 min-w-0 mb-2 sm:mb-0">
                                                <Checkbox
                                                    checked={selectedStudents.includes(student.id)}
                                                    onCheckedChange={() => toggleStudent(student.id)}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold truncate text-sm sm:text-base">
                                                        {student.firstName} {student.lastName}
                                                    </p>
                                                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                                                        {student.grade} • {guardianName}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {guardianPhone} • {guardianEmail}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0 sm:ml-4">
                                                {student.feeBalance > 0 ? (
                                                    <>
                                                        <p className="font-semibold text-red-600 text-xs sm:text-sm">
                                                            KES {student.feeBalance.toLocaleString()}
                                                        </p>
                                                        <p className="text-xs text-gray-500">Has balance</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="font-semibold text-green-600 text-xs sm:text-sm">
                                                            ✓ Paid
                                                        </p>
                                                        <p className="text-xs text-gray-500">No balance</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Dialog */}
            <SendSMSDialog
                open={showSendDialog}
                onOpenChange={setShowSendDialog}
                selectedCount={selectedStudents.length}
                totalWithBalance={
                    messageType === 'fee'
                        ? studentsWithBalance.length
                        : allStudents.length
                }
                messageType={messageType}
                onSend={handleSend}
            />
        </div>
    );
}
