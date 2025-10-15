'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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

export function AddPaymentDialog({ open, onOpenChange, students, onAdd }: AddPaymentDialogProps) {
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
        receiptNumber: ''
    });

    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // ✅ Remove duplicates by unique student ID
    const uniqueStudents = Array.from(
        new Map(students.map(s => [(s.$id || s.id), s])).values()
    );

    const filteredStudents = uniqueStudents.filter(s =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase())
    );

    const selectedStudent = uniqueStudents.find(s => (s.$id || s.id) === formData.studentId);

    const handleStudentSelect = (student: Student) => {
        const guardians = typeof student.guardians === 'string'
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
            setSearch(`${student.firstName} ${student.lastName}`);
        }
    };

    // ✅ SMS sender function (sandbox-safe)
    const sendSmsNotification = async (phone: string, message: string) => {
        try {
            const res = await fetch('/api/sms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    numbers: [phone],
                    message,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                console.error('SMS error:', data);
                toast.error('SMS Failed', { description: data.error || 'Could not send SMS' });
            } else {
                toast.success('SMS Sent', { description: 'Notification sent to guardian successfully' });
            }
        } catch (err: any) {
            console.error('Error sending SMS:', err);
            toast.error('SMS Error', { description: err.message });
        }
    };

    const handleSubmit = async () => {
        setError('');

        if (!formData.studentId) {
            toast.error('Validation Error', { description: 'Please select a student' });
            return;
        }
        if (!formData.mpesaCode.trim()) {
            toast.error('Validation Error', { description: 'Please enter KCB M-Pesa code' });
            return;
        }
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            toast.error('Validation Error', { description: 'Please enter a valid amount' });
            return;
        }
        if (!formData.date) {
            toast.error('Validation Error', { description: 'Please select a date' });
            return;
        }
        if (!formData.time) {
            toast.error('Validation Error', { description: 'Please select a time' });
            return;
        }

        setIsLoading(true);

        try {
            const user = await authService.getCurrentUser();
            if (!user) {
                toast.error('Authentication Error', { description: 'You must be logged in to record payments' });
                setIsLoading(false);
                return;
            }

            console.log('Recording payment for user:', user.$id);

            const loadingToast = toast.loading('Recording payment...', {
                description: 'Please wait while we process your payment',
            });

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
            });

            console.log('Payment created:', payment);

            // ✅ Update student's fee balance
            const updatedStudent = await studentService.updateStudentFees(formData.studentId, parseFloat(formData.amount));

            toast.dismiss(loadingToast);

            toast.success('Payment Recorded Successfully! 🎉', {
                description: (
                    <div className="mt-2 space-y-1">
                        <p className="font-semibold">Receipt: {payment.receiptNumber}</p>
                        <p>Student: {formData.studentName}</p>
                        <p>Amount: KES {parseFloat(formData.amount).toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-2">M-Pesa Code: {formData.mpesaCode}</p>
                    </div>
                ),
                duration: 6000,
            });

            // ✅ Send SMS notification to guardian after successful payment
            const successMessage = `Dear ${formData.parentName}, your payment of KES ${formData.amount} for ${formData.studentName} (${formData.studentClass}) has been received successfully. Thank you!`;
            await sendSmsNotification(formData.parentPhone, successMessage);

            // ✅ If fee balance exceeds 10,000, send alert
            const newBalance = updatedStudent?.feeBalance ?? selectedStudent?.feeBalance ?? 0;
            if (newBalance > 10000) {
                const balanceMessage = `Dear ${formData.parentName}, the current fee balance for ${formData.studentName} is KES ${newBalance.toLocaleString()}. Please clear the balance soon.`;
                await sendSmsNotification(formData.parentPhone, balanceMessage);
            }

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
                receiptNumber: ''
            });
            setSearch('');

            onOpenChange(false);
        } catch (err: any) {
            console.error('Failed to record payment:', err);
            toast.error('Payment Failed', {
                description: err.message || 'Failed to record payment. Please try again.',
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
                                {filteredStudents.map(student => (
                                    <div
                                        key={student.$id || student.id}
                                        className="p-2 cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleStudentSelect(student)}
                                    >
                                        {student.firstName} {student.lastName} - {student.grade} - Balance: KES {student.feeBalance.toLocaleString()}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {selectedStudent && (
                        <div className="col-span-2 p-4 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-sm font-semibold text-green-900 mb-2">Payment Details:</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-green-700 font-medium">Student:</span>
                                    <span className="ml-2 text-green-900">{formData.studentName}</span>
                                </div>
                                <div>
                                    <span className="text-green-700 font-medium">Class:</span>
                                    <span className="ml-2 text-green-900">{formData.studentClass}</span>
                                </div>
                                <div>
                                    <span className="text-green-700 font-medium">Parent:</span>
                                    <span className="ml-2 text-green-900">{formData.parentName}</span>
                                </div>
                                <div>
                                    <span className="text-green-700 font-medium">Phone:</span>
                                    <span className="ml-2 text-green-900">{formData.parentPhone}</span>
                                </div>
                                <div>
                                    <span className="text-green-700 font-medium">Current Balance:</span>
                                    <span className="ml-2 text-green-900 font-semibold">
                                        KES {selectedStudent.feeBalance.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="col-span-2">
                        <Label>KCB M-Pesa Code *</Label>
                        <Input
                            placeholder="e.g., QGH7XYZ123"
                            value={formData.mpesaCode}
                            onChange={(e) => setFormData({ ...formData, mpesaCode: e.target.value.toUpperCase() })}
                            className="font-mono text-lg"
                            maxLength={20}
                            disabled={isLoading}
                        />
                        <p className="text-xs text-gray-500 mt-1">Enter the KCB M-Pesa transaction code</p>
                    </div>

                    <div className="col-span-2">
                        <Label>Amount (KES) *</Label>
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            min="0"
                            step="0.01"
                            className="text-lg"
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <Label>Date *</Label>
                        <Input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            max={new Date().toISOString().split('T')[0]}
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <Label>Time *</Label>
                        <Input
                            type="time"
                            value={formData.time}
                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="col-span-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                            <span className="font-semibold">📝 Receipt Number:</span> Will be auto-generated after recording payment
                        </p>
                    </div>
                </div>

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
