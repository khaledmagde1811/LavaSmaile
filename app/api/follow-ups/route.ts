import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");

    const whereClause: any = {};
    if (branchId && branchId !== "ALL") {
      whereClause.branchId = branchId;
    }

    const followUps = await db.followUp.findMany({
      where: whereClause,
      include: {
        patient: true,
        branch: true,
        doctor: true,
        appointment: {
          include: {
            service: true,
          },
        },
      },
      orderBy: { scheduledDate: "asc" },
    });

    return NextResponse.json({ success: true, followUps });
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
    const body = await request.json();
    const { patientId, branchId, doctorId, appointmentId, scheduledDate, followUpType, notes } = body;

    if (!patientId || !branchId || !scheduledDate || !followUpType) {
      return NextResponse.json(
        { success: false, message: "يرجى ملء جميع بيانات المتابعة المطلوبة" },
        { status: 400 }
      );
    }

    const followUp = await db.followUp.create({
      data: {
        patientId,
        branchId,
        doctorId: doctorId || null,
        appointmentId: appointmentId || null,
        scheduledDate: new Date(scheduledDate),
        followUpType,
        status: "SCHEDULED",
        notes: notes || null,
      },
      include: {
        patient: true,
        branch: true,
      },
    });

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
