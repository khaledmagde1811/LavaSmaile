import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { validateMedicalSolutionInput, type MedicalSolutionValues } from "@/lib/medical-solutions";

type RouteContext = { params: Promise<{ id: string }> };

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await getCurrentSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بتعديل الخدمات الطبية" },
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

  const { id } = await params;
  try {
    const { data: existing, error: existingError } = await supabase
      .from("MedicalSolution")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (existingError) throw existingError;
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "الخدمة الطبية غير موجودة" },
        { status: 404 }
      );
    }

    const currentValues: MedicalSolutionValues = {
      titleAr: existing.titleAr,
      titleEn: existing.titleEn,
      slug: existing.slug,
      shortDescription: existing.shortDescription,
      content: existing.content,
      price: existing.price,
      icon: existing.icon,
      imageUrl: existing.imageUrl,
      category: existing.category,
      isActive: existing.isActive,
      displayOrder: existing.displayOrder,
    };
    const validation = validateMedicalSolutionInput(body, currentValues);
    if ("error" in validation) {
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 400 }
      );
    }

    const { data: solution, error } = await supabase
      .from("MedicalSolution")
      .update({ ...validation.values, updatedAt: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, solution });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { success: false, message: "هذا المعرّف مستخدم بالفعل، اختر معرّفاً آخر" },
        { status: 409 }
      );
    }
    console.error("Error updating medical solution:", error);
    return NextResponse.json(
      { success: false, message: "فشل في تحديث الخدمة الطبية" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  return PATCH(request, context);
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await getCurrentSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بحذف الخدمات الطبية" },
      { status: 403 }
    );
  }

  const { id } = await params;
  try {
    const { data, error } = await supabase
      .from("MedicalSolution")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) throw error;
    if (!data.length) {
      return NextResponse.json(
        { success: false, message: "الخدمة الطبية غير موجودة" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting medical solution:", error);
    return NextResponse.json(
      { success: false, message: "فشل في حذف الخدمة الطبية" },
      { status: 500 }
    );
  }
}
