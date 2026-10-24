import { NextResponse } from "next/server";
import { createRecordId, supabase } from "@/lib/supabase";
import { getCurrentSession } from "@/lib/auth";

export async function GET(request: Request) {
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
    if (session.role === "DOCTOR" && !session.doctorId) {
      return NextResponse.json(
        { success: false, message: "حساب الطبيب غير مرتبط بسجل طبيب" },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");

    let query = supabase
      .from("FollowUp")
      .select("*, patient:Patient(id, fullName, phone, secondaryPhone, email, address, nationalId, createdAt, updatedAt), branch:Branch(*), doctor:Doctor(*), appointment:Appointment(*, service:Service(*))")
      .order("scheduledDate", { ascending: true });
    if (branchId && branchId !== "ALL") query = query.eq("branchId", branchId);
    if (session.role !== "SUPER_ADMIN") {
      if (!session.branchId) {
        return NextResponse.json(
          { success: false, message: "لا يوجد فرع مرتبط بحسابك" },
          { status: 403 }
        );
      }
      query = query.eq("branchId", session.branchId);
    }

    const { data: followUps, error } = await query;
    if (error) throw error;

    const visibleFollowUps = session.role === "DOCTOR"
      ? (followUps ?? []).filter((followUp) =>
          followUp.doctorId === session.doctorId ||
          followUp.appointment?.doctorId === session.doctorId
        )
      : followUps ?? [];
    return NextResponse.json({ success: true, followUps: visibleFollowUps });
  } catch (error) {
    console.error("Error fetching follow-ups:", error);
    return NextResponse.json(
      { success: false, message: "فشل جلب سجلات المتابعة" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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
    const body = await request.json();
    const { patientId, branchId, doctorId, appointmentId, scheduledDate, followUpType, notes } = body;

    if (
      typeof patientId !== "string" ||
      typeof branchId !== "string" ||
      typeof appointmentId !== "string" ||
      typeof scheduledDate !== "string" ||
      typeof followUpType !== "string" ||
      !patientId ||
      !branchId ||
      !appointmentId ||
      !followUpType ||
      (notes !== undefined && notes !== null && typeof notes !== "string") ||
      (typeof notes === "string" && notes.length > 2000)
    ) {
      return NextResponse.json(
        { success: false, message: "تحقق من بيانات المتابعة واربطها بموعد مسجل" },
        { status: 400 }
      );
    }
    const scheduledDateValue = new Date(scheduledDate);
    if (Number.isNaN(scheduledDateValue.getTime())) {
      return NextResponse.json(
        { success: false, message: "تاريخ المتابعة غير صالح" },
        { status: 400 }
      );
    }
    if (
      session.role !== "SUPER_ADMIN" &&
      (!session.branchId || session.branchId !== branchId)
    ) {
      return NextResponse.json(
        { success: false, message: "غير مصرح لك بجدولة متابعة لهذا الفرع" },
        { status: 403 }
      );
    }

    const { data: appointment, error: appointmentError } = await supabase
      .from("Appointment")
      .select("id, patientId, branchId, doctorId")
      .eq("id", appointmentId)
      .maybeSingle();
    if (appointmentError) throw appointmentError;
    if (
      !appointment ||
      appointment.patientId !== patientId ||
      appointment.branchId !== branchId
    ) {
      return NextResponse.json(
        { success: false, message: "الموعد لا يطابق المريض والفرع المحددين" },
        { status: 400 }
      );
    }
    if (
      session.role === "DOCTOR" &&
      (!session.doctorId || appointment.doctorId !== session.doctorId)
    ) {
      return NextResponse.json(
        { success: false, message: "لا يمكنك جدولة متابعة لحالة غير مسندة إليك" },
        { status: 403 }
      );
    }
    if (doctorId && doctorId !== appointment.doctorId) {
      return NextResponse.json(
        { success: false, message: "الطبيب المحدد لا يطابق الطبيب المسند للموعد" },
        { status: 400 }
      );
    }

    const { data: followUp, error } = await supabase
      .from("FollowUp")
      .insert({
        id: createRecordId(),
        updatedAt: new Date().toISOString(),
        patientId,
        branchId,
        doctorId: appointment.doctorId,
        appointmentId,
        scheduledDate: scheduledDateValue.toISOString(),
        followUpType,
        status: "SCHEDULED",
        notes: notes || null,
      })
      .select("*, patient:Patient(id, fullName, phone, secondaryPhone, email, address, nationalId, createdAt, updatedAt), branch:Branch(*)")
      .single();
    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "تم جدولة موعد المتابعة بنجاح",
      followUp,
    });
  } catch (error) {
    console.error("Error creating follow-up:", error);
    return NextResponse.json(
      { success: false, message: "فشل جدولة المتابعة" },
      { status: 500 }
    );
  }
}
