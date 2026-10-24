import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { createRecordId, supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

const BUCKET = "treatment-results";
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

type TreatmentResult = Database["public"]["Tables"]["TreatmentResult"]["Row"];

function imageUrl(path: string | null) {
  return path ? supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl : null;
}

function withImageUrls(result: TreatmentResult) {
  return {
    ...result,
    beforeImageUrl: imageUrl(result.beforeImagePath),
    afterImageUrl: imageUrl(result.afterImagePath),
  };
}

function isOwnedImagePath(path: unknown, userId: string): path is string {
  if (typeof path !== "string") return false;
  const [ownerId, filename, ...extra] = path.split("/");
  return (
    ownerId === userId &&
    Boolean(filename) &&
    extra.length === 0 &&
    /^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(filename)
  );
}

async function validateUploadedImage(path: string, userId: string) {
  if (!isOwnedImagePath(path, userId)) return false;
  const separator = path.lastIndexOf("/");
  const folder = path.slice(0, separator);
  const filename = path.slice(separator + 1);
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(folder, { limit: 20, search: filename });
  if (error) throw error;
  const file = data.find((item) => item.name === filename);
  const metadata = file?.metadata;
  return (
    typeof metadata?.mimetype === "string" &&
    ["image/jpeg", "image/png", "image/webp"].includes(metadata.mimetype) &&
    typeof metadata.size === "number" &&
    metadata.size > 0 &&
    metadata.size <= MAX_IMAGE_SIZE
  );
}

export async function GET(request: Request) {
  try {
    const includeUnpublished = new URL(request.url).searchParams.get("all") === "true";
    if (includeUnpublished) {
      const session = await getCurrentSession();
      if (!session || session.role !== "SUPER_ADMIN") {
        return NextResponse.json(
          { success: false, message: "غير مصرح لك بإدارة معرض النتائج" },
          { status: 403 }
        );
      }
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json(
          { success: false, message: "يلزم إعداد مفتاح Supabase الخادمي لإدارة معرض النتائج." },
          { status: 503 }
        );
      }
    }

    let query = supabase
      .from("TreatmentResult")
      .select("*")
      .order("displayOrder", { ascending: true })
      .order("createdAt", { ascending: false });
    if (!includeUnpublished) {
      query = query.eq("isPublished", true).eq("patientConsent", true);
    }
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({
      success: true,
      treatmentResults: includeUnpublished
        ? data.map(withImageUrls)
        : data.map((result) => ({
            id: result.id,
            procedure: result.procedure,
            branchName: result.branchName,
            beforeImageUrl: imageUrl(result.beforeImagePath),
            afterImageUrl: imageUrl(result.afterImagePath),
          })),
    });
  } catch (error) {
    console.error("Error fetching treatment results:", error);
    return NextResponse.json(
      { success: false, message: "تعذر تحميل معرض النتائج حاليًا." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بإضافة نتائج العلاج" },
      { status: 403 }
    );
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { success: false, message: "يلزم إعداد مفتاح Supabase الخادمي لرفع الصور وإدارة المعرض." },
      { status: 503 }
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
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { success: false, message: "بيانات نتيجة العلاج غير صالحة" },
      { status: 400 }
    );
  }

  const input = body as Record<string, unknown>;
  const procedure = typeof input.procedure === "string" ? input.procedure.trim() : "";
  const branchName = typeof input.branchName === "string" ? input.branchName.trim() : "";
  const consentReference =
    typeof input.consentReference === "string" ? input.consentReference.trim() : "";
  const beforeImagePath = input.beforeImagePath;
  const afterImagePath = input.afterImagePath;
  const displayOrder =
    typeof input.displayOrder === "number" && Number.isInteger(input.displayOrder)
      ? input.displayOrder
      : 0;

  if (
    procedure.length < 2 ||
    procedure.length > 120 ||
    branchName.length < 2 ||
    branchName.length > 120 ||
    consentReference.length < 2 ||
    consentReference.length > 120 ||
    input.patientConsent !== true ||
    !isOwnedImagePath(beforeImagePath, session.userId) ||
    !isOwnedImagePath(afterImagePath, session.userId)
  ) {
    return NextResponse.json(
      {
        success: false,
        message: "أدخل الإجراء والفرع ومرجع الموافقة والصورتين، وأكد وجود موافقة المريض.",
      },
      { status: 400 }
    );
  }

  try {
    const validImages = await Promise.all([
      validateUploadedImage(beforeImagePath, session.userId),
      validateUploadedImage(afterImagePath, session.userId),
    ]);
    if (validImages.some((isValid) => !isValid)) {
      return NextResponse.json(
        { success: false, message: "إحدى الصورتين مفقودة أو نوعها أو حجمها غير مسموح." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("TreatmentResult")
      .insert({
        id: createRecordId(),
        procedure,
        branchName,
        consentReference,
        beforeImagePath,
        afterImagePath,
        patientConsent: true,
        consentConfirmedAt: now,
        consentConfirmedBy: session.userId,
        isPublished: false,
        displayOrder,
        updatedAt: now,
      })
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json(
      { success: true, treatmentResult: withImageUrls(data) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating treatment result:", error);
    return NextResponse.json(
      { success: false, message: "تعذر حفظ نتيجة العلاج." },
      { status: 500 }
    );
  }
}
