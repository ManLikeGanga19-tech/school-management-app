import React, { useState } from 'react';
import { Plus, Search, Trash2, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddStudentDialog } from './add-student-dialog';
import { Student } from '@/types';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface StudentsViewProps {
    students: Student[];
    onAddStudent: (student: any) => void;
    onDeleteStudent?: (studentId: string) => void;
    onTransferStudent?: (studentId: string, newClass: string) => void;
}

// Kenya Curriculum - Competency Based Curriculum (CBC)
const KENYA_CURRICULUM = {
    'All Classes': [],
    'Early Years Education': [
        'PP1 (Pre-Primary 1)',
        'PP2 (Pre-Primary 2)'
    ],
    'Lower Primary': [
        'Grade 1',
        'Grade 2',
        'Grade 3'
    ],
    'Upper Primary': [
        'Grade 4',
        'Grade 5',
        'Grade 6'
    ],
    'Junior Secondary': [
        'Grade 7',
        'Grade 8',
        'Grade 9'
    ]
};

export function StudentsView({ students, onAddStudent, onDeleteStudent, onTransferStudent }: StudentsViewProps) {
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLevel, setSelectedLevel] = useState<string>('All Classes');
    const [selectedClass, setSelectedClass] = useState<string>('All Classes');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [transferDialogOpen, setTransferDialogOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [transferToClass, setTransferToClass] = useState<string>('');

    const availableClasses = selectedLevel === 'All Classes'
        ? Object.values(KENYA_CURRICULUM).flat()
        : KENYA_CURRICULUM[selectedLevel as keyof typeof KENYA_CURRICULUM] || [];

    const filteredStudents = students.filter(student => {
        const matchesSearch = `${student.firstName} ${student.lastName} ${student.admissionNumber}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase());

        const matchesClass = selectedClass === 'All Classes' || student.grade === selectedClass;

        return matchesSearch && matchesClass;
    });

    const handleDeleteClick = (student: Student) => {
        setSelectedStudent(student);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (selectedStudent && onDeleteStudent) {
            onDeleteStudent(selectedStudent.id);
            setDeleteDialogOpen(false);
            setSelectedStudent(null);
        }
    };

    const handleTransferClick = (student: Student) => {
        setSelectedStudent(student);
        setTransferToClass('');
        setTransferDialogOpen(true);
    };

    const handleTransferConfirm = () => {
        if (selectedStudent && transferToClass && onTransferStudent) {
            onTransferStudent(selectedStudent.id, transferToClass);
            setTransferDialogOpen(false);
            setSelectedStudent(null);
            setTransferToClass('');
        }
    };

    const allClasses = Object.values(KENYA_CURRICULUM).flat();

    return (
        <div className="p-2 sm:p-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center sm:text-left">
                    Students
                </h2>
                <Button
                    onClick={() => setShowAddDialog(true)}
                    className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                    <Plus size={20} className="mr-2" />
                    Add Student
                </Button>
            </div>

            {/* Filters Section */}
            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="flex items-center border rounded-lg px-3 py-2">
                            <Search size={20} className="text-gray-400 mr-2" />
                            <Input
                                placeholder="Search students..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border-0 focus-visible:ring-0 p-0"
                            />
                        </div>

                        {/* Level Filter */}
                        <div>
                            <Select
                                value={selectedLevel}
                                onValueChange={(value) => {
                                    setSelectedLevel(value);
                                    setSelectedClass('All Classes');
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Level" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All Classes">All Levels</SelectItem>
                                    <SelectItem value="Early Years Education">Early Years Education</SelectItem>
                                    <SelectItem value="Lower Primary">Lower Primary</SelectItem>
                                    <SelectItem value="Upper Primary">Upper Primary</SelectItem>
                                    <SelectItem value="Junior Secondary">Junior Secondary</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Class Filter */}
                        <div>
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Class" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All Classes">All Classes</SelectItem>
                                    {availableClasses.map((className) => (
                                        <SelectItem key={className} value={className}>
                                            {className}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-600">Total Students</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-800">{students.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-600">Filtered Results</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-600">{filteredStudents.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-600">Outstanding Fees</p>
                        <p className="text-xl sm:text-2xl font-bold text-red-600">
                            {filteredStudents.filter(s => s.feeBalance > 0).length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-600">Total Outstanding</p>
                        <p className="text-xl sm:text-2xl font-bold text-orange-600">
                            KES {filteredStudents.reduce((sum, s) => sum + s.feeBalance, 0).toLocaleString()}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Students Table */}
            <Card>
                <CardContent className="p-0">
                    {filteredStudents.length === 0 ? (
                        <div className="p-6 sm:p-8 text-center text-gray-500">
                            <p className="text-base sm:text-lg">No students found.</p>
                            <p className="text-xs sm:text-sm mt-2">Try adjusting your filters or add a new student.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table className="min-w-[700px] sm:min-w-full text-sm sm:text-base">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Admission No.</TableHead>
                                        <TableHead>Student Name</TableHead>
                                        <TableHead>Class</TableHead>
                                        <TableHead>Guardian</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Fee Balance</TableHead>
                                        <TableHead>Total Fees</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStudents.map(student => (
                                        <TableRow key={student.id}>
                                            <TableCell className="font-mono text-xs sm:text-sm font-semibold">
                                                {student.admissionNumber}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {student.firstName} {student.lastName}
                                            </TableCell>
                                            <TableCell>
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                                    {student.grade}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {student.guardians[0]?.name || 'N/A'}
                                                <br />
                                                <span className="text-xs text-gray-500">
                                                    {student.guardians[0]?.relationship || ''}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs sm:text-sm">
                                                {student.guardians[0]?.phone || 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`font-semibold ${student.feeBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                    KES {student.feeBalance.toLocaleString()}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                KES {student.totalFees.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex flex-col sm:flex-row justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleTransferClick(student)}
                                                        className="text-blue-600 hover:text-blue-700"
                                                    >
                                                        <ArrowRightLeft size={16} className="mr-1" />
                                                        Transfer
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDeleteClick(student)}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 size={16} className="mr-1" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Student Dialog */}
            <AddStudentDialog
                open={showAddDialog}
                onOpenChange={setShowAddDialog}
                onAdd={onAddStudent}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Student</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{selectedStudent?.firstName} {selectedStudent?.lastName}</strong>?
                            <br />
                            <br />
                            This action cannot be undone. All student records, payment history, and associated data will be permanently deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete Student
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Transfer Student Dialog */}
            <AlertDialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Transfer Student</AlertDialogTitle>
                        <AlertDialogDescription>
                            Transfer <strong>{selectedStudent?.firstName} {selectedStudent?.lastName}</strong> from <strong>{selectedStudent?.grade}</strong> to:
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <Select value={transferToClass} onValueChange={setTransferToClass}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select new class" />
                            </SelectTrigger>
                            <SelectContent>
                                {allClasses
                                    .filter(className => className !== selectedStudent?.grade)
                                    .map((className) => (
                                        <SelectItem key={className} value={className}>
                                            {className}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleTransferConfirm}
                            disabled={!transferToClass}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Transfer Student
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
