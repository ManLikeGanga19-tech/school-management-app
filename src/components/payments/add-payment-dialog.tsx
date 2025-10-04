import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Student } from '@/types';

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
        mpesaCode: '',              // Changed from kcbMpesaCode to mpesaCode
        amount: '',
        date: currentDate.toISOString().split('T')[0],
        time: currentDate.toTimeString().slice(0, 5),
        paymentMethod: 'Kcb M-Pesa',  // Changed from 'M-Pesa' to match dummy data
        receiptNumber: ''             // will be auto-generated
    });

    const selectedStudent = students.find(s => s.id === formData.studentId);

    // Auto-populate fields when student is selected
    const handleStudentChange = (studentId: string) => {
        const student = students.find(s => s.id === studentId);
        if (student && student.guardians.length > 0) {
            setFormData({
                ...formData,
                studentId: studentId,
                studentName: `${student.firstName} ${student.lastName}`,
                studentClass: student.grade,
                parentName: student.guardians[0].name,
                parentPhone: student.guardians[0].phone,
            });
        }
    };

    const handleSubmit = () => {
        // Validation
        if (!formData.studentId) {
            alert('Please select a student');
            return;
        }
        if (!formData.mpesaCode.trim()) {
            alert('Please enter KCB M-Pesa code');
            return;
        }
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }
        if (!formData.date) {
            alert('Please select a date');
            return;
        }
        if (!formData.time) {
            alert('Please select a time');
            return;
        }

        // Submit the form data
        onAdd(formData);

        // Close dialog
        onOpenChange(false);

        // Reset form
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
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4">
                    {/* Student Selection */}
                    <div className="col-span-2">
                        <Label>Select Student *</Label>
                        <Select
                            value={formData.studentId}
                            onValueChange={handleStudentChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Student" />
                            </SelectTrigger>
                            <SelectContent>
                                {students.map(student => (
                                    <SelectItem key={student.id} value={student.id}>
                                        {student.firstName} {student.lastName} - {student.grade} - Balance: KES {student.feeBalance.toLocaleString()}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Auto-populated Student & Parent Info (Read-only display) */}
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
                            </div>
                        </div>
                    )}

                    {/* KCB M-Pesa Code */}
                    <div className="col-span-2">
                        <Label>KCB M-Pesa Code *</Label>
                        <Input
                            placeholder="e.g., QGH7XYZ123"
                            value={formData.mpesaCode}
                            onChange={(e) => setFormData({ ...formData, mpesaCode: e.target.value.toUpperCase() })}
                            className="font-mono text-lg"
                            maxLength={20}
                        />
                        <p className="text-xs text-gray-500 mt-1">Enter the KCB M-Pesa transaction code</p>
                    </div>

                    {/* Amount */}
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
                        />
                    </div>

                    {/* Date */}
                    <div>
                        <Label>Date *</Label>
                        <Input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    {/* Time */}
                    <div>
                        <Label>Time *</Label>
                        <Input
                            type="time"
                            value={formData.time}
                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        />
                    </div>

                    {/* Receipt Number Info */}
                    <div className="col-span-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                            <span className="font-semibold">📝 Receipt Number:</span> Will be auto-generated after recording payment
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        Record Payment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}