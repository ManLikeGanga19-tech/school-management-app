"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/ui/sidebar";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { StudentsView } from "@/components/students/students-view";
import { PaymentsView } from "@/components/payments/payments-view";
import { SMSView } from "@/components/sms/sms-view";
import { ManageSecretariesView } from "@/components/secretaries/manage-secretaries-view";
import { TermManagement } from "@/components/admin/term-management";

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

  const [currentView, setCurrentView] = useState<View | "secretaries" | "term-management">("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // ---------- Mappers ----------
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
      guardians: Array.isArray(guardians) ? guardians : [],
      feeBalance: (doc as any).feeBalance ?? 0,
      totalFees: (doc as any).totalFees ?? 0,
      paidFees: (doc as any).paidFees ?? 0,
      createdAt: (doc as any).createdAt ?? doc.$createdAt,
      $createdAt: doc.$createdAt,
      $updatedAt: doc.$updatedAt,
      term1Arrears: (doc as any).term1Arrears ?? 0,
      term2Arrears: (doc as any).term2Arrears ?? 0,
      term3Arrears: (doc as any).term3Arrears ?? 0,
      totalArrears: (doc as any).totalArrears ?? 0,
      lastArrearsUpdate: (doc as any).lastArrearsUpdate,
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
    termNumber: (doc as any).termNumber,
    createdAt: (doc as any).createdAt ?? doc.$createdAt,
    $createdAt: doc.$createdAt,
    $updatedAt: doc.$updatedAt,
  });

  // ---------- Central loader ----------
  const loadData = useCallback(
    async (schoolName: string) => {
      const [rawStudents, rawPayments] = await Promise.all([
        studentService.getStudentsBySchool(schoolName),
        paymentService.getPaymentsBySchool(schoolName),
      ]);

      setStudents(rawStudents.map(mapStudentDocToStudent));
      setPayments(rawPayments.map(mapPaymentDocToFeePayment));
    },
    []
  );

  // ---------- Init ----------
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (!currentUser) {
          router.push("/login");
          return;
        }
        if (!mounted) return;

        setUser(currentUser);

        const userProfile = await authService.getUserProfile(currentUser.$id);
        if (!mounted) return;
        setProfile(userProfile);

        if (!userProfile?.schoolName) {
          toast.error("Profile incomplete", {
            description: "Your account is missing 'schoolName'. Please contact the administrator.",
          });
          return;
        }

        await loadData(userProfile.schoolName);
      } catch (error) {
        console.error("Initialization error:", error);
        router.push("/login");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router, loadData]);

  // ---------- Handlers ----------
  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      router.push("/login");
      toast.success("Logged out", { description: "You have been logged out successfully." });
    } catch (error: any) {
      console.error("Logout failed:", error);
      toast.error("Logout failed", { description: error?.message ?? String(error) });
    }
  };

  const handleSendSMS = async (selectedIds: string[], message: string, messageType?: "fee" | "general") => {
    const recipients =
      selectedIds.length > 0
        ? students.filter((s) => selectedIds.includes(s.id))
        : messageType === "fee"
          ? students.filter((s) => s.feeBalance > 0)
          : students;

    const personalizedMessages = recipients.map((student) => {
      const guardian = student.guardians[0];
      let personalizedMsg = message
        .replace(/\[StudentName\]/g, `${student.firstName} ${student.lastName}`)
        .replace(/\[Class\]/g, student.grade)
        .replace(/\[Balance\]/g, student.feeBalance.toString());

      return {
        phone: guardian?.phone || "",
        message: personalizedMsg,
        studentName: `${student.firstName} ${student.lastName}`,
      };
    });

    console.log("SMS prepared:", { count: personalizedMessages.length });
    toast.success("SMS Ready to Send", {
      description: `${personalizedMessages.length} message(s) prepared.`,
    });
  };

  // ✅ Universal refresh function
  const refreshAll = useCallback(async () => {
    if (profile?.schoolName) {
      await loadData(profile.schoolName);
      toast.info("Data refreshed", { description: "Latest student and payment data loaded." });
    }
  }, [profile?.schoolName, loadData]);

  // ---------- Conditional Loading ----------
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

  const isAdmin = profile?.role === "admin";
  const isSecretary = profile?.role === "secretary";

  // ---------- Render ----------
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
        userRole={profile?.role}
      />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {profile && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Welcome:</strong> {profile.name} •{" "}
                <strong>School:</strong> {profile.schoolName}
              </p>
            </div>
          )}

          {currentView === "dashboard" && isAdmin && (
            <DashboardView
              students={students}
              payments={payments}
              currentUser={{
                name: profile?.name || "User",
                schoolName: profile?.schoolName || "School",
                role: profile?.role || "admin",
              }}
            />
          )}

          {currentView === "students" && (
            <StudentsView
              students={students}
              onAddStudent={async () => {
                await refreshAll();
              }}
            />
          )}

          {/* ✅ Payment updates now trigger global refresh */}
          {currentView === "payments" && (
            <PaymentsView
              students={students}
              payments={payments}
              onAddPayment={async () => {
                await refreshAll();
              }}
            />
          )}

          {currentView === "sms" && (
            <SMSView students={students} {...({ onSendSMS: handleSendSMS } as any)} />
          )}

          {currentView === "secretaries" && isAdmin && (
            <ManageSecretariesView adminId={user.$id} />
          )}

          {currentView === "term-management" && isAdmin && <TermManagement />}
        </div>
      </div>
    </div>
  );
}
