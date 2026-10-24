import { NextResponse } from "next/server";
import { createRecordId, supabase } from "@/lib/supabase";
import { getCurrentSession } from "@/lib/auth";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("Branch")
      .select("*, doctors:Doctor(id, name, specialty, workingDays)")
      .eq("status", "ACTIVE")
      .order("createdAt", { ascending: true });
    if (error) throw error;
    const branches = await Promise.all(
      data.map(async (branch) => {
        const [appointmentsResult, doctorsResult, followUpsResult] = await Promise.all([
          supabase.from("Appointment").select("id", { count: "exact", head: true }).eq("branchId", branch.id),
          supabase.from("Doctor").select("id", { count: "exact", head: true }).eq("branchId", branch.id),
          supabase.from("FollowUp").select("id", { count: "exact", head: true }).eq("branchId", branch.id),
        ]);
        const countError = appointmentsResult.error ?? doctorsResult.error ?? followUpsResult.error;
        if (countError) throw countError;
        return {
          ...branch,
          _count: {
            appointments: appointmentsResult.count ?? 0,
            doctors: doctorsResult.count ?? 0,
            followUps: followUpsResult.count ?? 0,
          },
        };
      })
    );

    return NextResponse.json({ success: true, branches });
  } catch (error) {
    console.error("Error fetching branches:", error);
    return NextResponse.json(
      { success: false, message: "فشل في جلب قائمة الفروع" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // التحقق من صلاحية الأدمن
    const session = await getCurrentSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "غير مصرح لك بإضافة فروع جديدة (مطلوب صلاحية المدير العام)" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, city, address, phone, workingHours, mapUrl } = body;

    if (!name || !city || !address || !phone) {
      return NextResponse.json(
        { success: false, message: "يرجى ملء جميع الحقول الإلزامية للفرع" },
        { status: 400 }
      );
    }

    const { data: branch, error } = await supabase
      .from("Branch")
      .insert({
        id: createRecordId(),
        updatedAt: new Date().toISOString(),
        name: name.trim(),
        city: city.trim(),
        address: address.trim(),
        phone: phone.trim(),
        workingHours: workingHours?.trim() || "10:00 ص - 10:00 م",
        mapUrl: mapUrl?.trim() || null,
        status: "ACTIVE",
      })
      .select("*")
      .single();
    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "تمت إضافة الفرع الجديد بنجاح",
      branch,
    });
  } catch (error) {
    console.error("Error creating branch:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء إضافة الفرع" },
      { status: 500 }
    );
  }
}
