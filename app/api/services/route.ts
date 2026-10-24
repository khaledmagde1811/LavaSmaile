import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { createRecordId, supabase } from "@/lib/supabase";
import { validateServiceInput } from "@/lib/services";

export async function GET() {
  try {
    const { data: services, error } = await supabase
      .from("Service")
      .select("*")
      .eq("isActive", true)
      .order("price", { ascending: false });
    if (error) throw error;

    return NextResponse.json({ success: true, services });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { success: false, message: "فشل في جلب قائمة الخدمات" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بإضافة الخدمات" },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "صيغة البيانات غير صالحة" },
      { status: 400 }
    );
  }

  const validation = validateServiceInput(body);
  if ("error" in validation) {
    return NextResponse.json(
      { success: false, message: validation.error },
      { status: 400 }
    );
  }

  try {
    const { data: service, error } = await supabase
      .from("Service")
      .insert({
        ...validation.values,
        id: createRecordId(),
        updatedAt: new Date().toISOString(),
      })
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, service }, { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { success: false, message: "فشل في إنشاء الخدمة" },
      { status: 500 }
    );
  }
}
