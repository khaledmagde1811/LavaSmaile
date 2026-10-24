import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getCurrentSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const BUCKET = "treatment-results";
const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك برفع صور النتائج" },
      { status: 403 }
    );
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { success: false, message: "يلزم إعداد مفتاح Supabase الخادمي لرفع الصور." },
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
  const contentType =
    body && typeof body === "object" && "contentType" in body
      ? body.contentType
      : null;
  const extension =
    typeof contentType === "string" ? MIME_EXTENSIONS[contentType] : undefined;
  if (!extension) {
    return NextResponse.json(
      { success: false, message: "يسمح فقط بصور JPEG وPNG وWebP." },
      { status: 400 }
    );
  }

  try {
    const path = `${session.userId}/${randomUUID()}.${extension}`;
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);
    if (error) throw error;
    return NextResponse.json({
      success: true,
      path,
      token: data.token,
    });
  } catch (error) {
    console.error("Error creating treatment image upload URL:", error);
    return NextResponse.json(
      { success: false, message: "تعذر تجهيز رفع الصورة. تحقق من إعداد مساحة التخزين." },
      { status: 500 }
    );
  }
}
