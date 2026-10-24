import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { createRecordId, supabase } from "@/lib/supabase";
import { validateMedicalSolutionInput } from "@/lib/medical-solutions";

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

export async function GET(request: Request) {
  try {
    const includeInactive = new URL(request.url).searchParams.get("all") === "true";
    if (includeInactive) {
      const session = await getCurrentSession();
      if (!session || session.role !== "SUPER_ADMIN") {
        return NextResponse.json(
          { success: false, message: "غير مصرح لك بإدارة الخدمات الطبية" },
          { status: 403 }
        );
      }
    }

    let query = supabase
      .from("MedicalSolution")
      .select("*")
      .order("displayOrder", { ascending: true })
      .order("createdAt", { ascending: true });
    if (!includeInactive) query = query.eq("isActive", true);
    const { data: solutions, error } = await query;
    if (error) throw error;
    return NextResponse.json({ success: true, solutions });
  } catch (error) {
    console.error("Error fetching medical solutions:", error);
    return NextResponse.json(
      { success: false, message: "فشل في جلب الخدمات الطبية" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بإضافة الخدمات الطبية" },
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

  const validation = validateMedicalSolutionInput(body);
  if ("error" in validation) {
    return NextResponse.json(
      { success: false, message: validation.error },
      { status: 400 }
    );
  }

  try {
    const { data: solution, error } = await supabase
      .from("MedicalSolution")
      .insert({
        ...validation.values,
        id: createRecordId(),
        updatedAt: new Date().toISOString(),
      })
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, solution }, { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { success: false, message: "هذا المعرّف مستخدم بالفعل، اختر معرّفاً آخر" },
        { status: 409 }
      );
    }
    console.error("Error creating medical solution:", error);
    return NextResponse.json(
      { success: false, message: "فشل في إنشاء الخدمة الطبية" },
      { status: 500 }
    );
  }
}
