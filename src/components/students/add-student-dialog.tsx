'use client';

import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { studentService } from '@/lib/appwrite/student.service';
import { authService } from '@/lib/appwrite/auth.service';
import { toast } from 'sonner';
import { Student, StudentType, getFeeStructure } from '@/types';
import { Info } from 'lucide-react';

interface AddStudentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAdd: (student: any) => void;
    student?: Student | null;
    isUpdate?: boolean;
}

const KENYA_CLASSES = [
    'Daycare',
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

export function AddStudentDialog({ open, onOpenChange, onAdd, student, isUpdate }: AddStudentDialogProps) {
    const currentYear = new Date().getFullYear();

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
        studentType: 'new' as StudentType,
        enrollmentYear: currentYear,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const submittingRef = useRef(false);

    // Calculate fees based on grade and student type
    const calculatedFees = formData.grade
        ? getFeeStructure(formData.grade, formData.studentType)
        : null;

    // Populate form when updating
    React.useEffect(() => {
        if (isUpdate && student && open) {
            const guardians = typeof student.guardians === 'string'
                ? JSON.parse(student.guardians)
                : student.guardians;

            setFormData({
                firstName: student.firstName || '',
                lastName: student.lastName || '',
                grade: student.grade || '',
                admissionNumber: student.admissionNumber || '',
                dateOfBirth: student.dateOfBirth || '',
                guardianName: guardians?.[0]?.name || '',
                guardianPhone: guardians?.[0]?.phone || '',
                guardianEmail: guardians?.[0]?.email || '',
                relationship: guardians?.[0]?.relationship || '',
                studentType: student.studentType || 'old',
                enrollmentYear: student.enrollmentYear || currentYear,
            });
        } else if (!open) {
            // Reset form when dialog closes
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
                studentType: 'new',
                enrollmentYear: currentYear,
            });
        }
    }, [isUpdate, student, open, currentYear]);

    const handleSubmit = async () => {
        console.log('handleSubmit invoked');
        if (submittingRef.current) {
            console.log('Blocked duplicate submission');
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

            // Get user profile for school name
            const profile = await authService.getUserProfile(user.$id);
            if (!profile?.schoolName) {
                toast.error('Profile Error', {
                    description: 'Your account is missing school information',
                });
                submittingRef.current = false;
                setIsLoading(false);
                return;
            }

            console.log('Creating student for user:', user.$id, 'with admissionNumber:', formData.admissionNumber);

            // Check for existing admission number (skip if updating the same student)
            const existingStudents = await studentService.getStudentsBySchool(profile.schoolName);
            const studentId = student?.$id || student?.id;
            if (existingStudents.some((s: any) =>
                s.admissionNumber === formData.admissionNumber &&
                (!isUpdate || (s.$id !== studentId && s.id !== studentId))
            )) {
                toast.error('Validation Error', {
                    description: 'A student with this admission number already exists',
                });
                submittingRef.current = false;
                setIsLoading(false);
                return;
            }

            // Get fee structure
            const feeStructure = getFeeStructure(formData.grade, formData.studentType);
            const totalFees = feeStructure.totalAnnual;

            const loadingToast = toast.loading(isUpdate ? 'Updating student...' : 'Adding student...', {
                description: isUpdate
                    ? 'Please wait while we update the student record'
                    : 'Please wait while we create the student record',
            });

            let result;
            if (isUpdate && studentId) {
                result = await studentService.updateStudent(studentId, {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    grade: formData.grade,
                    admissionNumber: formData.admissionNumber,
                    dateOfBirth: formData.dateOfBirth,
                    totalFees: totalFees,
                    studentType: formData.studentType,
                    enrollmentYear: formData.enrollmentYear,
                    feeStructure: JSON.stringify(feeStructure),
                    guardians: JSON.stringify([{
                        name: formData.guardianName,
                        phone: formData.guardianPhone,
                        email: formData.guardianEmail,
                        relationship: formData.relationship,
                    }]),
                });
            } else {
                result = await studentService.createStudent(user.$id, {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    grade: formData.grade,
                    admissionNumber: formData.admissionNumber,
                    dateOfBirth: formData.dateOfBirth,
                    totalFees: totalFees,
                    studentType: formData.studentType,
                    enrollmentYear: formData.enrollmentYear,
                    guardianName: formData.guardianName,
                    guardianPhone: formData.guardianPhone,
                    guardianEmail: formData.guardianEmail,
                    relationship: formData.relationship,
                    schoolName: profile.schoolName,
                });
            }

            console.log(isUpdate ? 'Student updated:' : 'Student created:', result.$id);

            toast.dismiss(loadingToast);
            toast.success(isUpdate ? 'Student Updated Successfully! ✏️' : 'Student Added Successfully! 🎓', {
                description: (
                    <div className="mt-2 space-y-1">
                        <p className="font-semibold">{formData.firstName} {formData.lastName}</p>
                        <p>Class: {formData.grade}</p>
                        <p>Type: {formData.studentType === 'new' ? '2026 Enrollment' : 'Returning Student'}</p>
                        <p>Annual Fees: KES {totalFees.toLocaleString()}</p>
                    </div>
                ),
                duration: 5000,
            });

            if (typeof onAdd === 'function') onAdd(result);

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
                studentType: 'new',
                enrollmentYear: currentYear,
            });

            onOpenChange(false);
        } catch (err: any) {
            console.error('Failed to add student:', err);
            toast.error(isUpdate ? 'Failed to Update Student' : 'Failed to Add Student', {
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
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isUpdate ? 'Update Student' : 'Add New Student'}</DialogTitle>
                </DialogHeader>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {/* Student Type Selection */}
                <div className="space-y-3 border-b pb-4">
                    <Label className="text-base font-semibold">Student Type *</Label>
                    <RadioGroup
                        value={formData.studentType}
                        onValueChange={(value: StudentType) => setFormData({ ...formData, studentType: value })}
                        disabled={isLoading}
                        className="grid grid-cols-1 md:grid-cols-2 gap-3"
                    >
                        <label className="flex items-start space-x-3 border-2 rounded-lg p-4 cursor-pointer hover:bg-blue-50 transition-colors has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
                            <RadioGroupItem value="new" id="new" className="mt-1" />
                            <div className="flex-1">
                                <div className="font-semibold text-blue-900">New Student (2026 Enrollment)</div>
                                <p className="text-sm text-gray-600 mt-1">
                                    First-time enrollment. Includes one-time admission fees.
                                </p>
                            </div>
                        </label>

                        <label className="flex items-start space-x-3 border-2 rounded-lg p-4 cursor-pointer hover:bg-green-50 transition-colors has-[:checked]:border-green-600 has-[:checked]:bg-green-50">
                            <RadioGroupItem value="old" id="old" className="mt-1" />
                            <div className="flex-1">
                                <div className="font-semibold text-green-900">Returning Student</div>
                                <p className="text-sm text-gray-600 mt-1">
                                    Existing student. No admission fees required.
                                </p>
                            </div>
                        </label>
                    </RadioGroup>
                </div>

                {/* Fee Structure Preview */}
                {calculatedFees && (
                    <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-2">
                                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-blue-900 mb-2">
                                        {formData.studentType === 'new' ? '2026 Fee Structure' : 'Returning Student Fee Structure'}
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                        <div>
                                            <p className="text-gray-600">Term 1</p>
                                            <p className="font-bold text-blue-900">KES {calculatedFees.term1.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Term 2</p>
                                            <p className="font-bold text-blue-900">KES {calculatedFees.term2.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Term 3</p>
                                            <p className="font-bold text-blue-900">KES {calculatedFees.term3.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Annual Total</p>
                                            <p className="font-bold text-green-700">KES {calculatedFees.totalAnnual.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    {calculatedFees.oneTimeFees && formData.studentType === 'new' && (
                                        <p className="text-xs text-blue-700 mt-2">
                                            * Term 1 includes KES {calculatedFees.oneTimeFees.total.toLocaleString()} one-time fees
                                            (Admission: {calculatedFees.oneTimeFees.admissionFee}, Form: {calculatedFees.oneTimeFees.admissionForm},
                                            Badge: {calculatedFees.oneTimeFees.schoolBadge}, Diary: {calculatedFees.oneTimeFees.schoolDiary})
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
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
                        <Label>Enrollment Year</Label>
                        <Input
                            type="number"
                            value={formData.enrollmentYear}
                            onChange={(e) => setFormData({ ...formData, enrollmentYear: parseInt(e.target.value) })}
                            disabled={isLoading}
                            min={2020}
                            max={2030}
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
                    <Button onClick={handleSubmit} disabled={isLoading || !formData.grade}>
                        {isLoading ? (isUpdate ? 'Updating...' : 'Adding...') : (isUpdate ? 'Update Student' : 'Add Student')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}