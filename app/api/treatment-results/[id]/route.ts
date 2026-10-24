import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import type { Database } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

const BUCKET = "treatment-results";

type RouteContext = { params: Promise<{ id: string }> };

async function requireAdmin() {
  const session = await getCurrentSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return {
      session: null,
      response: NextResponse.json(
        { success: false, message: "غير مصرح لك بإدارة معرض النتائج" },
        { status: 403 }
      ),
    };
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      session: null,
      response: NextResponse.json(
        { success: false, message: "يلزم إعداد مفتاح Supabase الخادمي لإدارة معرض النتائج." },
        { status: 503 }
      ),
    };
  }
  return { session, response: null };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "صيغة البيانات غير صالحة" },
      { status: 400 }
    );
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { success: false, message: "بيانات التحديث غير صالحة" },
      { status: 400 }
    );
  }
  const input = body as Record<string, unknown>;
  const { data: current, error: fetchError } = await supabase
    .from("TreatmentResult")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) {
    console.error("Error reading treatment result before update:", fetchError);
    return NextResponse.json(
      { success: false, message: "تعذر تحميل نتيجة العلاج." },
      { status: 500 }
    );
  }
  if (!current) {
    return NextResponse.json(
      { success: false, message: "نتيجة العلاج غير موجودة." },
      { status: 404 }
    );
  }

  if (input.revokeConsent === true) {
    const now = new Date().toISOString();
    const { data: revoked, error: updateError } = await supabase
      .from("TreatmentResult")
      .update({
        patientConsent: false,
        isPublished: false,
        consentRevokedAt: now,
        consentRevokedBy: session.userId,
        updatedAt: now,
      })
      .eq("id", id)
      .select("*")
      .single();
    if (updateError) {
      console.error("Error revoking treatment result consent:", updateError);
      return NextResponse.json(
        { success: false, message: "تعذر إيقاف نشر النتيجة بعد سحب الموافقة." },
        { status: 500 }
      );
    }

    const paths = [current.beforeImagePath, current.afterImagePath].filter(
      (path): path is string => Boolean(path)
    );
    if (paths.length > 0) {
      const { error: removeError } = await supabase.storage.from(BUCKET).remove(paths);
      if (removeError) {
        console.error("Consent was revoked, but treatment images could not be removed:", removeError);
        return NextResponse.json(
          {
            success: false,
            message: "تم إيقاف النشر وسحب الموافقة، لكن تعذر حذف الصور من التخزين. أعد المحاولة أو تواصل مع الدعم.",
            treatmentResult: revoked,
          },
          { status: 500 }
        );
      }
    }
    return NextResponse.json({ success: true, treatmentResult: revoked });
  }

  const updates: Database["public"]["Tables"]["TreatmentResult"]["Update"] = {
    updatedAt: new Date().toISOString(),
  };
  if (input.procedure !== undefined) {
    if (
      typeof input.procedure !== "string" ||
      input.procedure.trim().length < 2 ||
      input.procedure.trim().length > 120
    ) {
      return NextResponse.json(
        { success: false, message: "اسم الإجراء غير صالح." },
        { status: 400 }
      );
    }
    updates.procedure = input.procedure.trim();
  }
  if (input.branchName !== undefined) {
    if (
      typeof input.branchName !== "string" ||
      input.branchName.trim().length < 2 ||
      input.branchName.trim().length > 120
    ) {
      return NextResponse.json(
        { success: false, message: "اسم الفرع غير صالح." },
        { status: 400 }
      );
    }
    updates.branchName = input.branchName.trim();
  }
  if (input.displayOrder !== undefined) {
    if (
      typeof input.displayOrder !== "number" ||
      !Number.isInteger(input.displayOrder) ||
      input.displayOrder < 0
    ) {
      return NextResponse.json(
        { success: false, message: "ترتيب العرض غير صالح." },
        { status: 400 }
      );
    }
    updates.displayOrder = input.displayOrder;
  }
  if (input.isPublished !== undefined && typeof input.isPublished !== "boolean") {
    return NextResponse.json(
      { success: false, message: "حالة النشر غير صالحة." },
      { status: 400 }
    );
  }
  if (input.isPublished === true) {
    updates.isPublished = true;
  } else if (input.isPublished === false) {
    updates.isPublished = false;
  }
  if (Object.keys(updates).length === 1) {
    return NextResponse.json(
      { success: false, message: "لم يتم تحديد أي بيانات لتحديثها." },
      { status: 400 }
    );
  }
  if (
    updates.isPublished &&
    (!current.patientConsent || !current.beforeImagePath || !current.afterImagePath)
  ) {
    return NextResponse.json(
      { success: false, message: "لا يمكن نشر نتيجة دون موافقة سارية وصورتي قبل وبعد." },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("TreatmentResult")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    console.error("Error updating treatment result publication:", error);
    return NextResponse.json(
      { success: false, message: "تعذر تحديث حالة النشر." },
      { status: 500 }
    );
  }
  return NextResponse.json({
    success: true,
    treatmentResult: {
      ...data,
      beforeImageUrl: data.beforeImagePath
        ? supabase.storage.from(BUCKET).getPublicUrl(data.beforeImagePath).data.publicUrl
        : null,
      afterImageUrl: data.afterImagePath
        ? supabase.storage.from(BUCKET).getPublicUrl(data.afterImagePath).data.publicUrl
        : null,
    },
  });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;
  const { data: current, error: fetchError } = await supabase
    .from("TreatmentResult")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) {
    console.error("Error reading treatment result before deletion:", fetchError);
    return NextResponse.json(
      { success: false, message: "تعذر تحميل نتيجة العلاج." },
      { status: 500 }
    );
  }
  if (!current) {
    return NextResponse.json(
      { success: false, message: "نتيجة العلاج غير موجودة." },
      { status: 404 }
    );
  }

  const { error: unpublishError } = await supabase
    .from("TreatmentResult")
    .update({ isPublished: false, updatedAt: new Date().toISOString() })
    .eq("id", id);
  if (unpublishError) {
    console.error("Error unpublishing treatment result before deletion:", unpublishError);
    return NextResponse.json(
      { success: false, message: "تعذر إيقاف نشر النتيجة قبل حذفها." },
      { status: 500 }
    );
  }

  const paths = [current.beforeImagePath, current.afterImagePath].filter(
    (path): path is string => Boolean(path)
  );
  if (paths.length > 0) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove(paths);
    if (removeError) {
      console.error("Treatment result was unpublished, but its images could not be removed:", removeError);
      return NextResponse.json(
        { success: false, message: "تم إيقاف النشر، لكن تعذر حذف الصور. أعد المحاولة قبل حذف السجل." },
        { status: 500 }
      );
    }
  }

  const { error: deleteError } = await supabase
    .from("TreatmentResult")
    .delete()
    .eq("id", id);
  if (deleteError) {
    console.error("Treatment images were removed, but the database entry could not be deleted:", deleteError);
    return NextResponse.json(
      { success: false, message: "حُذفت الصور وأوقف النشر، لكن تعذر حذف سجل النتيجة." },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true });
}
