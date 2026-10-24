"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  Phone,
  User,
  Shield,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lightbulb,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Home,
  ChevronDown,
  ArrowRight,
  TrendingUp,
  Activity,
  Stethoscope,
  Smile,
  FileText,
  BadgeCheck,
  LogOut,
  ShieldAlert,
  Users,
  Building,
  ExternalLink,
  Trash2,
  Edit,
  KeyRound,
  FileBarChart2,
  MessageCircle,
  HeartPulse,
  History,
  Crown,
  Building2,
  Hourglass,
  CircleCheck,
  CircleX,
  Gift,
  UserRound,
  AlertTriangle,
  X,
} from "lucide-react";
import Logo from "@/components/Logo";
import BrandLoader, { LoadingIndicator } from "@/components/BrandLoader";

interface Branch {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  workingHours: string;
  mapUrl?: string | null;
  doctors?: { id: string; name: string; specialty: string }[];
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "BRANCH_ADMIN" | "DOCTOR" | "RECEPTIONIST";
  branchId?: string | null;
  doctorId?: string | null;
  branch?: {
    id: string;
    name: string;
    city?: string;
  } | null;
  createdAt: string;
}

interface Patient {
  id: string;
  fullName: string;
  phone: string;
  secondaryPhone: string | null;
  email: string | null;
  address: string | null;
  nationalId: string | null;
  chronicDiseases?: string | null;
  allergies?: string | null;
  notes?: string | null;
  appointments?: Appointment[];
  followUps?: FollowUp[];
}

interface Appointment {
  id: string;
  branchId: string;
  branch: Branch;
  patientId: string;
  patient: Patient;
  serviceId: string | null;
  service: { id: string; name: string; price: number } | null;
  medicalSolutionId: string | null;
  medicalSolution: { id: string; titleAr: string } | null;
  offerId: string | null;
  offerTitle: string | null;
  offerPrice: number | null;
  bookingType: string;
  bookingTitle: string | null;
  bookingPrice: number | null;
  doctorId: string | null;
  doctor: { id: string; name: string; specialty: string } | null;
  appointmentDate: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  noteType: "COMPLAINT" | "SUGGESTION" | "INQUIRY";
  patientComplaint: string | null;
  patientSuggestion: string | null;
  painLocation: string | null;
  createdAt: string;
}

interface FollowUp {
  id: string;
  patientId: string;
  patient: Patient;
  branchId: string;
  branch: Branch;
  scheduledDate: string;
  followUpType: string;
  status: "SCHEDULED" | "COMPLETED" | "MISSED" | "CANCELLED";
  notes: string | null;
}

function isUserRole(value: string): value is UserItem["role"] {
  return ["SUPER_ADMIN", "BRANCH_ADMIN", "DOCTOR", "RECEPTIONIST"].includes(value);
}

interface CurrentUser {
  userId: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "BRANCH_ADMIN" | "DOCTOR" | "RECEPTIONIST";
  branchId?: string | null;
  branchName?: string | null;
  doctorId?: string | null;
}

function normalizePhoneSearch(value: string) {
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  return value
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/\D/g, "");
}

function phoneMatchesSearch(phone: string | null | undefined, query: string) {
  const normalizedPhone = normalizePhoneSearch(phone ?? "");
  const normalizedQuery = normalizePhoneSearch(query);
  return normalizedQuery.length > 0 && normalizedPhone.includes(normalizedQuery);
}

export default function AdminDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Tabs
  const [selectedBranchId, setSelectedBranchId] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"APPOINTMENTS" | "PATIENTS" | "FOLLOWUPS" | "BRANCHES" | "USERS">("APPOINTMENTS");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [noteTypeFilter, setNoteTypeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [patientSearchQuery, setPatientSearchQuery] = useState("");

  // Modal State for scheduling follow-up
  const [modalOpen, setModalOpen] = useState(false);
  const [activeAppointmentForFollowUp, setActiveAppointmentForFollowUp] = useState<Appointment | null>(null);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpType, setFollowUpType] = useState("فحص ما بعد العلاج وتغيير الضماد");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [savingFollowUp, setSavingFollowUp] = useState(false);

  // Modal State for Patient Full Profile View
  const [selectedPatientForModal, setSelectedPatientForModal] = useState<Patient | null>(null);

  // Modal State for Resetting User Password
  const [passwordModalUser, setPasswordModalUser] = useState<UserItem | null>(null);
  const [newPasswordForUser, setNewPasswordForUser] = useState("");
  const [savingNewPassword, setSavingNewPassword] = useState(false);
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState("");

  // Modal State for Adding Branch
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchCity, setNewBranchCity] = useState("القاهرة");
  const [newBranchAddress, setNewBranchAddress] = useState("");
  const [newBranchPhone, setNewBranchPhone] = useState("");
  const [newBranchHours, setNewBranchHours] = useState("10:00 ص - 10:00 م");
  const [newBranchMapUrl, setNewBranchMapUrl] = useState("");
  const [savingBranch, setSavingBranch] = useState(false);
  const [editUserSpecialty, setEditUserSpecialty] = useState("");
  // Modal State for Adding User
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserRole, setEditUserRole] = useState<UserItem["role"]>("RECEPTIONIST");
  const [editUserBranchId, setEditUserBranchId] = useState("");
  const [editUserDoctorId, setEditUserDoctorId] = useState("");
  const [savingUserEdit, setSavingUserEdit] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"SUPER_ADMIN" | "BRANCH_ADMIN" | "RECEPTIONIST" | "DOCTOR">("RECEPTIONIST");
  const [newUserBranchId, setNewUserBranchId] = useState("");
  const [newUserDoctorId, setNewUserDoctorId] = useState("");
  const [savingUser, setSavingUser] = useState(false);
  const [userModalError, setUserModalError] = useState("");


  const [newUserSpecialty, setNewUserSpecialty] = useState("");
  // Load User Info
  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
          if (data.user.role !== "SUPER_ADMIN" && data.user.branchId) {
            setSelectedBranchId(data.user.branchId);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user session:", err);
      }
    }
    fetchMe();
  }, []);

  const fetchAllData = async () => {
    const [branchesRes, appointmentsRes, followUpsRes, patientsRes] = await Promise.all([
      fetch("/api/branches"),
      fetch(`/api/appointments?branchId=${selectedBranchId}`),
      fetch(`/api/follow-ups?branchId=${selectedBranchId}`),
      fetch("/api/patients"),
    ]);
    const [branchesData, appointmentsData, followUpsData, patientsData] = await Promise.all([
      branchesRes.json(),
      appointmentsRes.json(),
      followUpsRes.json(),
      patientsRes.json(),
    ]);
    let usersData = null;
    if (currentUser?.role === "SUPER_ADMIN" || !currentUser) {
      const usersResponse = await fetch("/api/users");
      usersData = await usersResponse.json();
    }
    return { branchesData, appointmentsData, followUpsData, patientsData, usersData };
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const data = await fetchAllData();
      if (data.branchesData.success) setBranches(data.branchesData.branches);
      if (data.appointmentsData.success) setAppointments(data.appointmentsData.appointments);
      if (data.followUpsData.success) setFollowUps(data.followUpsData.followUps);
      if (data.patientsData.success) setPatientsList(data.patientsData.patients);
      if (data.usersData?.success) setUsersList(data.usersData.users);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;
    fetchAllData()
      .then((data) => {
        if (!isActive) return;
        if (data.branchesData.success) setBranches(data.branchesData.branches);
        if (data.appointmentsData.success) setAppointments(data.appointmentsData.appointments);
        if (data.followUpsData.success) setFollowUps(data.followUpsData.followUps);
        if (data.patientsData.success) setPatientsList(data.patientsData.patients);
        if (data.usersData?.success) setUsersList(data.usersData.users);
      })
      .catch((err: unknown) => {
        console.error("Failed to load dashboard data:", err);
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [selectedBranchId, currentUser]);

  // Logout Handler
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  // Update appointment status
  const updateAppointmentStatus = async (id: string, newStatus: Appointment["status"]) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setAppointments((prev) =>
          prev.map((apt) => (apt.id === id ? { ...apt, status: newStatus } : apt))
        );
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  // Update follow-up status
  const updateFollowUpStatus = async (id: string, newStatus: FollowUp["status"]) => {
    try {
      const res = await fetch(`/api/follow-ups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setFollowUps((prev) =>
          prev.map((f) => (f.id === id ? { ...f, status: newStatus } : f))
        );
      }
    } catch (err) {
      console.error("Error updating follow-up:", err);
    }
  };

  // Submit new follow-up
  const handleCreateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAppointmentForFollowUp || !followUpDate) return;

    setSavingFollowUp(true);
    try {
      const res = await fetch("/api/follow-ups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: activeAppointmentForFollowUp.patientId,
          branchId: activeAppointmentForFollowUp.branchId,
          doctorId: activeAppointmentForFollowUp.doctorId,
          appointmentId: activeAppointmentForFollowUp.id,
          scheduledDate: followUpDate,
          followUpType,
          notes: followUpNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFollowUps((prev) => [data.followUp, ...prev]);
        setModalOpen(false);
        setActiveAppointmentForFollowUp(null);
        setFollowUpNotes("");
      }
    } catch (err) {
      console.error("Error scheduling follow-up:", err);
    } finally {
      setSavingFollowUp(false);
    }
  };

  // Handle Add Branch
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName || !newBranchAddress || !newBranchPhone) return;

    setSavingBranch(true);
    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newBranchName,
          city: newBranchCity,
          address: newBranchAddress,
          phone: newBranchPhone,
          workingHours: newBranchHours,
          mapUrl: newBranchMapUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setBranches((prev) => [...prev, data.branch]);
        setBranchModalOpen(false);
        setNewBranchName("");
        setNewBranchAddress("");
        setNewBranchPhone("");
        setNewBranchMapUrl("");
      } else {
        alert(data.message || "حدث خطأ أثناء إضافة الفرع");
      }
    } catch (err) {
      console.error("Error creating branch:", err);
    } finally {
      setSavingBranch(false);
    }
  };

  // Delete Branch
  const handleDeleteBranch = async (branchId: string, branchName: string) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف ${branchName}؟`)) return;
    try {
      const res = await fetch(`/api/branches/${branchId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setBranches((prev) => prev.filter((b) => b.id !== branchId));
      } else {
        alert(data.message || "فشل حذف الفرع");
      }
    } catch (err) {
      console.error("Error deleting branch:", err);
    }
  };

  // Handle Add User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserModalError("");
    setSavingUser(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
         name: newUserName,
  email: newUserEmail,
  password: newUserPassword,
  role: newUserRole,
  branchId: newUserBranchId || null,
  specialty: newUserRole === "DOCTOR" ? newUserSpecialty : null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "فشل إنشاء المستخدم");
      }

      setUsersList((prev) => [data.user, ...prev]);
      setUserModalOpen(false);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserBranchId("");
      setNewUserDoctorId("");
    } catch (err: unknown) {
      setUserModalError(
        err instanceof Error ? err.message : "حدث خطأ أثناء إضافة المستخدم"
      );
    } finally {
      setSavingUser(false);
    }
  };

  const openEditUserModal = (user: UserItem) => {
    setEditingUser(user);
    setEditUserName(user.name);
    setEditUserEmail(user.email);
    setEditUserRole(user.role);
    setEditUserBranchId(user.branchId ?? "");
    setEditUserDoctorId(user.doctorId ?? "");
    setUserModalError("");
    setEditUserSpecialty("");
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setUserModalError("");
    setSavingUserEdit(true);
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editUserName,
          email: editUserEmail,
          role: editUserRole,
          branchId: editUserBranchId || null,
          doctorId:
            editUserRole === "DOCTOR" ? (editingUser.doctorId ?? null) : null,
          specialty:
            editUserRole === "DOCTOR" && !editingUser.doctorId
              ? editUserSpecialty
              : null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "فشل تحديث بيانات المستخدم");
      }

      setUsersList((current) =>
        current.map((user) => user.id === data.user.id ? data.user : user)
      );
      if (currentUser?.userId === data.user.id) {
        setCurrentUser((current) =>
          current
            ? {
              ...current,
              name: data.user.name,
              email: data.user.email,
              role: data.user.role,
              branchId: data.user.branchId,
              branchName: data.user.branch?.name ?? null,
              doctorId: data.user.doctorId,
            }
            : current
        );
        setSelectedBranchId(data.user.branchId ?? "ALL");
        if (data.user.role !== "SUPER_ADMIN") setActiveTab("APPOINTMENTS");
      }
      setEditingUser(null);
      setEditUserSpecialty("");
      setUserModalError("");
    } catch (error) {
      setUserModalError(error instanceof Error ? error.message : "فشل تحديث بيانات المستخدم");
    } finally {
      setSavingUserEdit(false);
    }
  };

  // Delete User
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف حساب "${userName}"؟`)) return;
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setUsersList((prev) => prev.filter((u) => u.id !== userId));
      } else {
        alert(data.message || "فشل حذف المستخدم");
      }
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  // Admin Reset User Password
  const handleResetUserPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser || !newPasswordForUser.trim()) return;

    setSavingNewPassword(true);
    setPasswordSuccessMessage("");
    try {
      const res = await fetch(`/api/users/${passwordModalUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPasswordForUser.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        setPasswordSuccessMessage(`تم بنجاح تعيين كلمة المرور الجديدة لـ (${passwordModalUser.name})`);
        setTimeout(() => {
          setPasswordModalUser(null);
          setNewPasswordForUser("");
          setPasswordSuccessMessage("");
        }, 1500);
      } else {
        alert(data.message || "فشل تعيين كلمة المرور");
      }
    } catch (err) {
      console.error("Error resetting password:", err);
    } finally {
      setSavingNewPassword(false);
    }
  };

  // Filter appointments
  const appointmentSearch = searchQuery.trim().toLocaleLowerCase();
  const filteredAppointments = appointments.filter((apt) => {
    const matchesStatus = statusFilter === "ALL" || apt.status === statusFilter;
    const matchesNoteType = noteTypeFilter === "ALL" || apt.noteType === noteTypeFilter;
    const matchesSearch =
      appointmentSearch === "" ||
      apt.patient.fullName.toLocaleLowerCase().includes(appointmentSearch) ||
      phoneMatchesSearch(apt.patient.phone, appointmentSearch) ||
      phoneMatchesSearch(apt.patient.secondaryPhone, appointmentSearch) ||
      apt.branch.name.toLocaleLowerCase().includes(appointmentSearch);

    return matchesStatus && matchesNoteType && matchesSearch;
  });

  // Filter Patients
  const patientSearch = patientSearchQuery.trim().toLocaleLowerCase();
  const filteredPatients = patientsList.filter((p) => {
    if (!patientSearch) return true;
    return (
      p.fullName.toLocaleLowerCase().includes(patientSearch) ||
      phoneMatchesSearch(p.phone, patientSearch) ||
      phoneMatchesSearch(p.secondaryPhone, patientSearch) ||
      (p.nationalId && p.nationalId.includes(patientSearch)) ||
      (p.address && p.address.toLocaleLowerCase().includes(patientSearch))
    );
  });
  const normalizedAppointmentPhoneSearch = normalizePhoneSearch(searchQuery);
  const phoneSearchPatient =
    normalizedAppointmentPhoneSearch.length >= 8
      ? patientsList.find(
        (patient) =>
          phoneMatchesSearch(patient.phone, searchQuery) ||
          phoneMatchesSearch(patient.secondaryPhone, searchQuery)
      ) ?? null
      : null;
  const phoneSearchAppointments = phoneSearchPatient?.appointments ?? [];
  const phoneSearchComplaints = phoneSearchAppointments.filter(
    (appointment) => appointment.noteType === "COMPLAINT"
  );
  const normalizedPatientPhoneSearch = normalizePhoneSearch(patientSearchQuery);
  const patientPhoneSearchMatches =
    normalizedPatientPhoneSearch.length >= 8
      ? filteredPatients.filter(
        (patient) =>
          phoneMatchesSearch(patient.phone, patientSearchQuery) ||
          phoneMatchesSearch(patient.secondaryPhone, patientSearchQuery)
      )
      : [];

  // Calculate KPIs
  const totalAppointmentsCount = appointments.length;
  const pendingAppointmentsCount = appointments.filter((a) => a.status === "PENDING").length;
  const confirmedAppointmentsCount = appointments.filter((a) => a.status === "CONFIRMED").length;
  const complaintsCount = appointments.filter((a) => a.noteType === "COMPLAINT").length;
  const suggestionsCount = appointments.filter((a) => a.noteType === "SUGGESTION").length;
  const scheduledFollowUpsCount = followUps.filter((f) => f.status === "SCHEDULED").length;
  const selectedPatientAppointments = selectedPatientForModal?.appointments ?? [];
  const selectedPatientComplaintsCount = selectedPatientAppointments.filter(
    (appointment) => appointment.noteType === "COMPLAINT"
  ).length;

  if (loading && appointments.length === 0 && branches.length === 0) {
    return <BrandLoader message="جاري تحميل بيانات لوحة التحكم..." fullScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[#F4F7F8]/90 py-2 text-slate-900 shadow-sm shadow-slate-900/[0.03] backdrop-blur-md">
        <div className="mx-auto flex h-auto min-h-16 max-w-7xl flex-col justify-between gap-3 px-4 py-2 sm:flex-row sm:items-center sm:px-6 lg:px-8">

          <div className="flex items-center gap-4">
            <Logo className="group" />
          </div>

          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:gap-3">
            {currentUser && (
              <div className="hidden items-center gap-2.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs sm:flex">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-white">
                  {currentUser.name.slice(0, 1)}
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 block text-xs">{currentUser.name}</span>
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-[var(--accent)]">
                    {currentUser.role === "SUPER_ADMIN" ? <><Crown className="h-3 w-3" /> المدير العام</> : <><Building2 className="h-3 w-3" /> {currentUser.branchName || "استقبال"}</>}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              title="تسجيل الخروج"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">خروج</span>
            </button>

            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <span>الموقع</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </Link>

            {currentUser?.role === "SUPER_ADMIN" && (
              <>
                <Link
                  href="/admin/offers"
                  className="inline-flex min-h-11 items-center rounded-full border border-teal-100 bg-teal-50 px-4 py-2 text-xs font-bold text-[var(--accent)] transition-colors hover:bg-teal-100"
                >
                  إدارة العروض
                </Link>
                <Link
                  href="/admin/medical-solutions"
                  className="inline-flex min-h-11 items-center rounded-full border border-teal-100 bg-teal-50 px-4 py-2 text-xs font-bold text-[var(--accent)] transition-colors hover:bg-teal-100"
                >
                  إدارة الخدمات الطبية
                </Link>
                <Link
                  href="/admin/services"
                  className="inline-flex min-h-11 items-center rounded-full border border-teal-100 bg-teal-50 px-4 py-2 text-xs font-bold text-[var(--accent)] transition-colors hover:bg-teal-100"
                >
                  تفعيل خدمات الحجز
                </Link>
                <Link
                  href="/admin/treatment-results"
                  className="inline-flex min-h-11 items-center rounded-full border border-teal-100 bg-teal-50 px-4 py-2 text-xs font-bold text-[var(--accent)] transition-colors hover:bg-teal-100"
                >
                  معرض نتائج العلاج
                </Link>
                <Link
                  href="/admin/reports"
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-bold text-cyan-800 transition-colors hover:bg-cyan-100"
                >
                  <FileBarChart2 className="h-4 w-4" />
                  التقارير
                </Link>
              </>
            )}
          </div>

        </div>
      </header>
      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">

        {/* Top Header & Branch Switcher */}
        <div className="flex flex-col justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:border-cyan-200 sm:gap-4 sm:p-6 md:flex-row md:items-center">
          <div>
            <p className="mb-1 text-xs font-black tracking-widest text-cyan-700">LAVA <span className="text-sky-500">SMILE</span></p>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight break-words">
              لوحة التحكم والإشراف الشامل
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 break-words">
              {currentUser?.role === "SUPER_ADMIN"
                ? "أنت متصل بصلاحية المدير العام: يمكنك متابعة كافة الحالات شخصياً، التواصل مع أي مريض مباشرة هاتفياً أو واتساب، والتحكم في الموظفين وباسوورداتهم."
                : `أنت متصل بصلاحية: ${currentUser?.branchName || "استقبال الفرع"}`}
            </p>
          </div>

          {/* Branch Switcher Buttons */}
          <div className="flex w-full items-center gap-2 overflow-x-auto pb-2 md:w-auto md:pb-0">
            {currentUser?.role === "SUPER_ADMIN" && (
              <button
                onClick={() => setSelectedBranchId("ALL")}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 ${selectedBranchId === "ALL"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 ring-2 ring-blue-600/20"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
              >
                <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> كل الفروع ({branches.length})</span>
              </button>
            )}

            {branches.map((b) => {
              if (currentUser?.role === "RECEPTIONIST" && currentUser.branchId && currentUser.branchId !== b.id) {
                return null;
              }

              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedBranchId(b.id)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 flex items-center gap-1.5 ${selectedBranchId === b.id
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 ring-2 ring-blue-600/20"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{b.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">

          <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm transition-all hover:border-cyan-300 hover:shadow-md sm:p-5 space-y-2">
            <span className="text-[11px] font-bold text-slate-500">إجمالي الحجوزات</span>
            <div className="text-3xl font-black text-slate-900">{totalAppointmentsCount}</div>
            <div className="text-[10px] text-slate-400 font-semibold">بكل الفروع المحددة</div>
          </div>

          <div className="rounded-2xl border border-cyan-200/80 bg-white p-3 shadow-sm transition-all hover:border-cyan-300 hover:shadow-md sm:p-5 space-y-2">
            <span className="text-[11px] font-bold text-blue-700 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              إجمالي المرضى
            </span>
            <div className="text-3xl font-black text-blue-600">{patientsList.length}</div>
            <div className="text-[10px] text-blue-600/80 font-semibold">ملف طبي مسجل</div>
          </div>

          <div className="rounded-2xl border border-amber-200/80 bg-white p-3 shadow-sm transition-all hover:border-amber-300 hover:shadow-md sm:p-5 space-y-2">
            <span className="text-[11px] font-bold text-amber-700">قيد المراجعة</span>
            <div className="text-3xl font-black text-amber-600">{pendingAppointmentsCount}</div>
            <div className="text-[10px] text-amber-600/80 font-semibold">تحتاج تأكيد الاستقبال</div>
          </div>

          <div className="rounded-2xl border border-rose-200/80 bg-white p-3 shadow-sm transition-all hover:border-rose-300 hover:shadow-md sm:p-5 space-y-2">
            <span className="text-[11px] font-bold text-rose-700 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              شكاوى الحالات
            </span>
            <div className="text-3xl font-black text-rose-600">{complaintsCount}</div>
            <div className="text-[10px] text-rose-600/80 font-semibold">شكاوى ألم وحالات طارئة</div>
          </div>

          <div className="rounded-2xl border border-emerald-200/80 bg-white p-3 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md sm:p-5 space-y-2">
            <span className="text-[11px] font-bold text-emerald-700">حجوزات مؤكدة</span>
            <div className="text-3xl font-black text-emerald-600">{confirmedAppointmentsCount}</div>
            <div className="text-[10px] text-emerald-600/80 font-semibold">مجدولة للحضور</div>
          </div>

          <div className="rounded-2xl border border-cyan-100 bg-white p-3 shadow-sm transition-all hover:border-cyan-300 hover:shadow-md sm:p-5 space-y-2">
            <span className="text-[11px] font-bold text-indigo-700 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              متابعات دورية
            </span>
            <div className="text-3xl font-black text-indigo-600">{scheduledFollowUpsCount}</div>
            <div className="text-[10px] text-indigo-600/80 font-semibold">مواعيد كشف تالية</div>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-4 overflow-x-auto overscroll-x-contain pb-1">
          <button
            onClick={() => setActiveTab("APPOINTMENTS")}
            className={`pb-4 px-2 text-sm font-black border-b-2 transition-all shrink-0 flex items-center gap-2 ${activeTab === "APPOINTMENTS"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
          >
            <Calendar className="w-4 h-4" />
            <span>سجل الحجوزات والشكاوى ({filteredAppointments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("PATIENTS")}
            className={`pb-4 px-2 text-sm font-black border-b-2 transition-all shrink-0 flex items-center gap-2 ${activeTab === "PATIENTS"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>سجل الحالات والاتصال المباشر ({filteredPatients.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("FOLLOWUPS")}
            className={`pb-4 px-2 text-sm font-black border-b-2 transition-all shrink-0 flex items-center gap-2 ${activeTab === "FOLLOWUPS"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
          >
            <Activity className="w-4 h-4" />
            <span>نظام المتابعة والتذكير ({followUps.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("BRANCHES")}
            className={`pb-4 px-2 text-sm font-black border-b-2 transition-all shrink-0 flex items-center gap-2 ${activeTab === "BRANCHES"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
          >
            <Building className="w-4 h-4" />
            <span>إدارة الفروع والخرائط ({branches.length})</span>
          </button>

          {currentUser?.role === "SUPER_ADMIN" && (
            <button
              onClick={() => setActiveTab("USERS")}
              className={`pb-4 px-2 text-sm font-black border-b-2 transition-all shrink-0 flex items-center gap-2 ${activeTab === "USERS"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>إدارة الموظفين والباسووردات ({usersList.length})</span>
            </button>
          )}
        </div>

        {/* TAB 1: APPOINTMENTS & COMPLAINTS */}
        {activeTab === "APPOINTMENTS" && (
          <div className="space-y-6">

            {/* Filter Toolbar */}
            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">

              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                <input
                  type="text"
                  placeholder="بحث باسم المريض أو الهاتف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                  <Filter className="w-3.5 h-3.5" />
                  <span>الحالة:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white text-slate-800"
                  >
                    <option value="ALL">الكل</option>
                    <option value="PENDING">قيد المراجعة</option>
                    <option value="CONFIRMED">مؤكد</option>
                    <option value="COMPLETED">مكتمل</option>
                    <option value="CANCELLED">ملغي</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                  <span>نوع الرسالة:</span>
                  <select
                    value={noteTypeFilter}
                    onChange={(e) => setNoteTypeFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white text-slate-800"
                  >
                    <option value="ALL">الكل</option>
                    <option value="COMPLAINT">شكاوى ألم</option>
                    <option value="SUGGESTION">مقترحات</option>
                    <option value="INQUIRY">استفسارات</option>
                  </select>
                </div>

                <button
                  onClick={loadAllData}
                  className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200"
                  title="تحديث البيانات"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>

            </div>

            {phoneSearchPatient && (
              <section className="flex flex-col justify-between gap-4 rounded-2xl border border-cyan-800 bg-slate-900 p-4 text-white shadow-lg sm:flex-row sm:items-center">
                <div className="flex items-start gap-3">
                  <span className="rounded-xl border border-rose-400/30 bg-rose-500/15 p-2.5 text-rose-300">
                    <AlertCircle className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black">
                      السجل المرتبط برقم الهاتف:{" "}
                      <span className="font-mono text-cyan-300" dir="ltr">
                        {phoneSearchPatient.phone}
                      </span>
                    </h3>
                    <p className="mt-1 text-xs text-slate-300">
                      {phoneSearchPatient.fullName} · إجمالي الحجوزات والشكاوى:{" "}
                      <strong className="text-white">{phoneSearchAppointments.length}</strong>
                      {" · "}
                      الشكاوى:{" "}
                      <strong className="text-rose-300">{phoneSearchComplaints.length}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPatientForModal(phoneSearchPatient)}
                  className="shrink-0 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-cyan-500"
                >
                  عرض السجل الكامل
                </button>
              </section>
            )}

            {/* Appointments List / Cards */}
            {filteredAppointments.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 space-y-3">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-black text-slate-700">لا توجد حجوزات مطابقة للفلتر المحدد</h3>
                <p className="text-xs text-slate-400">جرب تغيير الفرع أو إلغاء بعض الفلاتر.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAppointments.map((apt) => {
                  const aptDate = new Date(apt.appointmentDate);
                  return (
                    <div
                      key={apt.id}
                      className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:border-blue-400 transition-all space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                            <User className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-black text-slate-900">{apt.patient.fullName}</h3>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                {apt.branch.name}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-1">
                              <a
                                href={`tel:${apt.patient.phone}`}
                                className="font-bold text-slate-700 hover:text-blue-600 flex items-center gap-1"
                                dir="ltr"
                              >
                                <Phone className="h-3.5 w-3.5" /> {apt.patient.phone}
                              </a>
                              {apt.patient.secondaryPhone && (
                                <span className="text-slate-500" dir="ltr">
                                  <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> طوارئ: {apt.patient.secondaryPhone}</span>
                                </span>
                              )}
                              {apt.patient.address && (
                                <span className="inline-flex break-words items-start gap-1"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {apt.patient.address}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-xl text-xs font-black ${apt.status === "PENDING"
                                ? "bg-amber-100 text-amber-800"
                                : apt.status === "CONFIRMED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : apt.status === "COMPLETED"
                                    ? "bg-indigo-100 text-indigo-800"
                                    : "bg-rose-100 text-rose-800"
                              }`}
                          >
                            {apt.status === "PENDING" && <span className="inline-flex items-center gap-1"><Hourglass className="h-3.5 w-3.5" /> قيد المراجعة</span>}
                            {apt.status === "CONFIRMED" && <span className="inline-flex items-center gap-1"><CircleCheck className="h-3.5 w-3.5" /> حجز مؤكد</span>}
                            {apt.status === "COMPLETED" && <span className="inline-flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> اكتمل العلاج</span>}
                            {apt.status === "CANCELLED" && <span className="inline-flex items-center gap-1"><CircleX className="h-3.5 w-3.5" /> ملغي</span>}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-slate-400 block mb-0.5">
                            {apt.bookingType === "OFFER" ? "العرض المختار:" : "الخدمة المطلوبة:"}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">
                            {apt.bookingTitle ||
                              apt.offerTitle ||
                              apt.medicalSolution?.titleAr ||
                              apt.service?.name ||
                              "كشف وتشخيص عام"}
                          </span>
                          <span className="mt-1 block text-xs font-semibold text-slate-500">
                            النوع: {
                              apt.bookingType === "OFFER"
                                ? "عرض خاص"
                                : apt.bookingType === "MEDICAL_SOLUTION"
                                  ? "حل طبي"
                                  : apt.bookingType === "SERVICE"
                                    ? "خدمة"
                                    : "كشف عام"
                            }
                            {apt.bookingPrice !== null &&
                              ` — ${apt.bookingPrice.toLocaleString("ar-EG")} ج.م`}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-slate-400 block mb-0.5">الموعد والتاريخ:</span>
                          <span className="font-bold text-slate-900 text-sm">
                            {aptDate.toLocaleDateString("ar-EG")} الساعة {aptDate.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-slate-400 block mb-0.5">الطبيب المعالج:</span>
                          <span className="font-bold text-slate-900 text-sm">
                            {apt.doctor?.name || "سيتم تحديده في العيادة"}
                          </span>
                        </div>
                      </div>

                      {apt.offerTitle && (
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
                          <span className="font-black text-emerald-800">
                            <span className="inline-flex items-center gap-1"><Gift className="h-4 w-4" /> تم الحجز عبر العرض: {apt.offerTitle}</span>
                          </span>
                          {apt.offerPrice !== null && (
                            <span className="font-black text-emerald-700">
                              سعر العرض: {apt.offerPrice.toLocaleString("ar-EG")} ج.م
                            </span>
                          )}
                        </div>
                      )}

                      {(apt.noteType === "COMPLAINT" || apt.noteType === "INQUIRY") && apt.patientComplaint && (
                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-black text-rose-800">
                            <AlertCircle className="w-4 h-4 text-rose-600" />
                            <span>{apt.noteType === "INQUIRY" ? "استفسار المريض:" : "شكوى المريض ووصف الألم:"}</span>
                          </div>
                          <p className="text-rose-900 font-semibold leading-relaxed">
                            &quot;{apt.patientComplaint}&quot;
                          </p>
                          {apt.painLocation && (
                            <span className="inline-block mt-1 font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-lg">
                              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> السن / موضع الألم: {apt.painLocation}</span>
                            </span>
                          )}
                        </div>
                      )}

                      {apt.noteType === "SUGGESTION" && apt.patientSuggestion && (
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-black text-blue-800">
                            <Lightbulb className="w-4 h-4 text-blue-600" />
                            <span>اقتراح أو رغبة العميل:</span>
                          </div>
                          <p className="text-blue-900 font-semibold leading-relaxed">
                            &quot;{apt.patientSuggestion}&quot;
                          </p>
                        </div>
                      )}

                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                        <div className="flex flex-wrap items-center gap-2">
                          {apt.status === "PENDING" && (
                            <button
                              onClick={() => updateAppointmentStatus(apt.id, "CONFIRMED")}
                              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-sm"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>تأكيد الموعد</span>
                            </button>
                          )}

                          {apt.status === "CONFIRMED" && (
                            <button
                              onClick={() => updateAppointmentStatus(apt.id, "COMPLETED")}
                              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-sm"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>اكتمال الجلسة والعلاج</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setActiveAppointmentForFollowUp(apt);
                              setModalOpen(true);
                            }}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                          >
                            <Activity className="w-3.5 h-3.5 text-blue-600" />
                            <span>جدولة متابعة دورية</span>
                          </button>

                          {/* Direct WhatsApp button from appointment */}
                          <a
                            href={`https://wa.me/2${apt.patient.phone.replace(/^0/, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1.5"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>واتساب المريض</span>
                          </a>

                          {apt.status !== "CANCELLED" && (
                            <button
                              onClick={() => updateAppointmentStatus(apt.id, "CANCELLED")}
                              className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              إلغاء الحجز
                            </button>
                          )}
                        </div>

                        <span className="text-[11px] text-slate-400">
                          رقم الحجز: <code className="font-mono">{apt.id.slice(-8)}</code>
                        </span>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* TAB 2: PATIENTS DIRECTORY & DIRECT CALL/WHATSAPP */}
        {activeTab === "PATIENTS" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">سجل الحالات والاتصال الشخصي المباشر</h3>
                <p className="text-xs text-slate-500">
                  يمكنك كمدير عام استعراض كافة الحالات، معرفة شكاوى كل مريض بالتفصيل، والتواصل معه هاتفياً أو عبر الواتساب مباشرة دون أي وسيط.
                </p>
              </div>

              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                <input
                  type="text"
                  placeholder="بحث باسم المريض، الهاتف، الرقم القومي..."
                  value={patientSearchQuery}
                  onChange={(e) => setPatientSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {patientPhoneSearchMatches.length > 0 && (
              <section className="space-y-3">
                {patientPhoneSearchMatches.map((patient) => {
                  const patientAppointments = patient.appointments ?? [];
                  const patientComplaints = patientAppointments.filter(
                    (appointment) => appointment.noteType === "COMPLAINT"
                  );
                  return (
                    <div
                      key={patient.id}
                      className="flex flex-col justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center"
                    >
                      <div>
                        <p className="text-sm font-black text-slate-900">
                          سجل الشكاوى المرتبط برقم الهاتف{" "}
                          <span className="font-mono text-cyan-800" dir="ltr">
                            {patient.phone}
                          </span>
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-700">
                          {patient.fullName} · {patientAppointments.length} حجز/طلب ·{" "}
                          <span className="text-rose-700">{patientComplaints.length} شكوى</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedPatientForModal(patient)}
                        className="shrink-0 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-rose-700"
                      >
                        عرض تاريخ الشكاوى والحجوزات
                      </button>
                    </div>
                  );
                })}
              </section>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {filteredPatients.map((p) => {
                const cleanPhone = p.phone.replace(/^0/, "");
                const complaintsCount = p.appointments?.filter((a) => a.noteType === "COMPLAINT").length || 0;
                const totalVisits = p.appointments?.length || 0;

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:border-blue-400 transition-all space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 text-base">{p.fullName}</h4>
                            <span className="text-[11px] text-slate-400">
                              تاريخ التسجيل: {new Date().toLocaleDateString("ar-EG")}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-black ${complaintsCount > 0
                              ? "bg-rose-100 text-rose-800"
                              : "bg-slate-100 text-slate-600"
                            }`}>
                            <AlertCircle className="h-3 w-3" />
                            {complaintsCount} شكوى
                          </span>
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-slate-100 text-slate-700">
                            {totalVisits} زيارة
                          </span>
                        </div>
                      </div>

                      {/* Contact & Personal Data */}
                      <div className="space-y-1.5 text-xs text-slate-600">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-slate-400">الهاتف الأساسي:</span>
                          <span className="font-bold text-slate-900 font-mono" dir="ltr">{p.phone}</span>
                        </div>
                        {p.secondaryPhone && (
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-slate-400">هاتف الطوارئ:</span>
                            <span className="font-bold text-slate-700 font-mono" dir="ltr">{p.secondaryPhone}</span>
                          </div>
                        )}
                        {p.nationalId && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">الرقم القومي:</span>
                            <span className="font-mono text-slate-800">{p.nationalId}</span>
                          </div>
                        )}
                        {p.address && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">العنوان:</span>
                            <span className="break-words text-slate-800">{p.address}</span>
                          </div>
                        )}
                        {p.allergies && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">الحساسية:</span>
                            <span className="break-words text-rose-600 font-bold">{p.allergies}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Direct Contact Actions */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <a
                          href={`tel:${p.phone}`}
                          className="py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          <span>اتصال هاتفي شخصي</span>
                        </a>

                        <a
                          href={`https://wa.me/2${cleanPhone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2.5 px-3 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>محادثة واتساب</span>
                        </a>
                      </div>

                      <button
                        onClick={() => setSelectedPatientForModal(p)}
                        className="w-full py-2 px-3 rounded-xl text-xs font-black text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>عرض الملف الطبي وتفاصيل الشكاوى بالكامل</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: FOLLOW-UP SYSTEM */}
        {activeTab === "FOLLOWUPS" && (
          <div className="space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">نظام المتابعة والتذكير الدوري للمرضى</h3>
                <p className="text-xs text-slate-500">
                  متابعة حالات ما بعد الزراعة، فك الغرز، جلسات التقويم، والتأكد من رضا المرضى.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div
                className="my-custom-scrollbar w-full overflow-x-auto overscroll-x-contain touch-pan-x"
                role="region"
                aria-label="جدول مواعيد المتابعة"
                tabIndex={0}
              >
                <table className="min-w-[900px] w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <tr>
                      <th className="p-4">المريض</th>
                      <th className="p-4">الفرع</th>
                      <th className="p-4">موعد المتابعة</th>
                      <th className="p-4">نوع المتابعة</th>
                      <th className="p-4">توصيات الطبيب</th>
                      <th className="p-4">الحالة</th>
                      <th className="p-4 text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {followUps.map((f) => {
                      const fDate = new Date(f.scheduledDate);
                      return (
                        <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-4 font-black text-slate-900">
                            <div>{f.patient.fullName}</div>
                            <div className="text-[11px] text-slate-400 font-normal" dir="ltr">
                              {f.patient.phone}
                            </div>
                          </td>
                          <td className="p-4 text-slate-700 font-bold">{f.branch.name}</td>
                          <td className="p-4 font-bold text-slate-900">
                            {fDate.toLocaleDateString("ar-EG")}
                          </td>
                          <td className="p-4 text-blue-700 font-bold">{f.followUpType}</td>
                          <td className="p-4 text-slate-600 max-w-xs">{f.notes || "—"}</td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${f.status === "SCHEDULED"
                                  ? "bg-amber-100 text-amber-800"
                                  : f.status === "COMPLETED"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                            >
                              {f.status === "SCHEDULED" ? "مجدولة" : "تمت المتابعة"}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {f.status === "SCHEDULED" ? (
                              <button
                                onClick={() => updateFollowUpStatus(f.id, "COMPLETED")}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                              >
                                تأكيد إتمام المتابعة
                              </button>
                            ) : (
                              <span className="text-emerald-600 font-bold text-xs flex items-center justify-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> تم بنجاح
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BRANCHES MANAGEMENT & GOOGLE MAPS */}
        {activeTab === "BRANCHES" && (
          <div className="space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">إدارة فروع مراكز Lava Smile والخرائط</h3>
                <p className="text-xs text-slate-500">
                  يمكنك إضافة فروع جديدة، وتعديل بياناتها، وربط موقع كل فرع مباشرة على خرائط Google Maps.
                </p>
              </div>

              {currentUser?.role === "SUPER_ADMIN" && (
                <button
                  onClick={() => setBranchModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl font-black text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة فرع جديد</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {branches.map((b) => {
                const branchAppointments = appointments.filter((a) => a.branchId === b.id);
                const branchFollowUps = followUps.filter((f) => f.branchId === b.id);

                return (
                  <div
                    key={b.id}
                    className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:border-blue-400 transition-all space-y-5 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="text-lg font-black text-slate-900">{b.name}</h3>
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                          {b.city}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">{b.address}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-center pt-1">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 block">الحجوزات</span>
                          <span className="text-base font-black text-slate-900">{branchAppointments.length}</span>
                        </div>
                        <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-100">
                          <span className="text-[10px] text-indigo-500 block">المتابعات</span>
                          <span className="text-base font-black text-indigo-700">{branchFollowUps.length}</span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{b.workingHours}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span dir="ltr">{b.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {b.mapUrl ? (
                        <a
                          href={b.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center justify-center gap-2"
                        >
                          <MapPin className="w-4 h-4 text-emerald-600" />
                          <span>الموقع على Google Maps</span>
                          <ExternalLink className="w-3 h-3 text-emerald-500" />
                        </a>
                      ) : (
                        <div className="text-center py-2 text-[11px] text-slate-400 bg-slate-50 rounded-xl">
                          لم يتم إدراج رابط خريطة
                        </div>
                      )}

                      {currentUser?.role === "SUPER_ADMIN" && (
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => handleDeleteBranch(b.id, b.name)}
                            className="text-[11px] text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف الفرع</span>
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: USERS & PASSWORD RESET (SUPER ADMIN ONLY) */}
        {activeTab === "USERS" && currentUser?.role === "SUPER_ADMIN" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">إدارة الموظفين والتحكم في كلمات المرور</h3>
                <p className="text-xs text-slate-500">
                  يمكنك كمدير عام تعديل كلمة مرور أي موظف في حال نسيانها، أو إضافة موظفين جدد وحذف الحسابات.
                </p>
              </div>

              <button
                onClick={() => {
                  setUserModalError("");
                  setEditingUser(null);
                  setUserModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-xl font-black text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة مستخدم جديد</span>
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div
                className="my-custom-scrollbar w-full overflow-x-auto overscroll-x-contain touch-pan-x"
                role="region"
                aria-label="جدول الموظفين"
                tabIndex={0}
              >
                <table className="min-w-[900px] w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <tr>
                      <th className="p-4">اسم الموظف</th>
                      <th className="p-4">البريد الإلكتروني</th>
                      <th className="p-4">الصلاحية (Role)</th>
                      <th className="p-4">الفرع التابع له</th>
                      <th className="p-4 text-center">إعادة تعيين كلمة المرور</th>
                      <th className="p-4 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usersList.map((u) => {
                      const isMe = u.id === currentUser.userId;
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-4 font-black text-slate-900 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                              {u.name.slice(0, 1)}
                            </div>
                            <div>
                              <span>{u.name}</span>
                              {isMe && (
                                <span className="mr-2 text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold">
                                  حسابك الحالي
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="p-4 font-mono text-slate-600" dir="ltr">
                            {u.email}
                          </td>

                          <td className="p-4">
                            <span
                              className={`px-3 py-1 rounded-xl text-[11px] font-black ${u.role === "SUPER_ADMIN"
                                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                                  : u.role === "BRANCH_ADMIN"
                                    ? "bg-indigo-100 text-indigo-800"
                                    : u.role === "DOCTOR"
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-emerald-100 text-emerald-800"
                                }`}
                            >
                              {u.role === "SUPER_ADMIN" && <span className="inline-flex items-center gap-1"><Crown className="h-3.5 w-3.5" /> مدير عام</span>}
                              {u.role === "BRANCH_ADMIN" && <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> مدير فرع</span>}
                              {u.role === "DOCTOR" && <span className="inline-flex items-center gap-1"><Stethoscope className="h-3.5 w-3.5" /> طبيب معالج</span>}
                              {u.role === "RECEPTIONIST" && <span className="inline-flex items-center gap-1"><UserRound className="h-3.5 w-3.5" /> موظف استقبال</span>}
                            </span>
                          </td>

                          <td className="p-4 text-slate-700 font-bold">
                            {u.branch ? (
                              <span className="flex items-center gap-1 text-blue-700">
                                <MapPin className="w-3.5 h-3.5" />
                                {u.branch.name}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal">كافة الفروع</span>
                            )}
                          </td>

                          <td className="p-4 text-center">
                            <button
                              onClick={() => {
                                setPasswordModalUser(u);
                                setNewPasswordForUser("");
                                setPasswordSuccessMessage("");
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors inline-flex items-center gap-1"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span>تغيير الباسوورد</span>
                            </button>
                          </td>

                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEditUserModal(u)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors inline-flex items-center gap-1"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>تعديل</span>
                              </button>
                              {!isMe && (
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.name)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors inline-flex items-center gap-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>حذف</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODAL: PATIENT FULL COMPREHENSIVE PROFILE & COMPLAINTS HISTORY */}
      {selectedPatientForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-6 animate-in fade-in overflow-y-auto font-sans">
          <div className="bg-white rounded-3xl p-4 sm:p-8 w-[95%] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-5 sm:space-y-6 animate-in zoom-in-95 my-2 sm:my-8">

            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">{selectedPatientForModal.fullName}</h3>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                      {selectedPatientComplaintsCount} شكوى سابقة
                    </span>
                    <span className="rounded-md bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-cyan-700">
                      {selectedPatientAppointments.length} حجز/طلب
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatientForModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Direct Contact Bar */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">الهاتف المباشر للتواصل:</span>
                <span className="break-words text-base font-black text-slate-900 font-mono" dir="ltr">
                  {selectedPatientForModal.phone}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${selectedPatientForModal.phone}`}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>اتصال هاتفي</span>
                </a>

                <a
                  href={`https://wa.me/2${selectedPatientForModal.phone.replace(/^0/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 transition-colors flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>واتساب مباشر</span>
                </a>
              </div>
            </div>

            {/* Personal Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {selectedPatientForModal.secondaryPhone && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">هاتف الطوارئ:</span>
                  <span className="font-bold text-slate-900 font-mono" dir="ltr">{selectedPatientForModal.secondaryPhone}</span>
                </div>
              )}
              {selectedPatientForModal.nationalId && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">الرقم القومي:</span>
                  <span className="font-bold text-slate-900 font-mono">{selectedPatientForModal.nationalId}</span>
                </div>
              )}
              {selectedPatientForModal.address && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">العنوان:</span>
                  <span className="break-words font-bold text-slate-900">{selectedPatientForModal.address}</span>
                </div>
              )}
              {selectedPatientForModal.allergies && (
                <div className="bg-rose-50 p-3 rounded-xl border border-rose-100">
                  <span className="text-rose-500 block mb-0.5">الحساسية الدوائية:</span>
                  <span className="font-bold text-rose-800">{selectedPatientForModal.allergies}</span>
                </div>
              )}
            </div>

            {/* Complaints & History Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <History className="w-4 h-4 text-blue-600" />
                <span>سجل شكاوى المريض والزيارات السابقة:</span>
              </h4>

              {selectedPatientAppointments.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {selectedPatientAppointments.map((a) => (
                    <div key={a.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-800">
                          {a.branch.name} — {a.bookingTitle || a.offerTitle || a.service?.name || "كشف عام"}
                        </span>
                        <span className="text-slate-400">
                          {new Date(a.appointmentDate).toLocaleString("ar-EG")}
                        </span>
                      </div>

                      <p className="font-semibold text-slate-600">
                        {a.noteType === "COMPLAINT"
                          ? "شكوى"
                          : a.noteType === "SUGGESTION"
                            ? "اقتراح"
                            : a.noteType === "INQUIRY"
                              ? "استفسار / طلب"
                              : "حجز"}
                        {" · "}
                        {a.status === "PENDING"
                          ? "قيد المراجعة"
                          : a.status === "CONFIRMED"
                            ? "مؤكد"
                            : a.status === "COMPLETED"
                              ? "مكتمل"
                              : a.status === "CANCELLED"
                                ? "ملغي"
                                : a.status}
                      </p>

                      {a.patientComplaint && (
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 font-semibold">
                          <span className="mb-0.5 flex items-center gap-1 font-bold text-rose-800">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {a.noteType === "INQUIRY" ? "تفاصيل الاستفسار / الطلب:" : "الشكوى المسجلة:"}
                          </span>
                          &quot;{a.patientComplaint}&quot;
                          {a.painLocation && <span className="mt-1 flex items-center gap-1 text-rose-700"><MapPin className="h-3.5 w-3.5" /> موضع الألم: {a.painLocation}</span>}
                        </div>
                      )}

                      {a.patientSuggestion && (
                        <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
                          <span className="mb-0.5 flex items-center gap-1 font-bold text-blue-800"><Lightbulb className="h-3.5 w-3.5" /> المقترح:</span>
                          &quot;{a.patientSuggestion}&quot;
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">لا توجد حجوزات أو شكاوى مسجلة لهذا المريض.</p>
              )}
            </div>

            <div className="pt-2 text-left">
              <button
                onClick={() => setSelectedPatientForModal(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: ADMIN RESET USER PASSWORD */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-6 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl p-4 sm:p-8 w-[95%] sm:w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 my-2 sm:my-0">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">تغيير كلمة مرور الموظف</h3>
                <p className="text-xs text-slate-500">
                  الموظف: <strong>{passwordModalUser.name}</strong> ({passwordModalUser.email})
                </p>
              </div>
              <button
                onClick={() => setPasswordModalUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {passwordSuccessMessage ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center">
                {passwordSuccessMessage}
              </div>
            ) : (
              <form onSubmit={handleResetUserPassword} className="space-y-4 text-right">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    أدخل كلمة المرور الجديدة للموظف *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="اكتب كلمة المرور الجديدة هنا..."
                    value={newPasswordForUser}
                    onChange={(e) => setNewPasswordForUser(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-right"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    بصفتك المدير العام يمكنك تعيين كلمة مرور جديدة للموظف وإعطائها له مباشرة.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setPasswordModalUser(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={savingNewPassword}
                    className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-cyan-600 hover:bg-cyan-700 transition-colors shadow-md disabled:opacity-60"
                  >
                    {savingNewPassword ? <><LoadingIndicator size="sm" className="border-white border-t-amber-300" /> جاري التحديث...</> : "حفظ وتعيين كلمة المرور"}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* MODAL: ADD NEW BRANCH */}
      {branchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-6 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl p-4 sm:p-8 w-[95%] sm:w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 my-2 sm:my-0">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">إضافة فرع جديد لمراكز Lava Smile</h3>
                <p className="text-xs text-slate-500">سجل بيانات الفرع ورابط موقعه على خرائط Google Maps</p>
              </div>
              <button
                onClick={() => setBranchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="space-y-4 text-right">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم الفرع *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: فرع الشيخ زايد"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المدينة / المحافظة *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: الجيزة"
                    value={newBranchCity}
                    onChange={(e) => setNewBranchCity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    هاتف الفرع *
                  </label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    placeholder="010XXXXXXXX"
                    value={newBranchPhone}
                    onChange={(e) => setNewBranchPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  العنوان التفصيلي *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: محور 26 يوليو، مول كابيتال بيزنس بارك"
                  value={newBranchAddress}
                  onChange={(e) => setNewBranchAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ساعات العمل اليومية
                </label>
                <input
                  type="text"
                  placeholder="مثال: 10:00 ص - 10:00 م"
                  value={newBranchHours}
                  onChange={(e) => setNewBranchHours(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200 space-y-1.5">
                <label className="block text-xs font-black text-emerald-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  رابط موقع الفرع على خرائط Google Maps
                </label>
                <input
                  type="url"
                  dir="ltr"
                  placeholder="https://maps.google.com/?q=..."
                  value={newBranchMapUrl}
                  onChange={(e) => setNewBranchMapUrl(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-emerald-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setBranchModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingBranch}
                  className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-cyan-600 hover:bg-cyan-700 transition-colors shadow-md disabled:opacity-60"
                >
                  {savingBranch ? <><LoadingIndicator size="sm" className="border-white border-t-amber-300" /> جاري الحفظ...</> : "حفظ وإضافة الفرع"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-6 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl p-4 sm:p-8 w-[95%] sm:w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 my-2 sm:my-0">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">تعديل بيانات المستخدم</h3>
                <p className="text-xs text-slate-500">تعديل بيانات الحساب والصلاحيات والفرع</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="إغلاق"
              >
                ✕
              </button>
            </div>

            {userModalError && (
              <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{userModalError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="space-y-4 text-right">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الاسم بالكامل *
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={editUserName}
                  onChange={(event) => setEditUserName(event.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  البريد الإلكتروني *
                </label>
                <input
                  type="email"
                  required
                  maxLength={254}
                  dir="ltr"
                  value={editUserEmail}
                  onChange={(event) => setEditUserEmail(event.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-right"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الصلاحية *
                  </label>
                  <select
                    value={editUserRole}
                    onChange={(event) => {
                      const role = event.target.value as UserItem["role"];
                      setEditUserRole(role);
                      if (role !== "DOCTOR") setEditUserDoctorId("");
                      if (role === "SUPER_ADMIN") setEditUserBranchId("");
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="SUPER_ADMIN">مدير عام</option>
                    <option value="BRANCH_ADMIN">مدير فرع</option>
                    <option value="DOCTOR">طبيب معالج</option>
                    <option value="RECEPTIONIST">موظف استقبال</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الفرع المرتبط
                  </label>
                  <select
                    value={editUserBranchId}
                    disabled={editUserRole === "SUPER_ADMIN"}
                    required={editUserRole !== "SUPER_ADMIN"}
                    onChange={(event) => {
                      setEditUserBranchId(event.target.value);
                      setEditUserDoctorId("");
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">كافة الفروع / دون فرع</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

{editUserRole === "DOCTOR" && !editingUser?.doctorId && (
  <div>
    <label className="block text-xs font-bold text-slate-700 mb-1">
      التخصص *
    </label>
    <input
      type="text"
      required
      maxLength={120}
      placeholder="مثال: زراعة الأسنان، تقويم، جراحة الفم"
      value={editUserSpecialty}
      onChange={(e) => setEditUserSpecialty(e.target.value)}
      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
    />
    <p className="mt-1 text-[10px] text-slate-400">
      سيتم إنشاء سجل الطبيب تلقائيًا وربطه بهذا الحساب.
    </p>
  </div>
)}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingUserEdit}
                  className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-cyan-600 hover:bg-cyan-700 transition-colors shadow-md disabled:opacity-60"
                >
                  {savingUserEdit ? <><LoadingIndicator size="sm" className="border-white border-t-amber-300" /> جارٍ الحفظ...</> : "حفظ التعديلات"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW USER */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-6 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl p-4 sm:p-8 w-[95%] sm:w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 my-2 sm:my-0">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">إضافة مستخدم جديد للنظام</h3>
                <p className="text-xs text-slate-500">حدد بيانات الدخول والصلاحيات والفرع المخصص</p>
              </div>
              <button
                onClick={() => setUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {userModalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{userModalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 text-right">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الاسم بالكامل *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: د. ماجد حسني"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  البريد الإلكتروني للدخول *
                </label>
                <input
                  type="email"
                  required
                  dir="ltr"
                  placeholder="user@lavasmile.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-right"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  كلمة المرور *
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-right"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الصلاحية الممنوحة *
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => {
                      if (isUserRole(e.target.value)) setNewUserRole(e.target.value);
                      setNewUserDoctorId("");
                      if (e.target.value === "SUPER_ADMIN") setNewUserBranchId("");
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="RECEPTIONIST">موظف استقبال فرع</option>
                    <option value="BRANCH_ADMIN">مدير فرع</option>
                    <option value="DOCTOR">طبيب معالج</option>
                    <option value="SUPER_ADMIN">مدير عام (كافة الصلاحيات)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الفرع المسؤول عنه
                  </label>
                  <select
                    value={newUserBranchId}
                    onChange={(e) => {
                      setNewUserBranchId(e.target.value);
                      setNewUserDoctorId("");
                    }}
                    disabled={newUserRole === "SUPER_ADMIN"}
                    required={newUserRole !== "SUPER_ADMIN"}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="">{newUserRole === "SUPER_ADMIN" ? "كل الفروع" : "اختر فرعاً..."}</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {newUserRole === "DOCTOR" && (
                 <div>
    <label className="block text-xs font-bold text-slate-700 mb-1">
      التخصص *
    </label>
    <input
      type="text"
      required
      maxLength={120}
      placeholder="مثال: زراعة الأسنان، تقويم، جراحة الفم"
      value={newUserSpecialty}
      onChange={(e) => setNewUserSpecialty(e.target.value)}
      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
    />
    <p className="mt-1 text-[10px] text-slate-400">
      سيتم إنشاء سجل الطبيب تلقائيًا وربطه بهذا الحساب.
    </p>
  </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-cyan-600 hover:bg-cyan-700 transition-colors shadow-md disabled:opacity-60"
                >
                  {savingUser ? <><LoadingIndicator size="sm" className="border-white border-t-amber-300" /> جاري الإنشاء...</> : "إنشاء المستخدم وحفظ الصلاحيات"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SCHEDULE FOLLOW-UP */}
      {modalOpen && activeAppointmentForFollowUp && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-6 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl p-4 sm:p-8 w-[95%] sm:w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 my-2 sm:my-0">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">جدولة موعد متابعة للمريض</h3>
                <p className="text-xs text-slate-500">
                  {activeAppointmentForFollowUp.patient.fullName} ({activeAppointmentForFollowUp.branch.name})
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFollowUp} className="space-y-4 text-right">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تاريخ الزيارة القادمة للمتابعة *
                </label>
                <input
                  type="date"
                  required
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نوع المتابعة المطلوبة *
                </label>
                <select
                  value={followUpType}
                  onChange={(e) => setFollowUpType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="فحص ما بعد الزراعة وتغيير الضماد">فحص ما بعد الزراعة وتغيير الضماد</option>
                  <option value="فك غرز جراحية">فك غرز جراحية</option>
                  <option value="جلسة ضبط ومتابعة تقويم">جلسة ضبط ومتابعة تقويم</option>
                  <option value="جلسة تلميع وفحص عدسات تجميلية">جلسة تلميع وفحص عدسات تجميلية</option>
                  <option value="استشارة متابعة حشو عصب">استشارة متابعة حشو عصب</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  توصيات وملاحظات الطبيب للمتابعة:
                </label>
                <textarea
                  rows={3}
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  placeholder="مثال: فحص التئام اللثة، والتأكد من ثبات الغرسة، وتفريش الأسنان بمضمضة طبية..."
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingFollowUp}
                  className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-cyan-600 hover:bg-cyan-700 transition-colors shadow-md disabled:opacity-60"
                >
                  {savingFollowUp ? <><LoadingIndicator size="sm" className="border-white border-t-amber-300" /> جاري الحفظ...</> : "حفظ المتابعة وإرسال التذكير"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
