import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AddPaymentDialog } from './add-payment-dialog';
import { Student, FeePayment } from '@/types';

interface PaymentsViewProps {
    students: Student[];
    payments: FeePayment[];
    onAddPayment: (payment: any) => void;
}

export function PaymentsView({ students, payments, onAddPayment }: PaymentsViewProps) {
    const [showAddDialog, setShowAddDialog] = useState(false);

    const displayPayments = payments;

    console.log('Payments to display:', displayPayments);

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

            {/* Card/Table */}
            <Card>
                <CardContent className="p-0">
                    {displayPayments.length === 0 ? (
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
                                        <TableHead>KCB M-Pesa Code</TableHead>
                                        <TableHead>Parent Name</TableHead>
                                        <TableHead>Phone Number</TableHead>
                                        <TableHead>Student Name</TableHead>
                                        <TableHead>Class</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Receipt No.</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {displayPayments.map(payment => {
                                        console.log('Rendering payment:', payment);

                                        return (
                                            <TableRow key={payment.id}>
                                                <TableCell className="font-mono text-xs sm:text-sm font-semibold">
                                                    {payment.mpesaCode || '-'}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {payment.parentName || 'N/A'}
                                                </TableCell>
                                                <TableCell>{payment.parentPhone || 'N/A'}</TableCell>
                                                <TableCell className="font-medium">
                                                    {payment.studentName || 'N/A'}
                                                </TableCell>
                                                <TableCell>{payment.studentClass || 'N/A'}</TableCell>
                                                <TableCell className="text-green-600 font-semibold">
                                                    KES {payment.amount.toLocaleString()}
                                                </TableCell>
                                                <TableCell>{payment.date}</TableCell>
                                                <TableCell>{payment.time}</TableCell>
                                                <TableCell className="font-mono text-xs sm:text-sm">
                                                    {payment.receiptNumber}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AddPaymentDialog
                open={showAddDialog}
                onOpenChange={setShowAddDialog}
                students={students}
                onAdd={onAddPayment}
            />
        </div>
    );
}
