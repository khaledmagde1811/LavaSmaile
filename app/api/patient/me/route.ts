import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCurrentSession } from "@/lib/auth";


export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session || session.role !== "PATIENT") {
      return NextResponse.json(
        { success: false, message: "غير مصرح" },
        { status: 401 }
      );
    }

    const { data: patient, error } = await supabase
      .from("Patient")
      .select("id, fullName, phone, secondaryPhone, email, address, nationalId, birthDate, gender, chronicDiseases, allergies, notes, createdAt, updatedAt, appointments:Appointment(*, branch:Branch(*), service:Service(*), medicalSolution:MedicalSolution(*), doctor:Doctor(*)), followUps:FollowUp(*, branch:Branch(*), doctor:Doctor(*))")
      .eq("id", session.userId)
      .order("appointmentDate", { referencedTable: "Appointment", ascending: false })
      .order("scheduledDate", { referencedTable: "FollowUp", ascending: true })
      .maybeSingle();
    if (error) throw error;

    if (!patient) {
      return NextResponse.json(
        { success: false, message: "لم يتم العثور على سجل المريض" },
        { status: 404 }
      );
    }

    const { data: medicalRecords, error: medicalRecordsError } = await supabase
      .from("MedicalRecord")
      .select("id, appointmentId, diagnosis, treatmentPerformed, createdAt, doctor:Doctor(name), appointment:Appointment(id, appointmentDate, branch:Branch(name))")
      .eq("patientId", session.userId)
      .order("createdAt", { ascending: false });
    if (medicalRecordsError) throw medicalRecordsError;

    return NextResponse.json({ success: true, patient: { ...patient, medicalRecords } });
  } catch (error) {
    unstable_rethrow(error);
    console.error("Patient profile error:", error);
    return NextResponse.json(
      { success: false, message: "فشل تحميل بيانات المريض" },
      { status: 500 }
    );
  }
}
