import { NextResponse } from "next/server";
import { createRecordId, supabase } from "@/lib/supabase";
import { COOKIE_NAME, getCurrentSession, signSessionToken, type SessionPayload } from "@/lib/auth";
import bcrypt from "bcryptjs";

const userRoles = ["SUPER_ADMIN", "BRANCH_ADMIN", "DOCTOR", "RECEPTIONIST"] as const;
type UserRole = (typeof userRoles)[number];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && userRoles.some((role) => role === value);
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بتعديل بيانات المستخدمين" },
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
  if (!isRecord(body)) {
    return NextResponse.json(
      { success: false, message: "بيانات المستخدم غير صالحة" },
      { status: 400 }
    );
  }

const allowedFields = new Set(["name", "email", "role", "branchId", "doctorId", "specialty", "password"]);  const fields = Object.keys(body);
  if (fields.length === 0 || fields.some((field) => !allowedFields.has(field))) {
    return NextResponse.json(
      { success: false, message: "بيانات المستخدم تحتوي على حقول غير صالحة" },
      { status: 400 }
    );
  }

  const { id } = await params;
  let createdDoctorId: string | null = null;
  let pendingDoctorSpecialty: string | null = null;
  try {
    const { data: existing, error: existingError } = await supabase
      .from("User")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (existingError) throw existingError;
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    const dataToUpdate: {
      name?: string;
      email?: string;
      role?: UserRole;
      branchId?: string | null;
      doctorId?: string | null;
      password?: string;
      updatedAt?: string;
    } = {};

    if ("name" in body) {
      if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 120) {
        return NextResponse.json(
          { success: false, message: "الاسم مطلوب وبحد أقصى 120 حرفاً" },
          { status: 400 }
        );
      }
      dataToUpdate.name = body.name.trim();
    }

    if ("email" in body) {
      if (
        typeof body.email !== "string" ||
        body.email.trim().length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())
      ) {
        return NextResponse.json(
          { success: false, message: "البريد الإلكتروني غير صالح" },
          { status: 400 }
        );
      }
      dataToUpdate.email = body.email.trim().toLowerCase();
    }

    if ("role" in body) {
      if (!isUserRole(body.role)) {
        return NextResponse.json(
          { success: false, message: "الصلاحية المحددة غير صالحة" },
          { status: 400 }
        );
      }
      dataToUpdate.role = body.role;
    }

    if ("branchId" in body) {
      if (body.branchId !== null && typeof body.branchId !== "string") {
        return NextResponse.json(
          { success: false, message: "الفرع المحدد غير صالح" },
          { status: 400 }
        );
      }
      const branchId = typeof body.branchId === "string" ? body.branchId.trim() : "";
      if (branchId) {
        const { data: branch, error: branchError } = await supabase
          .from("Branch")
          .select("id")
          .eq("id", branchId)
          .maybeSingle();
        if (branchError) throw branchError;
        if (!branch) {
          return NextResponse.json(
            { success: false, message: "الفرع المحدد غير موجود" },
            { status: 400 }
          );
        }
      }
      dataToUpdate.branchId = branchId || null;
    }

    const effectiveRole = dataToUpdate.role ?? existing.role;
    const effectiveBranchId = "branchId" in dataToUpdate
      ? dataToUpdate.branchId ?? null
      : existing.branchId;
    if (effectiveRole !== "SUPER_ADMIN" && !effectiveBranchId) {
      return NextResponse.json(
        { success: false, message: "يجب تحديد فرع لكل حساب موظف" },
        { status: 400 }
      );
    }
    if (effectiveRole !== "DOCTOR") {
      if ("doctorId" in body && body.doctorId !== null && body.doctorId !== "") {
        return NextResponse.json(
          { success: false, message: "ربط سجل طبيب مسموح لحساب الطبيب فقط" },
          { status: 400 }
        );
      }
      dataToUpdate.doctorId = null;
} else {
  if (!effectiveBranchId) {
    return NextResponse.json(
      { success: false, message: "يجب تحديد فرع للطبيب" },
      { status: 400 }
    );
  }
  const rawDoctorId = "doctorId" in body ? body.doctorId : existing.doctorId;
  const candidateDoctorId =
    typeof rawDoctorId === "string" ? rawDoctorId.trim() : "";

  if (candidateDoctorId) {
    // ربط بسجل طبيب موجود
    const { data: doctor, error: doctorError } = await supabase
      .from("Doctor")
      .select("id")
      .eq("id", candidateDoctorId)
      .eq("branchId", effectiveBranchId)
      .maybeSingle();
    if (doctorError) throw doctorError;
    if (!doctor) {
      return NextResponse.json(
        { success: false, message: "الطبيب المحدد غير موجود في الفرع المختار" },
        { status: 400 }
      );
    }
    dataToUpdate.doctorId = candidateDoctorId;
  } else {
    // مفيش سجل: هننشئه تلقائيًا من التخصص
    const specialty =
      typeof body.specialty === "string" ? body.specialty.trim() : "";
    if (!specialty || specialty.length > 120) {
      return NextResponse.json(
        { success: false, message: "يجب إدخال تخصص الطبيب (بحد أقصى 120 حرفاً)" },
        { status: 400 }
      );
    }
    pendingDoctorSpecialty = specialty;
  }
}

    if ("password" in body) {
      if (typeof body.password !== "string" || !body.password.trim()) {
        return NextResponse.json(
          { success: false, message: "كلمة المرور غير صالحة" },
          { status: 400 }
        );
      }
      dataToUpdate.password = await bcrypt.hash(body.password.trim(), 10);
    }
    dataToUpdate.updatedAt = new Date().toISOString();

    const email = dataToUpdate.email ?? existing.email;
    if (email !== existing.email) {
      const { data: duplicate, error: duplicateError } = await supabase
        .from("User")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (duplicateError) throw duplicateError;
      if (duplicate && duplicate.id !== id) {
        return NextResponse.json(
          { success: false, message: "هذا البريد الإلكتروني مسجل بالفعل لمستخدم آخر" },
          { status: 409 }
        );
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from("User")
      .update(dataToUpdate)
      .eq("id", id)
      .select("id, name, email, role, branchId, doctorId")
      .single();
   if (updateError) {
  if (createdDoctorId) {
    await supabase.from("Doctor").delete().eq("id", createdDoctorId);
  }
  throw updateError;
}

    let branch = null;
    if (updated.branchId) {
      const { data, error } = await supabase
        .from("Branch")
        .select("id, name, city")
        .eq("id", updated.branchId)
        .maybeSingle();
      if (error) throw error;
      branch = data;
    }
if (pendingDoctorSpecialty && effectiveBranchId) {
  const { data: newDoctor, error: doctorInsertError } = await supabase
    .from("Doctor")
    .insert({
      id: createRecordId(),
      updatedAt: new Date().toISOString(),
      name: dataToUpdate.name ?? existing.name,
      specialty: pendingDoctorSpecialty,
      branchId: effectiveBranchId,
    })
    .select("id")
    .single();
  if (doctorInsertError) throw doctorInsertError;
  createdDoctorId = newDoctor.id;
  dataToUpdate.doctorId = newDoctor.id;
}
    const response = NextResponse.json({
      success: true,
      message: "تم تحديث بيانات المستخدم وصلاحياته بنجاح",
      user: { ...updated, branch },
    });

    if (id === session.userId) {
      const updatedSession: SessionPayload = {
        ...session,
        name: updated.name,
        email: updated.email,
        role: dataToUpdate.role ?? session.role,
        branchId: updated.branchId,
        branchName: branch?.name ?? null,
        doctorId: updated.doctorId,
      };
      const token = await signSessionToken(updatedSession);
      response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    }
    
    

    return response;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { success: false, message: "هذا البريد الإلكتروني مسجل بالفعل لمستخدم آخر" },
        { status: 409 }
      );
    }
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, message: "فشل تحديث المستخدم" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "غير مصرح لك بحذف المستخدمين" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // منع الأدمن من حذف حسابه الشخصي الذي سجل الدخول به
    if (id === session.userId) {
      return NextResponse.json(
        { success: false, message: "لا يمكنك حذف حسابك الشخصي المتصل به حالياً!" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("User")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) throw error;
    if (!data.length) {
      return NextResponse.json(
        { success: false, message: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "تم حذف المستخدم بنجاح من النظام",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { success: false, message: "فشل حذف المستخدم" },
      { status: 500 }
    );
  }
}
