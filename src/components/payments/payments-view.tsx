'use client';

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AddPaymentDialog } from './add-payment-dialog';
import { Student, FeePayment } from '@/types';
import { paymentService } from '@/lib/appwrite/payment.service';
import { studentService } from '@/lib/appwrite/student.service';
import { authService } from '@/lib/appwrite/auth.service';
import { toast } from 'sonner';

interface PaymentsViewProps {
    students: Student[];
    payments: FeePayment[];
    onAddPayment: (payment: any) => void;
}

export function PaymentsView({ students: propsStudents, payments: propsPayments, onAddPayment }: PaymentsViewProps) {
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [students, setStudents] = useState<Student[]>(propsStudents);
    const [payments, setPayments] = useState<FeePayment[]>(propsPayments);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        setError('');
        try {
            const user = await authService.getCurrentUser();
            if (!user) {
                setError('Please login to view payments');
                toast.error('Authentication Error', { description: 'Please login to view payments.' });
                setIsLoading(false);
                return;
            }

            console.log('Fetching data for user:', user.$id);

            const [studentsData, paymentsData] = await Promise.all([
                studentService.getStudents(user.$id),
                paymentService.getPayments(user.$id),
            ]);

            console.log('Students fetched:', studentsData);
            console.log('Payments fetched:', paymentsData);

            const mappedStudents = studentsData.map(student => ({
                ...student,
                id: student.$id || student.$id,
            }));

            const mappedPayments = paymentsData.map(payment => ({
                ...payment,
                id: payment.$id || payment.$id,
            }));

            // ✅ Deduplicate students
            const uniqueStudents = Array.from(new Map(mappedStudents.map(s => [s.id, s])).values());

            setStudents(uniqueStudents);
            setPayments(mappedPayments);

            toast.success('Data Loaded', { description: 'Payments and students fetched successfully.' });
        } catch (error: any) {
            console.error('Failed to fetch data:', error);
            setError(error.message || 'Failed to load data');
            setStudents(propsStudents);
            setPayments(propsPayments);
            toast.error('Failed to Load Data', { description: error.message || 'An unexpected error occurred.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddPayment = async (payment: any) => {
        try {
            await fetchData();
            onAddPayment(payment);
            toast.success('Payment Recorded', {
                description: `Receipt #${payment.receiptNumber} successfully recorded.`,
            });
        } catch (error: any) {
            console.error('Error adding payment:', error);
            toast.error('Payment Error', { description: error.message || 'Failed to record payment.' });
        }
    };

    console.log('Payments to display:', payments);
    console.log('Students available for payment:', students);

    return (
        <div className="p-2 sm:p-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center sm:text-left">
                    Fee Payments
                </h2>
                <Button
                    onClick={() => setShowAddDialog(true)}
                    className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                >
                    <Plus size={20} className="mr-2" />
                    Record Payment
                </Button>
            </div>

            {/* Error Message */}
            {error && (
                <Card className="mb-6 bg-red-50 border-red-200">
                    <CardContent className="p-4">
                        <p className="text-red-600">{error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Stats Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-600">Total Payments</p>
                        <p className="text-2xl font-bold text-gray-800">{payments.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-600">Total Collected</p>
                        <p className="text-2xl font-bold text-green-600">
                            KES {payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-600">Active Students</p>
                        <p className="text-2xl font-bold text-blue-600">{students.length}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Loading State */}
            {isLoading ? (
                <Card>
                    <CardContent className="p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading payments...</p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        {payments.length === 0 ? (
                            <div className="p-6 sm:p-8 text-center text-gray-500">
                                <p className="text-base sm:text-lg">No payments recorded yet.</p>
                                <p className="text-xs sm:text-sm mt-2">
                                    Click "Record Payment" to add your first payment.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table className="min-w-[700px] sm:min-w-full text-sm sm:text-base">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Receipt No.</TableHead>
                                            <TableHead>KCB M-Pesa Code</TableHead>
                                            <TableHead>Student Name</TableHead>
                                            <TableHead>Class</TableHead>
                                            <TableHead>Parent Name</TableHead>
                                            <TableHead>Phone Number</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Time</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payments.map(payment => (
                                            <TableRow key={payment.$id || payment.id}>
                                                <TableCell className="font-mono text-xs sm:text-sm font-semibold text-blue-600">
                                                    {payment.receiptNumber}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs sm:text-sm font-semibold">
                                                    {payment.mpesaCode || '-'}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {payment.studentName || 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                                        {payment.studentClass || 'N/A'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {payment.parentName || 'N/A'}
                                                </TableCell>
                                                <TableCell>{payment.parentPhone || 'N/A'}</TableCell>
                                                <TableCell className="text-green-600 font-semibold">
                                                    KES {payment.amount.toLocaleString()}
                                                </TableCell>
                                                <TableCell>{payment.date}</TableCell>
                                                <TableCell>{payment.time}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <AddPaymentDialog
                open={showAddDialog}
                onOpenChange={setShowAddDialog}
                students={students}
                onAdd={handleAddPayment}
            />
        </div>
    );
}
