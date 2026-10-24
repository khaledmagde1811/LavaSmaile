import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCurrentSession } from "@/lib/auth";


export async function GET(request: Request) {
  try {
    const session = await getCurrentSession();
    if (
      !session ||
      !["SUPER_ADMIN", "BRANCH_ADMIN", "RECEPTIONIST", "DOCTOR"].includes(session.role)
    ) {
      return NextResponse.json(
        { success: false, message: "غير مصرح" },
        { status: 403 }
      );
    }
    if (session.role === "DOCTOR" && (!session.branchId || !session.doctorId)) {
      return NextResponse.json(
        { success: false, message: "حساب الطبيب غير مرتبط بسجل طبيب وفرع" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("phone") ?? searchParams.get("search");
    let patientIds: string[] | null = null;
    if (session.role !== "SUPER_ADMIN") {
      if (!session.branchId) {
        return NextResponse.json(
          { success: false, message: "لا يوجد فرع مرتبط بحسابك" },
          { status: 403 }
        );
      }
      let appointmentsQuery = supabase
        .from("Appointment")
        .select("patientId")
        .eq("branchId", session.branchId);
      if (session.role === "DOCTOR") {
        appointmentsQuery = appointmentsQuery.eq("doctorId", session.doctorId!);
      }
      const { data: appointments, error: appointmentsError } = await appointmentsQuery;
      if (appointmentsError) throw appointmentsError;
      patientIds = [...new Set((appointments ?? []).map(({ patientId }) => patientId))];
      if (patientIds.length === 0) {
        return NextResponse.json({ success: true, patients: [] });
      }
    }

    let query = supabase
      .from("Patient")
      .select("id, fullName, phone, secondaryPhone, email, address, nationalId, birthDate, gender, chronicDiseases, allergies, notes, createdAt, updatedAt, appointments:Appointment(*, branch:Branch(*), service:Service(*), doctor:Doctor(*)), followUps:FollowUp(*, branch:Branch(*))")
      .order("createdAt", { ascending: false });
    if (patientIds) query = query.in("id", patientIds);
    if (search?.trim()) {
      const term = search.trim().replace(/[,%()_*]/g, "");
      if (term) {
        query = query.or(
          `fullName.ilike.%${term}%,phone.ilike.%${term}%,secondaryPhone.ilike.%${term}%,nationalId.ilike.%${term}%`
        );
      }
    }
    const { data: patients, error } = await query;
    if (error) throw error;

    for (const patient of patients ?? []) {
      if (session.role !== "SUPER_ADMIN") {
        patient.appointments = (patient.appointments ?? []).filter(
          (appointment) => appointment.branchId === session.branchId &&
            (session.role !== "DOCTOR" || appointment.doctorId === session.doctorId)
        );
        patient.followUps = (patient.followUps ?? []).filter((followUp) => {
          if (followUp.branchId !== session.branchId) return false;
          if (session.role !== "DOCTOR") return true;
          return followUp.doctorId === session.doctorId ||
            patient.appointments.some((appointment) => appointment.id === followUp.appointmentId);
        });
      }
      patient.appointments?.sort((a, b) => b.appointmentDate.localeCompare(a.appointmentDate));
      patient.followUps?.sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate));
    }

    return NextResponse.json({ success: true, patients: patients ?? [] });
  } catch (error) {
    unstable_rethrow(error);
    console.error("Error fetching patients:", error);
    return NextResponse.json(
      { success: false, message: "فشل استرجاع سجلات المرضى" },
      { status: 500 }
    );
  }
}
