"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, Trash2, ArrowRightLeft, MoreVertical, Edit } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddStudentDialog } from "./add-student-dialog";
import { StudentDetailCard } from "./student-detail-card";
import { Student, Guardian } from "@/types";
import { studentService } from "@/lib/appwrite/student.service";
import { authService } from "@/lib/appwrite/auth.service";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const KENYA_CURRICULUM = {
    "All Classes": [],
    "Early Years Education": ["Daycare", "PP1 (Pre-Primary 1)", "PP2 (Pre-Primary 2)"],
    "Lower Primary": ["Grade 1", "Grade 2", "Grade 3"],
    "Upper Primary": ["Grade 4", "Grade 5", "Grade 6"],
    "Junior Secondary": ["Grade 7", "Grade 8"],  //add grade 9 here as the class continues to the next grade
};

interface StudentsViewProps {
    students: Student[];
    onAddStudent: (student: any) => void;
    onDeleteStudent?: (studentId: string) => void;
    onTransferStudent?: (studentId: string, newClass: string) => void;
}

export function StudentsView({ students, onAddStudent, onDeleteStudent, onTransferStudent }: StudentsViewProps) {
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showUpdateDialog, setShowUpdateDialog] = useState(false);
    const [showDetailCard, setShowDetailCard] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedLevel, setSelectedLevel] = useState<string>("All Classes");
    const [selectedClass, setSelectedClass] = useState<string>("All Classes");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [transferDialogOpen, setTransferDialogOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [transferType, setTransferType] = useState<string>("class");
    const [transferToClass, setTransferToClass] = useState<string>("");
    const [transferReason, setTransferReason] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [apiStudents, setApiStudents] = useState<Student[]>([]);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const studentsPerPage = 15;

    const fetchStudents = useCallback(async () => {
        setIsLoading(true);
        setError("");
        try {
            const user = await authService.getCurrentUser();
            if (!user) {
                setError("Please login to view students");
                setIsLoading(false);
                return;
            }

            const profile = await authService.getUserProfile(user.$id);
            if (!profile?.schoolName) {
                setError("Your account is missing school information.");
                setIsLoading(false);
                return;
            }

            const studentsData = await studentService.getStudentsBySchool(profile.schoolName);
            const mappedStudents: Student[] = studentsData.map((student) => ({
                ...student,
                id: student.$id,
                guardians:
                    typeof student.guardians === "string"
                        ? JSON.parse(student.guardians)
                        : (student.guardians as Guardian[]) || [],
            }));

            setApiStudents(mappedStudents);
        } catch (error: any) {
            console.error("Failed to fetch students:", error);
            setError(error.message || "Failed to load students");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    // Debounce search input (for smoother typing)
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const availableClasses =
        selectedLevel === "All Classes"
            ? Object.values(KENYA_CURRICULUM).flat()
            : KENYA_CURRICULUM[selectedLevel as keyof typeof KENYA_CURRICULUM] || [];

    const studentsToDisplay = apiStudents.length > 0 ? apiStudents : students;

    // ✅ Filtering logic
    const filteredStudents = studentsToDisplay.filter((student) => {
        const matchesSearch = `${student.firstName} ${student.lastName} ${student.admissionNumber}`
            .toLowerCase()
            .includes(debouncedSearch.toLowerCase());
        const matchesClass = selectedClass === "All Classes" || student.grade === selectedClass;
        return matchesSearch && matchesClass;
    });

    // ✅ Pagination logic
    const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
    const startIndex = (currentPage - 1) * studentsPerPage;
    const paginatedStudents = filteredStudents.slice(startIndex, startIndex + studentsPerPage);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const handleStudentClick = (student: Student) => {
        setSelectedStudent(student);
        setShowDetailCard(true);
    };

    const handleUpdateClick = (student: Student, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedStudent(student);
        setShowUpdateDialog(true);
    };

    const handleUpdateStudent = async (updatedStudent: any) => {
        await fetchStudents();
        toast.success("Student updated successfully");
        setShowUpdateDialog(false);
        setSelectedStudent(null);
    };

    const handleDeleteClick = (student: Student, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedStudent(student);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (selectedStudent) {
            try {
                const studentId = selectedStudent.$id || selectedStudent.id;
                await studentService.deleteStudent(studentId);
                await fetchStudents();
                onDeleteStudent?.(studentId);
                toast.success("Student deleted successfully");
            } catch (error: any) {
                console.error("Failed to delete student:", error);
                toast.error("Failed to delete student", { description: error.message });
            } finally {
                setDeleteDialogOpen(false);
                setSelectedStudent(null);
            }
        }
    };

    const handleTransferClick = (student: Student, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedStudent(student);
        setTransferToClass("");
        setTransferReason("");
        setTransferType("class");
        setTransferDialogOpen(true);
    };

    const handleTransferConfirm = async () => {
        if (!selectedStudent) return;
        const studentId = selectedStudent.$id || selectedStudent.id;

        try {
            if (transferType === "class" && transferToClass) {
                await studentService.transferStudent(studentId, transferToClass);
                onTransferStudent?.(studentId, transferToClass);
                toast.success(`Student transferred to ${transferToClass} successfully`);
            } else if (transferType === "school" && transferReason.trim()) {
                await studentService.markAsTransferred(studentId, transferReason);
                toast.success(`Student marked as transferred to another school`);
            } else {
                toast.error("Validation Error", { description: "Please provide required transfer details." });
                return;
            }

            await fetchStudents();
        } catch (error: any) {
            console.error("Failed to transfer student:", error);
            toast.error("Failed to transfer student", { description: error.message });
        } finally {
            setTransferDialogOpen(false);
            setSelectedStudent(null);
            setTransferToClass("");
            setTransferReason("");
        }
    };

    const handleAddStudent = async (student: any) => {
        await fetchStudents();
        onAddStudent(student);
        toast.success("Student added successfully");
    };

    const allClasses = Object.values(KENYA_CURRICULUM).flat();

    return (
        <div className="p-2 sm:p-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center sm:text-left">Students</h2>
                <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                    <Plus size={20} className="mr-2" />
                    Add Student
                </Button>
            </div>

            {/* 🔹 Search + Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="relative w-full sm:w-1/3">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <Input
                        placeholder="Search by name or admission no."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                        <SelectTrigger className="w-full sm:w-40">
                            <SelectValue placeholder="Select Level" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.keys(KENYA_CURRICULUM).map((level) => (
                                <SelectItem key={level} value={level}>
                                    {level}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                        <SelectTrigger className="w-full sm:w-40">
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

            {error && (
                <Card className="mb-6 bg-red-50 border-red-200">
                    <CardContent className="p-4">
                        <p className="text-red-600">{error}</p>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardContent className="p-0">
                    {paginatedStudents.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">No students found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table className="min-w-[700px] sm:min-w-full text-sm sm:text-base">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Admission No.</TableHead>
                                        <TableHead>Student Name</TableHead>
                                        <TableHead>Class</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Guardian</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Fee Balance</TableHead>
                                        <TableHead>Total Fees</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedStudents.map((student) => {
                                        const studentId = student.$id || student.id;
                                        const guardians = student.guardians as Guardian[];

                                        return (
                                            <TableRow
                                                key={studentId}
                                                className={`cursor-pointer hover:bg-blue-50 transition-colors ${student.isTransferred ? "bg-gray-100 opacity-70" : ""
                                                    }`}
                                                onClick={() => handleStudentClick(student)}
                                            >
                                                <TableCell className="font-mono text-xs sm:text-sm font-semibold">
                                                    {student.admissionNumber}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {student.firstName} {student.lastName}
                                                </TableCell>
                                                <TableCell>{student.grade}</TableCell>
                                                <TableCell>
                                                    {student.isTransferred ? (
                                                        <span className="text-xs px-2 py-1 rounded-full bg-gray-300 text-gray-700 font-semibold">
                                                            Transferred
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 font-semibold">
                                                            Active
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {guardians[0]?.name || "N/A"}
                                                    <br />
                                                    <span className="text-xs text-gray-500">
                                                        {guardians[0]?.relationship || ""}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm">{guardians[0]?.phone || "N/A"}</TableCell>
                                                <TableCell>
                                                    <span
                                                        className={`font-semibold ${student.feeBalance > 0 ? "text-red-600" : "text-green-600"
                                                            }`}
                                                    >
                                                        KES {student.feeBalance.toLocaleString()}
                                                    </span>
                                                </TableCell>
                                                <TableCell>KES {student.totalFees.toLocaleString()}</TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                <MoreVertical size={16} />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={(e) => handleUpdateClick(student, e)}>
                                                                <Edit size={16} className="mr-2" /> Update
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={(e) => handleTransferClick(student, e)}>
                                                                <ArrowRightLeft size={16} className="mr-2" /> Transfer
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={(e) => handleDeleteClick(student, e)}
                                                                className="text-red-600 focus:text-red-600"
                                                            >
                                                                <Trash2 size={16} className="mr-2" /> Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* ✅ Pagination Controls */}
                    {filteredStudents.length > studentsPerPage && (
                        <div className="flex justify-between items-center px-4 py-3 border-t text-sm">
                            <span>
                                Showing{" "}
                                <strong>
                                    {startIndex + 1}-{Math.min(startIndex + studentsPerPage, filteredStudents.length)}
                                </strong>{" "}
                                of <strong>{filteredStudents.length}</strong> students
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    Prev
                                </Button>
                                <span className="px-2">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialogs remain unchanged */}
            <AddStudentDialog open={showAddDialog} onOpenChange={setShowAddDialog} onAdd={handleAddStudent} />
            <AddStudentDialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog} onAdd={handleUpdateStudent} student={selectedStudent} isUpdate />
            <StudentDetailCard student={selectedStudent} open={showDetailCard} onOpenChange={setShowDetailCard} />
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Student</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{" "}
                            <strong>
                                {selectedStudent?.firstName} {selectedStudent?.lastName}
                            </strong>
                            ? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
                            Delete Student
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Transfer Student</AlertDialogTitle>
                        <AlertDialogDescription>
                            Transfer{" "}
                            <strong>
                                {selectedStudent?.firstName} {selectedStudent?.lastName}
                            </strong>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4 space-y-4">
                        <Select value={transferType} onValueChange={setTransferType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Transfer Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="class">Transfer to Another Class</SelectItem>
                                <SelectItem value="school">Transfer to Another School</SelectItem>
                            </SelectContent>
                        </Select>
                        {transferType === "class" && (
                            <Select value={transferToClass} onValueChange={setTransferToClass}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select new class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allClasses
                                        .filter((c) => c !== selectedStudent?.grade)
                                        .map((className) => (
                                            <SelectItem key={className} value={className}>
                                                {className}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        )}
                        <Input
                            placeholder="Enter reason for transfer"
                            value={transferReason}
                            onChange={(e) => setTransferReason(e.target.value)}
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleTransferConfirm}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Confirm Transfer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
