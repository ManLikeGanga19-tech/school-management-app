"use client"

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/ui/sidebar';
import { LoginPage } from '@/components/auth/login-page';
import { DashboardView } from '@/components/dashboard/dashboard-view';
import { StudentsView } from '@/components/students/students-view';
import { PaymentsView } from '@/components/payments/payments-view';
import { SMSView } from '@/components/sms/sms-view';
import { Student, FeePayment, View } from '@/types';
import { loginUser, saveAuthToken, removeAuthToken, isAuthenticated, User } from '@/lib/auth';

export default function SchoolManagementApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    if (isAuthenticated()) {
      setIsLoggedIn(true);
      // In production, fetch user data from API using token
    }
  }, []);

  const [students, setStudents] = useState<Student[]>([
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      grade: 'Grade 7',
      admissionNumber: 'STU001',
      dateOfBirth: '2008-05-15',
      guardians: [{
        id: 'g1',
        name: 'Jane Doe',
        phone: '+254712345678',
        email: 'jane.doe@email.com',
        relationship: 'Mother'
      }],
      feeBalance: 15000,
      totalFees: 50000,
      paidFees: 35000
    },
    {
      id: '2',
      firstName: 'Mary',
      lastName: 'Smith',
      grade: 'Grade 9',
      admissionNumber: 'STU002',
      dateOfBirth: '2009-08-22',
      guardians: [{
        id: 'g2',
        name: 'Robert Smith',
        phone: '+254723456789',
        email: 'robert.smith@email.com',
        relationship: 'Father'
      }],
      feeBalance: 0,
      totalFees: 50000,
      paidFees: 50000
    },
    {
      id: '3',
      firstName: 'Kevin',
      lastName: 'Mwangi',
      grade: 'PP1 (Pre-Primary 1)',
      admissionNumber: 'STU003',
      dateOfBirth: '2020-03-12',
      guardians: [{
        id: 'g3',
        name: 'Grace Mwangi',
        phone: '+254734567890',
        email: 'grace.mwangi@email.com',
        relationship: 'Mother'
      }],
      feeBalance: 5000,
      totalFees: 30000,
      paidFees: 25000
    }
  ]);

  const [payments, setPayments] = useState<FeePayment[]>([
    {
      id: 'p1',
      studentId: '1',
      studentName: 'John Doe',
      studentClass: 'Grade 7',
      parentName: 'Jane Doe',
      parentPhone: '+254712345678',
      amount: 20000,
      date: '2025-09-15',
      time: '10:30',
      paymentMethod: 'Kcb M-Pesa',
      mpesaCode: 'MP123XYZ',
      receiptNumber: 'RCP001'
    }
  ]);

  const handleLogin = async (email: string, password: string) => {
    const result = await loginUser(email, password);

    if (result.success && result.token && result.user) {
      saveAuthToken(result.token);
      setCurrentUser(result.user);
      setIsLoggedIn(true);
    } else {
      alert(result.error || 'Login failed');
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    setCurrentUser(null);
    setIsLoggedIn(false);
    setCurrentView('dashboard');
  };

  const handleAddStudent = (formData: any) => {
    const student: Student = {
      id: Date.now().toString(),
      firstName: formData.firstName,
      lastName: formData.lastName,
      grade: formData.grade,
      admissionNumber: formData.admissionNumber,
      dateOfBirth: formData.dateOfBirth,
      guardians: [{
        id: Date.now().toString(),
        name: formData.guardianName,
        phone: formData.guardianPhone,
        email: formData.guardianEmail,
        relationship: formData.relationship
      }],
      totalFees: parseFloat(formData.totalFees),
      paidFees: 0,
      feeBalance: parseFloat(formData.totalFees)
    };

    setStudents([...students, student]);
    alert(`Student ${formData.firstName} ${formData.lastName} added successfully!`);
  };

  const handleDeleteStudent = (studentId: string) => {
    const student = students.find(s => s.id === studentId);

    // Remove student from students array
    setStudents(students.filter(s => s.id !== studentId));

    // Also remove associated payments
    setPayments(payments.filter(p => p.studentId !== studentId));

    if (student) {
      alert(`Student ${student.firstName} ${student.lastName} has been deleted successfully.`);
    }
  };

  const handleTransferStudent = (studentId: string, newClass: string) => {
    const student = students.find(s => s.id === studentId);
    const oldClass = student?.grade;

    // Update student's grade/class
    setStudents(students.map(s =>
      s.id === studentId ? { ...s, grade: newClass } : s
    ));

    // Update class in all associated payments
    setPayments(payments.map(p =>
      p.studentId === studentId ? { ...p, studentClass: newClass } : p
    ));

    if (student) {
      alert(`${student.firstName} ${student.lastName} transferred from ${oldClass} to ${newClass} successfully!`);
    }
  };

  const handleAddPayment = (formData: any) => {
    console.log('Received from dialog:', formData);

    const student = students.find(s => s.id === formData.studentId);
    if (!student) {
      alert('Student not found');
      return;
    }

    // Generate receipt number
    const receiptNumber = `RCP${Date.now().toString().slice(-6)}`;

    // Create payment object using data from dialog
    const payment: FeePayment = {
      id: Date.now().toString(),
      studentId: formData.studentId,
      studentName: formData.studentName,
      studentClass: formData.studentClass,
      parentName: formData.parentName,
      parentPhone: formData.parentPhone,
      mpesaCode: formData.mpesaCode || '',
      amount: parseFloat(formData.amount),
      date: formData.date,
      time: formData.time,
      paymentMethod: formData.paymentMethod || 'Kcb M-Pesa',
      receiptNumber: receiptNumber
    };

    console.log('Created payment:', payment);

    // Add to beginning of payments array (newest first)
    setPayments([payment, ...payments]);

    // Update student balance
    setStudents(students.map(s => {
      if (s.id === formData.studentId) {
        const newPaid = s.paidFees + parseFloat(formData.amount);
        return {
          ...s,
          paidFees: newPaid,
          feeBalance: s.totalFees - newPaid
        };
      }
      return s;
    }));

    alert(`Payment Recorded Successfully!\n\nReceipt: ${receiptNumber}\nStudent: ${formData.studentName}\nAmount: KES ${parseFloat(formData.amount).toLocaleString()}`);
  };

  const handleSendSMS = (selectedIds: string[], message: string) => {
    const recipients = selectedIds.length > 0
      ? students.filter(s => selectedIds.includes(s.id))
      : students.filter(s => s.feeBalance > 0);

    alert(`SMS would be sent to ${recipients.length} guardian(s):\n\n${message}\n\nIntegrate with SMS gateway API (Africa's Talking, Twilio, etc.)`);
  };

  // Show login page if not authenticated
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Show main application
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
      />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {currentView === 'dashboard' && (
            <DashboardView students={students} payments={payments} />
          )}

          {currentView === 'students' && (
            <StudentsView
              students={students}
              onAddStudent={handleAddStudent}
              onDeleteStudent={handleDeleteStudent}
              onTransferStudent={handleTransferStudent}
            />
          )}

          {currentView === 'payments' && (
            <PaymentsView
              students={students}
              payments={payments}
              onAddPayment={handleAddPayment}
            />
          )}

          {currentView === 'sms' && (
            <SMSView students={students} onSendSMS={handleSendSMS} />
          )}
        </div>
      </div>
    </div>
  );
}