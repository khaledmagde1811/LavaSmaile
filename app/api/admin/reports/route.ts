import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const PAGE_SIZE = 1000;
const MAX_REPORT_ROWS = 10_000;
const MAX_RANGE_DAYS = 366;

function parseDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    ? date
    : null;
}

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { success: false, message: "التقارير متاحة للمدير العام فقط." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const fromDate = parseDate(searchParams.get("from"));
  const toDate = parseDate(searchParams.get("to"));
  const branchId = searchParams.get("branchId") ?? "ALL";
  const doctorId = searchParams.get("doctorId") ?? "ALL";
  if (!fromDate || !toDate || fromDate > toDate) {
    return NextResponse.json(
      { success: false, message: "حدد فترة زمنية صحيحة للتقرير." },
      { status: 400 }
    );
  }
  const rangeDays = (toDate.getTime() - fromDate.getTime()) / 86_400_000 + 1;
  if (rangeDays > MAX_RANGE_DAYS) {
    return NextResponse.json(
      { success: false, message: "الفترة القصوى للتقرير الواحد 366 يومًا." },
      { status: 400 }
    );
  }
  const endExclusive = new Date(toDate);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

  try {
    const [branchesResult, doctorsResult] = await Promise.all([
      supabase.from("Branch").select("id, name, city").order("name"),
      supabase.from("Doctor").select("id, name, specialty, branchId").order("name"),
    ]);
    if (branchesResult.error) throw branchesResult.error;
    if (doctorsResult.error) throw doctorsResult.error;

    let query = supabase
      .from("Appointment")
      .select(
        "id, appointmentDate, status, bookingType, bookingTitle, bookingPrice, patientId, branchId, doctorId, branch:Branch(id, name, city), doctor:Doctor(id, name, specialty), patient:Patient(fullName), service:Service(name), medicalSolution:MedicalSolution(titleAr)"
      )
      .gte("appointmentDate", fromDate.toISOString())
      .lt("appointmentDate", endExclusive.toISOString())
      .order("appointmentDate", { ascending: false });

    if (branchId !== "ALL") query = query.eq("branchId", branchId);
    if (doctorId !== "ALL") query = query.eq("doctorId", doctorId);

    const appointments = [];
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const { data, error } = await query.range(offset, offset + PAGE_SIZE - 1);
      if (error) throw error;
      appointments.push(...data);
      if (appointments.length > MAX_REPORT_ROWS) {
        return NextResponse.json(
          {
            success: false,
            message: "نتائج التقرير أكثر من 10,000 حجز. قلّص الفترة أو اختر فرعًا محددًا.",
          },
          { status: 413 }
        );
      }
      if (data.length < PAGE_SIZE) break;
      if (appointments.length === MAX_REPORT_ROWS) {
        const { data: additionalRows, error: additionalRowsError } = await query.range(
          MAX_REPORT_ROWS,
          MAX_REPORT_ROWS
        );
        if (additionalRowsError) throw additionalRowsError;
        if (additionalRows.length > 0) {
          return NextResponse.json(
            {
              success: false,
              message: "نتائج التقرير أكثر من 10,000 حجز. قلّص الفترة أو اختر فرعًا محددًا.",
            },
            { status: 413 }
          );
        }
        break;
      }
    }

    return NextResponse.json({
      success: true,
      filters: {
        from: searchParams.get("from"),
        to: searchParams.get("to"),
        branchId,
        doctorId,
      },
      branches: branchesResult.data,
      doctors: doctorsResult.data,
      appointments,
    });
  } catch (error) {
    console.error("Error generating admin report:", error);
    return NextResponse.json(
      { success: false, message: "تعذر إنشاء التقرير. حاول مرة أخرى." },
      { status: 500 }
    );
  }
}
