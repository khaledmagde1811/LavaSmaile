import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentSession } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (
      !session ||
      !["SUPER_ADMIN", "BRANCH_ADMIN", "DOCTOR", "RECEPTIONIST"].includes(session.role)
    ) {
      return NextResponse.json(
        { success: false, message: "غير مصرح" },
        { status: 403 }
      );
    }
    const { id } = await params;
    const body = await request.json();
    const { status } = body;
    const validStatuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

    if (typeof status !== "string" || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "حالة الحجز المحددة غير صالحة" },
        { status: 400 }
      );
    }

    let query = supabase
      .from("Appointment")
      .update({ status, updatedAt: new Date().toISOString() })
      .eq("id", id);
    if (session.role !== "SUPER_ADMIN") {
      if (!session.branchId) {
        return NextResponse.json(
          { success: false, message: "لا يوجد فرع مرتبط بحسابك" },
          { status: 403 }
        );
      }
      query = query.eq("branchId", session.branchId);
    }
    if (session.role === "DOCTOR") {
      if (!session.doctorId) {
        return NextResponse.json(
          { success: false, message: "حساب الطبيب غير مرتبط بسجل طبيب" },
          { status: 403 }
        );
      }
      query = query.eq("doctorId", session.doctorId);
    }
    const { data: updated, error } = await query
      .select("*, patient:Patient(id, fullName, phone, secondaryPhone, email, address, nationalId, createdAt, updatedAt), branch:Branch(*), service:Service(*), medicalSolution:MedicalSolution(*)")
      .maybeSingle();
    if (error) throw error;
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "الحجز غير موجود أو لا تملك صلاحية تعديله" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `تم تحديث حالة الحجز إلى ${status}`,
      appointment: updated,
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { success: false, message: "فشل تحديث الحجز" },
      { status: 500 }
    );
  }
}
