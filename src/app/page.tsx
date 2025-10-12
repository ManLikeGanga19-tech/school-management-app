"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/ui/sidebar";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { StudentsView } from "@/components/students/students-view";
import { PaymentsView } from "@/components/payments/payments-view";
import { SMSView } from "@/components/sms/sms-view";

import { authService } from "@/lib/appwrite/auth.service";
import { studentService } from "@/lib/appwrite/student.service";
import { paymentService } from "@/lib/appwrite/payment.service";

import type { StudentDocument } from "@/lib/appwrite/student.service";
import type { PaymentDocument } from "@/lib/appwrite/payment.service";
import type { Student, FeePayment, View } from "@/types";
import { toast } from "sonner";

export default function SchoolManagementPage() {
  const router = useRouter();

  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);

  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  // ---------- Helpers ----------
  const mapStudentDocToStudent = (doc: StudentDocument): Student => {
    const guardians =
      typeof (doc as any).guardians === "string"
        ? JSON.parse((doc as any).guardians)
        : ((doc as any).guardians as any) || [];

    return {
      id: doc.$id,
      $id: doc.$id,
      userId: (doc as any).userId,
      firstName: (doc as any).firstName,
      lastName: (doc as any).lastName,
      grade: (doc as any).grade,
      admissionNumber: (doc as any).admissionNumber,
      dateOfBirth: (doc as any).dateOfBirth,
      guardians,
      feeBalance: (doc as any).feeBalance ?? 0,
      totalFees: (doc as any).totalFees ?? 0,
      paidFees: (doc as any).paidFees ?? 0,
      createdAt: (doc as any).createdAt ?? doc.$createdAt,
      $createdAt: doc.$createdAt,
      $updatedAt: doc.$updatedAt,
    };
  };

  const mapPaymentDocToFeePayment = (doc: PaymentDocument): FeePayment => ({
    id: doc.$id,
    $id: doc.$id,
    studentId: (doc as any).studentId,
    studentName: (doc as any).studentName,
    studentClass: (doc as any).studentClass,
    parentName: (doc as any).parentName,
    parentPhone: (doc as any).parentPhone,
    amount: (doc as any).amount ?? 0,
    date: (doc as any).date,
    time: (doc as any).time,
    paymentMethod: (doc as any).paymentMethod,
    mpesaCode: (doc as any).mpesaCode ?? "",
    receiptNumber: (doc as any).receiptNumber ?? "",
    createdAt: (doc as any).createdAt ?? doc.$createdAt,
    $createdAt: doc.$createdAt,
    $updatedAt: doc.$updatedAt,
  });

  // ---------- Init ----------
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (!currentUser) {
          router.push("/login");
          return;
        }
        if (!mounted) return;

        setUser(currentUser);

        try {
          const userProfile = await authService.getUserProfile(currentUser.$id);
          if (mounted) setProfile(userProfile);
        } catch (err) {
          console.error("Failed to load profile:", err);
        }

        const [rawStudents, rawPayments] = await Promise.all([
          studentService.getStudents(currentUser.$id),
          paymentService.getPayments(currentUser.$id),
        ]);

        if (!mounted) return;

        const fetchedStudents = (rawStudents || []).map(
          (s: unknown) => s as unknown as StudentDocument
        );
        const fetchedPayments = (rawPayments || []).map(
          (p: unknown) => p as unknown as PaymentDocument
        );

        setStudents(fetchedStudents.map(mapStudentDocToStudent));
        setPayments(fetchedPayments.map(mapPaymentDocToFeePayment));
      } catch (error) {
        console.error("Initialization error:", error);
        router.push("/login");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    init();
    return () => {
      mounted = false;
    };
  }, [router]);

  // ---------- Handlers ----------
  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      router.push("/login");
      toast.success("Logged out", {
        description: "You have been logged out successfully.",
      });
    } catch (error: any) {
      console.error("Logout failed:", error);
      toast.error("Logout failed", {
        description: error?.message ?? String(error),
      });
    }
  };

  // ---------- SMS Handler ----------
  const handleSendSMS = async (selectedIds: string[], message: string) => {
    const recipients =
      selectedIds.length > 0
        ? students.filter((s) => selectedIds.includes(s.id))
        : students.filter((s) => s.feeBalance > 0);
    toast.success("SMS Sent (Mock)", {
      description: `Message sent to ${recipients.length} guardian(s).`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your school data...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // ---------- Render ----------
  return (
    <>
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
            {currentView === "dashboard" && (
              <DashboardView
                students={students}
                payments={payments}
                currentUser={
                  profile
                    ? {
                      name: profile.name,
                      schoolName: profile.schoolName,
                      role: profile.role,
                    }
                    : null
                }
              />
            )}

            {currentView === "students" && (
              <StudentsView
                students={students}
                // ✅ Disable adding here — handled only by AddStudentDialog
                onAddStudent={() => { }}
              />
            )}

            {currentView === "payments" && (
              <PaymentsView
                students={students}
                payments={payments}
                // ✅ Disable adding here — handled only by AddPaymentDialog
                onAddPayment={() => { }}
              />
            )}

            {currentView === "sms" && (
              <SMSView students={students} onSendSMS={handleSendSMS} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
