import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { createRecordId, supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session || session.role !== "PATIENT") {
      return NextResponse.json(
        { success: false, message: "سجل الدخول لإرسال استفسار أو شكوى" },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "بيانات الطلب غير صالحة" },
        { status: 400 }
      );
    }
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, message: "بيانات الطلب غير صالحة" },
        { status: 400 }
      );
    }

    const input = body as Record<string, unknown>;
    const branchId = typeof input.branchId === "string" ? input.branchId : "";
    const noteType = input.noteType;
    const message = typeof input.message === "string" ? input.message.trim() : "";
    const painLocation =
      typeof input.painLocation === "string" ? input.painLocation.trim() : "";

    if (
      !branchId ||
      !message ||
      message.length > 2000 ||
      (noteType !== "COMPLAINT" && noteType !== "INQUIRY") ||
      painLocation.length > 160
    ) {
      return NextResponse.json(
        { success: false, message: "اختر الفرع ونوع الطلب واكتب رسالة صالحة" },
        { status: 400 }
      );
    }

    const { data: branch, error: branchError } = await supabase
      .from("Branch")
      .select("id")
      .eq("id", branchId)
      .eq("status", "ACTIVE")
      .maybeSingle();
    if (branchError) throw branchError;
    if (!branch) {
      return NextResponse.json(
        { success: false, message: "الفرع المحدد غير متاح حالياً" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const { data: appointment, error } = await supabase
      .from("Appointment")
      .insert({
        id: createRecordId(),
        updatedAt: now,
        branchId,
        patientId: session.userId,
        appointmentDate: now,
        status: "PENDING",
        bookingType: "GENERAL",
        bookingTitle: noteType === "COMPLAINT" ? "شكوى مريض" : "استفسار مريض",
        noteType,
        patientComplaint: message,
        painLocation: painLocation || null,
      })
      .select("id, appointmentDate, status, noteType, patientComplaint, painLocation, branch:Branch(name)")
      .single();
    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "تم إرسال طلبك إلى الفرع، وسيظهر في سجل حسابك لمتابعته.",
      appointment,
    });
  } catch (error) {
    console.error("Patient complaint submission error:", error);
    return NextResponse.json(
      { success: false, message: "تعذر إرسال الطلب حالياً. يرجى المحاولة لاحقاً." },
      { status: 500 }
    );
  }
}
