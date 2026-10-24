type Relationship<
  ForeignKey extends string = string,
  ReferencedRelation extends string = string,
  Column extends string = string,
  ReferencedColumn extends string = string,
  IsOneToOne extends boolean = false,
> = {
  foreignKeyName: ForeignKey;
  columns: [Column];
  isOneToOne: IsOneToOne;
  referencedRelation: ReferencedRelation;
  referencedColumns: [ReferencedColumn];
};

type Table<
  Row,
  Required extends keyof Row = never,
  Relationships extends Relationship<string, string, string, string, boolean>[] = [],
> = {
  Row: Row;
  Insert: Pick<Row, Required> & Partial<Omit<Row, Required>>;
  Update: Partial<Row>;
  Relationships: Relationships;
};

type Branch = {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  workingHours: string;
  mapUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  branchId: string | null;
  doctorId: string | null;
  createdAt: string;
  updatedAt: string;
};

type Doctor = {
  id: string;
  name: string;
  specialty: string;
  phone: string | null;
  email: string | null;
  workingDays: string | null;
  branchId: string;
  createdAt: string;
  updatedAt: string;
};

type Patient = {
  id: string;
  fullName: string;
  phone: string;
  secondaryPhone: string | null;
  email: string | null;
  password: string | null;
  address: string | null;
  nationalId: string | null;
  birthDate: string | null;
  gender: string | null;
  chronicDiseases: string | null;
  allergies: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type Service = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  isActive: boolean;
  durationMinutes: number;
  createdAt: string;
  updatedAt: string;
};

type MedicalSolution = {
  id: string;
  titleAr: string;
  titleEn: string | null;
  slug: string;
  shortDescription: string;
  content: string | null;
  price: number | null;
  icon: string | null;
  imageUrl: string | null;
  category: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

type Offer = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  originalPrice: number | null;
  discountPrice: number;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  showOnHome: boolean;
  displayOrder: number;
  serviceId: string | null;
  createdAt: string;
  updatedAt: string;
};

type Appointment = {
  id: string;
  branchId: string;
  patientId: string;
  doctorId: string | null;
  serviceId: string | null;
  medicalSolutionId: string | null;
  offerId: string | null;
  offerTitle: string | null;
  offerPrice: number | null;
  bookingType: string;
  bookingTitle: string | null;
  bookingPrice: number | null;
  appointmentDate: string;
  status: string;
  noteType: string;
  patientComplaint: string | null;
  patientSuggestion: string | null;
  painLocation: string | null;
  createdAt: string;
  updatedAt: string;
};

type MedicalRecord = {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  diagnosis: string;
  treatmentPerformed: string;
  dentalChart: string | null;
  xrays: string | null;
  createdAt: string;
  updatedAt: string;
};

type FollowUp = {
  id: string;
  patientId: string;
  branchId: string;
  doctorId: string | null;
  appointmentId: string | null;
  scheduledDate: string;
  followUpType: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type TreatmentResult = {
  id: string;
  procedure: string;
  branchName: string;
  beforeImagePath: string | null;
  afterImagePath: string | null;
  patientConsent: boolean;
  consentReference: string;
  consentConfirmedAt: string | null;
  consentConfirmedBy: string | null;
  consentRevokedAt: string | null;
  consentRevokedBy: string | null;
  isPublished: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type Database = {
  public: {
    Tables: {
      Branch: Table<Branch, "name" | "city" | "address" | "phone" | "workingHours">;
      User: Table<
        User,
        "name" | "email" | "password",
        [
          Relationship<"User_branchId_fkey", "Branch", "branchId", "id">,
          Relationship<"User_doctorId_fkey", "Doctor", "doctorId", "id", true>
        ]
      >;
      Doctor: Table<
        Doctor,
        "name" | "specialty" | "branchId",
        [Relationship<"Doctor_branchId_fkey", "Branch", "branchId", "id">]
      >;
      Patient: Table<Patient, "fullName" | "phone">;
      Service: Table<Service, "name" | "price">;
      MedicalSolution: Table<MedicalSolution, "titleAr" | "slug" | "shortDescription">;
      Offer: Table<
        Offer,
        "title" | "discountPrice",
        [Relationship<"Offer_serviceId_fkey", "Service", "serviceId", "id">]
      >;
      Appointment: Table<
        Appointment,
        "branchId" | "patientId" | "appointmentDate",
        [
          Relationship<"Appointment_branchId_fkey", "Branch", "branchId", "id">,
          Relationship<"Appointment_patientId_fkey", "Patient", "patientId", "id">,
          Relationship<"Appointment_doctorId_fkey", "Doctor", "doctorId", "id">,
          Relationship<"Appointment_serviceId_fkey", "Service", "serviceId", "id">,
          Relationship<"Appointment_medicalSolutionId_fkey", "MedicalSolution", "medicalSolutionId", "id">
        ]
      >;
      MedicalRecord: Table<
        MedicalRecord,
        "appointmentId" | "patientId" | "doctorId" | "diagnosis" | "treatmentPerformed",
        [
          Relationship<"MedicalRecord_appointmentId_fkey", "Appointment", "appointmentId", "id">,
          Relationship<"MedicalRecord_patientId_fkey", "Patient", "patientId", "id">,
          Relationship<"MedicalRecord_doctorId_fkey", "Doctor", "doctorId", "id">
        ]
      >;
      FollowUp: Table<
        FollowUp,
        "patientId" | "branchId" | "scheduledDate" | "followUpType",
        [
          Relationship<"FollowUp_patientId_fkey", "Patient", "patientId", "id">,
          Relationship<"FollowUp_branchId_fkey", "Branch", "branchId", "id">,
          Relationship<"FollowUp_doctorId_fkey", "Doctor", "doctorId", "id">,
          Relationship<"FollowUp_appointmentId_fkey", "Appointment", "appointmentId", "id">
        ]
      >;
      TreatmentResult: Table<
        TreatmentResult,
        "procedure" | "branchName" | "consentReference",
        []
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
