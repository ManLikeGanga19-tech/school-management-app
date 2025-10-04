import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { SendSMSDialog } from './send-sms-dialog';
import { Student } from '@/types';

interface SMSViewProps {
    students: Student[];
    onSendSMS: (selectedIds: string[], message: string) => void;
}

export function SMSView({ students, onSendSMS }: SMSViewProps) {
    const [showSendDialog, setShowSendDialog] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

    const studentsWithBalance = students.filter(s => s.feeBalance > 0);

    const toggleStudent = (studentId: string) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSend = (message: string) => {
        onSendSMS(selectedStudents, message);
        setSelectedStudents([]);
    };

    return (
        <div className="p-2 sm:p-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center sm:text-left">
                    SMS Notifications
                </h2>
                <Button
                    onClick={() => setShowSendDialog(true)}
                    className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
                >
                    <Send size={20} className="mr-2" />
                    Send SMS
                </Button>
            </div>

            {/* Student List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">Students with Outstanding Fees</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {studentsWithBalance.map(student => (
                            <div
                                key={student.id}
                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg"
                            >
                                {/* Left: Name & Phone */}
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <Checkbox
                                        checked={selectedStudents.includes(student.id)}
                                        onCheckedChange={() => toggleStudent(student.id)}
                                    />
                                    <div>
                                        <p className="font-semibold text-sm sm:text-base">
                                            {student.firstName} {student.lastName}
                                        </p>
                                        <p className="text-xs sm:text-sm text-gray-600">
                                            {student.guardians[0]?.phone}
                                        </p>
                                    </div>
                                </div>

                                {/* Right: Balance Info */}
                                <div className="text-left sm:text-right">
                                    <p className="font-semibold text-red-600 text-sm sm:text-base">
                                        KES {student.feeBalance.toLocaleString()}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-600">Outstanding</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* SMS Dialog */}
            <SendSMSDialog
                open={showSendDialog}
                onOpenChange={setShowSendDialog}
                selectedCount={selectedStudents.length}
                totalWithBalance={studentsWithBalance.length}
                onSend={handleSend}
            />
        </div>
    );
}
