import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Student } from '@/types';

interface StudentCardProps {
    student: Student;
}

export function StudentCard({ student }: StudentCardProps) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800">
                            {student.firstName} {student.lastName}
                        </h3>
                        <p className="text-gray-600">{student.grade} • {student.admissionNumber}</p>
                        <p className="text-sm text-gray-500 mt-1">DOB: {student.dateOfBirth}</p>

                        <div className="mt-4">
                            <p className="font-semibold text-gray-700">Guardian Information:</p>
                            {student.guardians.map(guardian => (
                                <div key={guardian.id} className="mt-2 text-sm">
                                    <p className="text-gray-700">{guardian.name} ({guardian.relationship})</p>
                                    <p className="text-gray-600">{guardian.phone} • {guardian.email}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="mb-4">
                            <p className="text-sm text-gray-600">Fee Balance</p>
                            <p className={`text-2xl font-bold ${student.feeBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                KES {student.feeBalance.toLocaleString()}
                            </p>
                        </div>
                        <div className="text-sm text-gray-600">
                            <p>Total: KES {student.totalFees.toLocaleString()}</p>
                            <p>Paid: KES {student.paidFees.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
