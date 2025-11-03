'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Student } from '@/types';
import { paymentService } from '@/lib/appwrite/payment.service';
import { studentService } from '@/lib/appwrite/student.service';
import { authService } from '@/lib/appwrite/auth.service';
import { toast } from 'sonner';

interface AddPaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    students: Student[];
    onAdd: (payment: any) => void;
}

export function AddPaymentDialog({
    open,
    onOpenChange,
    students,
    onAdd,
}: AddPaymentDialogProps) {
    const currentDate = new Date();

    const [formData, setFormData] = useState({
        studentId: '',
        studentName: '',
        studentClass: '',
        parentName: '',
        parentPhone: '',
        mpesaCode: '',
        amount: '',
        date: currentDate.toISOString().split('T')[0],
        time: currentDate.toTimeString().slice(0, 5),
        paymentMethod: 'Kcb M-Pesa',
        receiptNumber: '',
        termNumber: '' as '' | '1' | '2' | '3',
    });

    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // ✅ Remove duplicates by unique student ID
    const uniqueStudents = Array.from(
        new Map(students.map((s) => [(s.$id || s.id), s])).values()
    );

    const filteredStudents = uniqueStudents.filter((s) =>
        `${s.firstName} ${s.lastName}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    const selectedStudent = uniqueStudents.find(
        (s) => (s.$id || s.id) === formData.studentId
    );

    // 🆕 Calculate payment allocation preview
    const calculateAllocation = (amount: number, student: Student | undefined) => {
        if (!student || amount <= 0) return null;

        const allocation = {
            term1: 0,
            term2: 0,
            term3: 0,
            current: 0,
            remaining: amount,
        };

        // Pay Term 1 arrears first
        if (student.term1Arrears && student.term1Arrears > 0) {
            const payment = Math.min(allocation.remaining, student.term1Arrears);
            allocation.term1 = payment;
            allocation.remaining -= payment;
        }

        // Pay Term 2 arrears
        if (allocation.remaining > 0 && student.term2Arrears && student.term2Arrears > 0) {
            const payment = Math.min(allocation.remaining, student.term2Arrears);
            allocation.term2 = payment;
            allocation.remaining -= payment;
        }

        // Pay Term 3 arrears
        if (allocation.remaining > 0 && student.term3Arrears && student.term3Arrears > 0) {
            const payment = Math.min(allocation.remaining, student.term3Arrears);
            allocation.term3 = payment;
            allocation.remaining -= payment;
        }

        // Rest goes to current term
        if (allocation.remaining > 0) {
            allocation.current = allocation.remaining;
            allocation.remaining = 0;
        }

        return allocation;
    };

    const paymentAmount = parseFloat(formData.amount) || 0;
    const allocation = calculateAllocation(paymentAmount, selectedStudent);

    const handleStudentSelect = (student: Student) => {
        const guardians =
            typeof student.guardians === 'string'
                ? JSON.parse(student.guardians)
                : student.guardians;

        if (guardians.length > 0) {
            setFormData({
                ...formData,
                studentId: student.$id || student.id,
                studentName: `${student.firstName} ${student.lastName}`,
                studentClass: student.grade,
                parentName: guardians[0].name,
                parentPhone: guardians[0].phone,
            });
            setSearch('');
        }
    };

    // ✅ SMS sender
    const sendSmsNotification = async (phone: string, message: string) => {
        try {
            const res = await fetch('/api/sms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ numbers: [phone], message }),
            });

            const data = await res.json();
            if (!res.ok) {
                console.error('SMS error:', data);
                toast.error('SMS Failed', {
                    description: data.error || 'Could not send SMS',
                });
            } else {
                toast.success('SMS Sent', {
                    description: 'Notification sent to guardian successfully',
                });
            }
        } catch (err: any) {
            console.error('Error sending SMS:', err);
            toast.error('SMS Error', { description: err.message });
        }
    };

    const handleSubmit = async () => {
        setError('');

        if (!formData.studentId) {
            toast.error('Validation Error', {
                description: 'Please select a student',
            });
            return;
        }

        if (!formData.termNumber) {
            toast.error('Validation Error', {
                description: 'Please select the term for this payment',
            });
            return;
        }

        if (!formData.mpesaCode.trim()) {
            toast.error('Validation Error', {
                description: 'Please enter KCB M-Pesa code',
            });
            return;
        }

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            toast.error('Validation Error', {
                description: 'Please enter a valid amount',
            });
            return;
        }

        setIsLoading(true);

        try {
            const user = await authService.getCurrentUser();
            if (!user) {
                toast.error('Authentication Error', {
                    description: 'You must be logged in to record payments',
                });
                setIsLoading(false);
                return;
            }

            const profile = await authService.getUserProfile(user.$id);
            if (!profile?.schoolName) {
                toast.error('Missing School Information', {
                    description: 'Your account is missing school details.',
                });
                setIsLoading(false);
                return;
            }

            const loadingToast = toast.loading('Recording payment...', {
                description: 'Please wait while we process your payment',
            });

            const termNumber = parseInt(formData.termNumber) as 1 | 2 | 3;

            // ✅ Create payment
            const payment = await paymentService.createPayment(user.$id, {
                studentId: formData.studentId,
                studentName: formData.studentName,
                studentClass: formData.studentClass,
                parentName: formData.parentName,
                parentPhone: formData.parentPhone,
                mpesaCode: formData.mpesaCode,
                amount: parseFloat(formData.amount),
                date: formData.date,
                time: formData.time,
                paymentMethod: formData.paymentMethod,
                termNumber,
                schoolName: profile.schoolName,
            });

            // 🆕 Update with arrears allocation
            await studentService.updateTermFeesWithArrears(
                formData.studentId,
                termNumber,
                parseFloat(formData.amount)
            );

            toast.dismiss(loadingToast);

            const allocationText = allocation ?
                (allocation.term1 > 0 ? `\n• Term 1 Arrears: KES ${allocation.term1.toLocaleString()}` : '') +
                (allocation.term2 > 0 ? `\n• Term 2 Arrears: KES ${allocation.term2.toLocaleString()}` : '') +
                (allocation.term3 > 0 ? `\n• Term 3 Arrears: KES ${allocation.term3.toLocaleString()}` : '') +
                (allocation.current > 0 ? `\n• Current Term: KES ${allocation.current.toLocaleString()}` : '')
                : '';

            toast.success('Payment Recorded Successfully! 🎉', {
                description: (
                    <div className="mt-2 space-y-1">
                        <p className="font-semibold">Receipt: {payment.receiptNumber}</p>
                        <p>Student: {formData.studentName}</p>
                        <p>Amount: KES {parseFloat(formData.amount).toLocaleString()}</p>
                        <p>Term: {termNumber}</p>
                        {allocation && (
                            <div className="mt-2 text-xs">
                                <p className="font-semibold">Payment Allocated:</p>
                                {allocation.term1 > 0 && <p>• Term 1 Arrears: KES {allocation.term1.toLocaleString()}</p>}
                                {allocation.term2 > 0 && <p>• Term 2 Arrears: KES {allocation.term2.toLocaleString()}</p>}
                                {allocation.term3 > 0 && <p>• Term 3 Arrears: KES {allocation.term3.toLocaleString()}</p>}
                                {allocation.current > 0 && <p>• Current Term: KES {allocation.current.toLocaleString()}</p>}
                            </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                            M-Pesa Code: {formData.mpesaCode}
                        </p>
                    </div>
                ),
                duration: 8000,
            });

            const successMessage = `Dear ${formData.parentName}, your payment of KES ${formData.amount} for ${formData.studentName} (${formData.studentClass}) has been received successfully.${allocationText} Thank you!`;
            await sendSmsNotification(formData.parentPhone, successMessage);

            onAdd(payment);

            const newDate = new Date();
            setFormData({
                studentId: '',
                studentName: '',
                studentClass: '',
                parentName: '',
                parentPhone: '',
                mpesaCode: '',
                amount: '',
                date: newDate.toISOString().split('T')[0],
                time: newDate.toTimeString().slice(0, 5),
                paymentMethod: 'Kcb M-Pesa',
                receiptNumber: '',
                termNumber: '',
            });
            setSearch('');
            onOpenChange(false);
        } catch (err: any) {
            console.error('Failed to record payment:', err);
            toast.error('Payment Failed', {
                description:
                    err.message || 'Failed to record payment. Please try again.',
            });
            setError(err.message || 'Failed to record payment');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                </DialogHeader>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    {/* Search Student */}
                    <div className="col-span-2 relative">
                        <Label>Search Student *</Label>
                        <Input
                            placeholder="Type student name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoComplete="off"
                            disabled={isLoading}
                        />
                        {search && filteredStudents.length > 0 && (
                            <div className="absolute z-10 bg-white border rounded w-full max-h-60 overflow-y-auto mt-1 shadow-lg">
                                {filteredStudents.map((student) => (
                                    <div
                                        key={student.$id || student.id}
                                        className="p-2 cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleStudentSelect(student)}
                                    >
                                        {student.firstName} {student.lastName} - {student.grade} -
                                        Balance: KES {student.feeBalance.toLocaleString()}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Student Info with Arrears Breakdown */}
                    {selectedStudent && (
                        <div className="col-span-2 space-y-3">
                            {/* Basic Info */}
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-sm font-semibold text-green-900 mb-2">
                                    Student Details:
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-green-700 font-medium">Student:</span>
                                        <span className="ml-2 text-green-900">
                                            {formData.studentName}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-green-700 font-medium">Class:</span>
                                        <span className="ml-2 text-green-900">
                                            {formData.studentClass}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-green-700 font-medium">Parent:</span>
                                        <span className="ml-2 text-green-900">
                                            {formData.parentName}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-green-700 font-medium">Phone:</span>
                                        <span className="ml-2 text-green-900">
                                            {formData.parentPhone}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Arrears Breakdown */}
                            {((selectedStudent.term1Arrears && selectedStudent.term1Arrears > 0) ||
                                (selectedStudent.term2Arrears && selectedStudent.term2Arrears > 0) ||
                                (selectedStudent.term3Arrears && selectedStudent.term3Arrears > 0)) && (
                                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                                        <p className="text-sm font-semibold text-amber-900 mb-2">
                                            ⚠️ Outstanding Arrears:
                                        </p>
                                        <div className="space-y-1 text-sm">
                                            {selectedStudent.term1Arrears && selectedStudent.term1Arrears > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-amber-700">Term 1 Arrears:</span>
                                                    <span className="font-semibold text-amber-900">
                                                        KES {selectedStudent.term1Arrears.toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                            {selectedStudent.term2Arrears && selectedStudent.term2Arrears > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-amber-700">Term 2 Arrears:</span>
                                                    <span className="font-semibold text-amber-900">
                                                        KES {selectedStudent.term2Arrears.toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                            {selectedStudent.term3Arrears && selectedStudent.term3Arrears > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-amber-700">Term 3 Arrears:</span>
                                                    <span className="font-semibold text-amber-900">
                                                        KES {selectedStudent.term3Arrears.toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex justify-between pt-2 border-t border-amber-300">
                                                <span className="text-amber-700 font-medium">Total Arrears:</span>
                                                <span className="font-bold text-amber-900">
                                                    KES {((selectedStudent.term1Arrears || 0) +
                                                        (selectedStudent.term2Arrears || 0) +
                                                        (selectedStudent.term3Arrears || 0)).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            {/* Term Fee Balances - Shows only unpaid terms */}
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm font-semibold text-blue-900 mb-2">
                                    📊 Term Fee Balances:
                                </p>
                                <div className="space-y-1 text-sm">
                                    {(selectedStudent.term1Balance && selectedStudent.term1Balance > 0) && (
                                        <div className="flex justify-between">
                                            <span className="text-blue-700">Term 1 Balance:</span>
                                            <span className="font-semibold text-blue-900">
                                                KES {selectedStudent.term1Balance.toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                    {(selectedStudent.term2Balance && selectedStudent.term2Balance > 0) && (
                                        <div className="flex justify-between">
                                            <span className="text-blue-700">Term 2 Balance:</span>
                                            <span className="font-semibold text-blue-900">
                                                KES {selectedStudent.term2Balance.toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                    {(selectedStudent.term3Balance && selectedStudent.term3Balance > 0) && (
                                        <div className="flex justify-between">
                                            <span className="text-blue-700">Term 3 Balance:</span>
                                            <span className="font-semibold text-blue-900">
                                                KES {selectedStudent.term3Balance.toLocaleString()}
                                            </span>
                                        </div>
                                    )}

                                    {/* Show total only if there are unpaid terms */}
                                    {((selectedStudent.term1Balance && selectedStudent.term1Balance > 0) ||
                                        (selectedStudent.term2Balance && selectedStudent.term2Balance > 0) ||
                                        (selectedStudent.term3Balance && selectedStudent.term3Balance > 0)) && (
                                            <div className="flex justify-between pt-2 border-t border-blue-300">
                                                <span className="text-blue-700 font-medium">Total Balance:</span>
                                                <span className="font-bold text-blue-900">
                                                    KES {selectedStudent.feeBalance.toLocaleString()}
                                                </span>
                                            </div>
                                        )}

                                    {/* Show "All Fees Cleared" if no balance and no arrears */}
                                    {selectedStudent.feeBalance === 0 &&
                                        (!selectedStudent.term1Arrears || selectedStudent.term1Arrears === 0) &&
                                        (!selectedStudent.term2Arrears || selectedStudent.term2Arrears === 0) &&
                                        (!selectedStudent.term3Arrears || selectedStudent.term3Arrears === 0) && (
                                            <div className="text-center text-green-700 font-semibold py-2">
                                                ✅ All Fees Cleared
                                            </div>
                                        )}
                                </div>
                            </div>

                            {/* Payment Allocation Preview */}
                            {allocation && paymentAmount > 0 && (
                                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                                    <p className="text-sm font-semibold text-purple-900 mb-2">
                                        💰 Payment Allocation Preview:
                                    </p>
                                    <div className="space-y-1 text-sm">
                                        {allocation.term1 > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-purple-700">→ Term 1 Arrears:</span>
                                                <span className="font-semibold text-purple-900">
                                                    KES {allocation.term1.toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                        {allocation.term2 > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-purple-700">→ Term 2 Arrears:</span>
                                                <span className="font-semibold text-purple-900">
                                                    KES {allocation.term2.toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                        {allocation.term3 > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-purple-700">→ Term 3 Arrears:</span>
                                                <span className="font-semibold text-purple-900">
                                                    KES {allocation.term3.toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                        {allocation.current > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-purple-700">→ Current Term:</span>
                                                <span className="font-semibold text-purple-900">
                                                    KES {allocation.current.toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between pt-2 border-t border-purple-300">
                                            <span className="text-purple-700 font-medium">Total Payment:</span>
                                            <span className="font-bold text-purple-900">
                                                KES {paymentAmount.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Term Selection */}
                    <div className="col-span-2">
                        <Label>Term *</Label>
                        <select
                            value={formData.termNumber}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    termNumber: e.target.value as '' | '1' | '2' | '3',
                                })
                            }
                            className="w-full border rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            disabled={isLoading}
                        >
                            <option value="">Select Term</option>
                            <option value="1">Term 1</option>
                            <option value="2">Term 2</option>
                            <option value="3">Term 3</option>
                        </select>
                    </div>

                    {/* Mpesa Code */}
                    <div className="col-span-2">
                        <Label>KCB M-Pesa Code *</Label>
                        <Input
                            placeholder="e.g., QGH7XYZ123"
                            value={formData.mpesaCode}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    mpesaCode: e.target.value.toUpperCase(),
                                })
                            }
                            className="font-mono text-lg"
                            maxLength={20}
                            disabled={isLoading}
                        />
                    </div>

                    {/* Amount */}
                    <div className="col-span-2">
                        <Label>Amount (KES) *</Label>
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={(e) =>
                                setFormData({ ...formData, amount: e.target.value })
                            }
                            min="0"
                            step="0.01"
                            className="text-lg"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Date / Time */}
                    <div>
                        <Label>Date *</Label>
                        <Input
                            type="date"
                            value={formData.date}
                            onChange={(e) =>
                                setFormData({ ...formData, date: e.target.value })
                            }
                            max={new Date().toISOString().split('T')[0]}
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <Label>Time *</Label>
                        <Input
                            type="time"
                            value={formData.time}
                            onChange={(e) =>
                                setFormData({ ...formData, time: e.target.value })
                            }
                            disabled={isLoading}
                        />
                    </div>

                    {/* Info Box */}
                    <div className="col-span-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                            <span className="font-semibold">📝 Note:</span> Payment will automatically
                            clear arrears first (oldest to newest), then apply to current term balance.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Recording...' : 'Record Payment'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}