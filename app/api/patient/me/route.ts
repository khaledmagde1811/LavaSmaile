import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth";


export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session || session.role !== "PATIENT") {
      return NextResponse.json(
        { success: false, message: "غير مصرح" },
        { status: 401 }
      );
    }

    const patient = await db.patient.findUnique({
      where: { id: session.userId },
      include: {
        appointments: {
          include: {
            branch: true,
            service: true,
            doctor: true,
          },
          orderBy: { appointmentDate: "desc" },
        },
        followUps: {
          include: {
            branch: true,
            doctor: true,
          },
          orderBy: { scheduledDate: "asc" },
        },
      },
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, message: "لم يتم العثور على سجل المريض" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, patient });
  } catch (error) {
    console.error("Patient profile error:", error);
    return NextResponse.json(
      { success: false, message: "فشل تحميل بيانات المريض" },
      { status: 500 }
    );
  }
}
