import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddStudentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAdd: (student: any) => void;
}

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
        totalFees: ''
    });

    const handleSubmit = () => {
        onAdd(formData);
        setFormData({
            firstName: '', lastName: '', grade: '', admissionNumber: '', dateOfBirth: '',
            guardianName: '', guardianPhone: '', guardianEmail: '', relationship: '', totalFees: ''
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Student</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>First Name</Label>
                        <Input
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label>Last Name</Label>
                        <Input
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label>Grade</Label>
                        <Input
                            value={formData.grade}
                            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label>Admission Number</Label>
                        <Input
                            value={formData.admissionNumber}
                            onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label>Date of Birth</Label>
                        <Input
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label>Total Fees</Label>
                        <Input
                            type="number"
                            value={formData.totalFees}
                            onChange={(e) => setFormData({ ...formData, totalFees: e.target.value })}
                        />
                    </div>
                </div>

                <div className="mt-4">
                    <h4 className="font-semibold mb-2">Guardian Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Guardian Name</Label>
                            <Input
                                value={formData.guardianName}
                                onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Relationship</Label>
                            <Input
                                value={formData.relationship}
                                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Phone Number</Label>
                            <Input
                                type="tel"
                                value={formData.guardianPhone}
                                onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={formData.guardianEmail}
                                onChange={(e) => setFormData({ ...formData, guardianEmail: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit}>Add Student</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}