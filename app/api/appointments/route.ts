import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");
    const status = searchParams.get("status");

    const whereClause: any = {};
    if (branchId && branchId !== "ALL") {
      whereClause.branchId = branchId;
    }
    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    const appointments = await db.appointment.findMany({
      where: whereClause,
      include: {
        patient: true,
        branch: true,
        doctor: true,
        service: true,
        followUps: true,
      },
      orderBy: { appointmentDate: "desc" },
    });

    return NextResponse.json({ success: true, appointments });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { success: false, message: "فشل في جلب الحجوزات" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      branchId,
      serviceId,
      doctorId,
      appointmentDate,
      fullName,
      phone,
      secondaryPhone,
      email,
      address,
      nationalId,
      noteType,
      patientComplaint,
      patientSuggestion,
      painLocation,
    } = body;

    // التحقق من الحقول الأساسية
    if (!branchId || !fullName || !phone || !appointmentDate) {
      return NextResponse.json(
        { success: false, message: "يرجى ملء جميع الحقول المطلوبة (الفرع، الاسم، الهاتف، وموعد الحجز)" },
        { status: 400 }
      );
    }

    // 1. البحث عن المريض بالهاتف أو إنشاؤه
    let patient = await db.patient.findUnique({
      where: { phone: phone.trim() },
    });

    if (!patient) {
      patient = await db.patient.create({
        data: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          secondaryPhone: secondaryPhone?.trim() || null,
          email: email?.trim() || null,
          address: address?.trim() || null,
          nationalId: nationalId?.trim() || null,
        },
      });
    } else {
      // تحديث البيانات الإضافية إن وجدت
      patient = await db.patient.update({
        where: { id: patient.id },
        data: {
          fullName: fullName.trim() || patient.fullName,
          secondaryPhone: secondaryPhone?.trim() || patient.secondaryPhone,
          email: email?.trim() || patient.email,
          address: address?.trim() || patient.address,
          nationalId: nationalId?.trim() || patient.nationalId,
        },
      });
    }

    // 2. إنشاء الحجز
    const appointment = await db.appointment.create({
      data: {
        branchId,
        patientId: patient.id,
        serviceId: serviceId || null,
        doctorId: doctorId || null,
        appointmentDate: new Date(appointmentDate),
        status: "PENDING",
        noteType: noteType || "COMPLAINT",
        patientComplaint: patientComplaint?.trim() || null,
        patientSuggestion: patientSuggestion?.trim() || null,
        painLocation: painLocation?.trim() || null,
      },
      include: {
        branch: true,
        patient: true,
        service: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "تم تسجيل طلب حجزك بنجاح وسيتواصل معك فريق الاستقبال لتأكيد الموعد.",
      appointmentId: appointment.id,
      appointment,
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء تسجيل الحجز، يرجى المحاولة لاحقاً." },
      { status: 500 }
    );
  }
}
