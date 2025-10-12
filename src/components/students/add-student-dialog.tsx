'use client';

import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { studentService } from '@/lib/appwrite/student.service';
import { authService } from '@/lib/appwrite/auth.service';
import { toast } from 'sonner';

interface AddStudentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAdd: (student: any) => void;
}

const KENYA_CLASSES = [
    'PP1 (Pre-Primary 1)',
    'PP2 (Pre-Primary 2)',
    'Grade 1',
    'Grade 2',
    'Grade 3',
    'Grade 4',
    'Grade 5',
    'Grade 6',
    'Grade 7',
    'Grade 8',
    'Grade 9',
];

const RELATIONSHIPS = [
    'Mother',
    'Father',
    'Guardian',
    'Aunt',
    'Uncle',
    'Grandmother',
    'Grandfather',
    'Other',
];

export function AddStudentDialog({ open, onOpenChange, onAdd }: AddStudentDialogProps) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        grade: '',
        admissionNumber: '',
        dateOfBirth: '',
        guardianName: '',
        guardianPhone: '',
        guardianEmail: '',
        relationship: '',
        totalFees: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const submittingRef = useRef(false);

    const handleSubmit = async () => {
        console.log('handleSubmit invoked'); // ← Debug log to check invocation count
        if (submittingRef.current) {
            console.log('Blocked duplicate submission'); // ← Debug log for blocked attempts
            return;
        }
        submittingRef.current = true;

        setError('');
        setIsLoading(true);

        
        // Validation
        if (
            !formData.firstName ||
            !formData.lastName ||
            !formData.grade ||
            !formData.admissionNumber ||
            !formData.dateOfBirth ||
            !formData.totalFees ||
            !formData.guardianName ||
            !formData.guardianPhone ||
            !formData.guardianEmail ||
            !formData.relationship
        ) {
            toast.error('Validation Error', {
                description: 'Please fill in all required fields',
            });
            submittingRef.current = false;
            setIsLoading(false);
            return;
        }

        try {
            const user = await authService.getCurrentUser();
            if (!user) {
                toast.error('Authentication Error', {
                    description: 'You must be logged in to add students',
                });
                submittingRef.current = false;
                setIsLoading(false);
                return;
            }

            console.log('Creating student for user:', user.$id, 'with admissionNumber:', formData.admissionNumber);

            // Check for existing admission number
            const existingStudents = await studentService.getStudents(user.$id);
            if (existingStudents.some((student: any) => student.admissionNumber === formData.admissionNumber)) {
                toast.error('Validation Error', {
                    description: 'A student with this admission number already exists',
                });
                submittingRef.current = false;
                setIsLoading(false);
                return;
            }

            const loadingToast = toast.loading('Adding student...', {
                description: 'Please wait while we create the student record',
            });

            const student = await studentService.createStudent(user.$id, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                grade: formData.grade,
                admissionNumber: formData.admissionNumber,
                dateOfBirth: formData.dateOfBirth,
                totalFees: parseFloat(formData.totalFees),
                guardianName: formData.guardianName,
                guardianPhone: formData.guardianPhone,
                guardianEmail: formData.guardianEmail,
                relationship: formData.relationship,
            });

            console.log('Student created:', student.$id); // ← Log the created student ID

            toast.dismiss(loadingToast);
            toast.success('Student Added Successfully! 🎓', {
                description: (
                    <div className="mt-2 space-y-1">
                        <p className="font-semibold">{formData.firstName} {formData.lastName}</p>
                        <p>Class: {formData.grade}</p>
                        <p>Admission No: {formData.admissionNumber}</p>
                        <p className="text-xs text-gray-500 mt-2">Guardian: {formData.guardianName}</p>
                    </div>
                ),
                duration: 5000,
            });

            if (typeof onAdd === 'function') onAdd(student);

            setFormData({
                firstName: '',
                lastName: '',
                grade: '',
                admissionNumber: '',
                dateOfBirth: '',
                guardianName: '',
                guardianPhone: '',
                guardianEmail: '',
                relationship: '',
                totalFees: '',
            });

            onOpenChange(false);
        } catch (err: any) {
            console.error('Failed to add student:', err);
            toast.error('Failed to Add Student', {
                description: err.message || 'An error occurred while adding the student',
            });
            setError(err.message || 'Failed to add student');
        } finally {
            submittingRef.current = false;
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Student</DialogTitle>
                </DialogHeader>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>First Name *</Label>
                        <Input
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            disabled={isLoading}
                            placeholder="John"
                        />
                    </div>
                    <div>
                        <Label>Last Name *</Label>
                        <Input
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            disabled={isLoading}
                            placeholder="Doe"
                        />
                    </div>
                    <div>
                        <Label>Grade/Class *</Label>
                        <Select
                            value={formData.grade}
                            onValueChange={(value) => setFormData({ ...formData, grade: value })}
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                            <SelectContent>
                                {KENYA_CLASSES.map((className) => (
                                    <SelectItem key={className} value={className}>
                                        {className}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Admission Number *</Label>
                        <Input
                            value={formData.admissionNumber}
                            onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                            placeholder="e.g. STU001"
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <Label>Date of Birth *</Label>
                        <Input
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <Label>Total Fees (KES) *</Label>
                        <Input
                            type="number"
                            value={formData.totalFees}
                            onChange={(e) => setFormData({ ...formData, totalFees: e.target.value })}
                            placeholder="e.g. 50000"
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <div className="mt-4">
                    <h4 className="font-semibold mb-2">Guardian Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Guardian Name *</Label>
                            <Input
                                value={formData.guardianName}
                                onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                                disabled={isLoading}
                                placeholder="Jane Doe"
                            />
                        </div>
                        <div>
                            <Label>Relationship *</Label>
                            <Select
                                value={formData.relationship}
                                onValueChange={(value) => setFormData({ ...formData, relationship: value })}
                                disabled={isLoading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select relationship" />
                                </SelectTrigger>
                                <SelectContent>
                                    {RELATIONSHIPS.map((rel) => (
                                        <SelectItem key={rel} value={rel}>
                                            {rel}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Phone Number *</Label>
                            <Input
                                type="tel"
                                value={formData.guardianPhone}
                                onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                                placeholder="+254712345678"
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <Label>Email *</Label>
                            <Input
                                type="email"
                                value={formData.guardianEmail}
                                onChange={(e) => setFormData({ ...formData, guardianEmail: e.target.value })}
                                placeholder="guardian@example.com"
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? 'Adding Student...' : 'Add Student'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}