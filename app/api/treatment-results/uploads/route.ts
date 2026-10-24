import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const BUCKET = "treatment-results";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بإدارة صور النتائج" },
      { status: 403 }
    );
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { success: false, message: "يلزم إعداد مفتاح Supabase الخادمي لإدارة الصور." },
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
  const paths =
    body && typeof body === "object" && "paths" in body && Array.isArray(body.paths)
      ? body.paths
      : [];
  if (
    paths.length === 0 ||
    paths.length > 2 ||
    paths.some(
      (path) =>
        typeof path !== "string" ||
        !path.startsWith(`${session.userId}/`) ||
        !/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(path.slice(session.userId.length + 1))
    )
  ) {
    return NextResponse.json(
      { success: false, message: "مسارات الصور المطلوب حذفها غير صالحة." },
      { status: 400 }
    );
  }

  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) {
    console.error("Error cleaning up unlinked treatment images:", error);
    return NextResponse.json(
      { success: false, message: "تعذر تنظيف الصور غير المرتبطة بسجل." },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true });
}
