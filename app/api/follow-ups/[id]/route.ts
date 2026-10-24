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
    const { status, notes } = body;
    const validStatuses = ["SCHEDULED", "COMPLETED", "MISSED", "CANCELLED"];

    const updates: { status?: string; notes?: string | null; updatedAt?: string } = {};
    if (status !== undefined) {
      if (typeof status !== "string" || !validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, message: "حالة المتابعة المحددة غير صالحة" },
          { status: 400 }
        );
      }
      updates.status = status;
    }
    if (notes !== undefined) {
      if (notes !== null && typeof notes !== "string") {
        return NextResponse.json(
          { success: false, message: "ملاحظات المتابعة غير صالحة" },
          { status: 400 }
        );
      }
      updates.notes = notes;
    }
    if (status === undefined && notes === undefined) {
      return NextResponse.json(
        { success: false, message: "لا توجد تغييرات صالحة للحفظ" },
        { status: 400 }
      );
    }
    updates.updatedAt = new Date().toISOString();
    let query = supabase
      .from("FollowUp")
      .update(updates)
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
      .select("*, patient:Patient(id, fullName, phone, secondaryPhone, email, address, nationalId, createdAt, updatedAt), branch:Branch(*)")
      .maybeSingle();
    if (error) throw error;
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "المتابعة غير موجودة أو لا تملك صلاحية تعديلها" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "تم تحديث حالة المتابعة بنجاح",
      followUp: updated,
    });
  } catch (error) {
    console.error("Error updating follow-up:", error);
    return NextResponse.json(
      { success: false, message: "فشل تحديث حالة المتابعة" },
      { status: 500 }
    );
  }
}
