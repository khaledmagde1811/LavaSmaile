import { NextResponse } from "next/server";
import { createRecordId, supabase } from "@/lib/supabase";
import { getCurrentSession } from "@/lib/auth";
import bcrypt from "bcryptjs";


export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "غير مصرح لك باستعراض قائمة المستخدمين" },
        { status: 403 }
      );
    }

    const { data: users, error } = await supabase
      .from("User")
      .select("id, name, email, role, branchId, doctorId, branch:Branch(id, name, city), createdAt")
      .order("createdAt", { ascending: false });
    if (error) throw error;

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, message: "فشل استرجاع قائمة المستخدمين" },
      { status: 500 }
    );
  }
}


export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "غير مصرح لك بإضافة مستخدمين جدد (مطلوب صلاحية المدير العام)" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, password, role, branchId, doctorId, specialty } = body;
    const validRoles = ["SUPER_ADMIN", "BRANCH_ADMIN", "DOCTOR", "RECEPTIONIST"];

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof password !== "string" ||
      !password.trim() ||
      typeof role !== "string" ||
      !validRoles.includes(role)
    ) {
      return NextResponse.json(
        { success: false, message: "يرجى إدخال بيانات مستخدم صالحة وكاملة" },
        { status: 400 }
      );
    }
    const normalizedBranchId = typeof branchId === "string" && branchId.trim()
      ? branchId.trim()
      : null;
    if (role !== "SUPER_ADMIN" && !normalizedBranchId) {
      return NextResponse.json(
        { success: false, message: "يجب تحديد فرع لكل حساب موظف" },
        { status: 400 }
      );
    }
    if (normalizedBranchId) {
      const { data: branch, error: branchError } = await supabase
        .from("Branch")
        .select("id")
        .eq("id", normalizedBranchId)
        .maybeSingle();
      if (branchError) throw branchError;
      if (!branch) {
        return NextResponse.json(
          { success: false, message: "الفرع المحدد غير موجود" },
          { status: 400 }
        );
      }
    }
let normalizedDoctorId: string | null = null;
let createdDoctorId: string | null = null;
const normalizedSpecialty = typeof specialty === "string" ? specialty.trim() : "";

if (role === "DOCTOR") {
  if (!normalizedBranchId) {
    return NextResponse.json(
      { success: false, message: "يجب تحديد فرع للطبيب" },
      { status: 400 }
    );
  }

  if (typeof doctorId === "string" && doctorId.trim()) {
    // ربط بسجل طبيب موجود (اختياري)
    normalizedDoctorId = doctorId.trim();
    const { data: doctor, error: doctorError } = await supabase
      .from("Doctor")
      .select("id")
      .eq("id", normalizedDoctorId)
      .eq("branchId", normalizedBranchId)
      .maybeSingle();
    if (doctorError) throw doctorError;
    if (!doctor) {
      return NextResponse.json(
        { success: false, message: "الطبيب المحدد غير موجود في الفرع المختار" },
        { status: 400 }
      );
    }
  } else if (!normalizedSpecialty) {
    return NextResponse.json(
      { success: false, message: "يجب إدخال تخصص الطبيب" },
      { status: 400 }
    );
  }
}

    // التحقق من تكرار البريد
    const { data: existing, error: existingError } = await supabase
      .from("User")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();
    if (existingError) throw existingError;

    if (existing) {
      return NextResponse.json(
        { success: false, message: "هذا البريد الإلكتروني مسجل بالفعل لمستخدم آخر" },
        { status: 400 }
      );
    }

    // تشفير كلمة المرور بـ Bcrypt
    const hashedPassword = bcrypt.hashSync(password.trim(), 10);
// إنشاء سجل الطبيب تلقائيًا
if (role === "DOCTOR" && !normalizedDoctorId) {
  if (!normalizedBranchId) {
    return NextResponse.json(
      { success: false, message: "يجب تحديد فرع للطبيب" },
      { status: 400 }
    );
  }

  const { data: newDoctor, error: doctorInsertError } = await supabase
    .from("Doctor")
    .insert({
      id: createRecordId(),
      updatedAt: new Date().toISOString(),
      name: name.trim(),
      specialty: normalizedSpecialty,
      branchId: normalizedBranchId,
    })
    .select("id")
    .single();
  if (doctorInsertError) throw doctorInsertError;
  normalizedDoctorId = newDoctor.id;
  createdDoctorId = newDoctor.id;
}
    const { data: user, error } = await supabase
      .from("User")
      .insert({
        id: createRecordId(),
        updatedAt: new Date().toISOString(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role,
        branchId: normalizedBranchId,
        doctorId: normalizedDoctorId,
      })
      .select("id, name, email, role, branchId, doctorId, branch:Branch(id, name)")
      .single();
if (error) {
  if (createdDoctorId) {
    await supabase.from("Doctor").delete().eq("id", createdDoctorId);
  }
  throw error;
}

    return NextResponse.json({
      success: true,
      message: "تم إنشاء حساب المستخدم بنجاح وتعيين صلاحياته",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
        doctorId: user.doctorId,
        branch: user.branch,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { success: false, message: "فشل إنشاء المستخدم" },
      { status: 500 }
    );
  }
}
