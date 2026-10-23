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
  MessageCircle,
  HeartPulse,
  History,
} from "lucide-react";

interface Branch {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  workingHours: string;
  mapUrl?: string | null;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "BRANCH_ADMIN" | "DOCTOR" | "RECEPTIONIST";
  branchId?: string | null;
  branch?: {
    id: string;
    name: string;
    city: string;
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

interface CurrentUser {
  userId: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "BRANCH_ADMIN" | "DOCTOR" | "RECEPTIONIST";
  branchId?: string | null;
  branchName?: string | null;
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

  // Modal State for Adding User
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"SUPER_ADMIN" | "BRANCH_ADMIN" | "RECEPTIONIST" | "DOCTOR">("RECEPTIONIST");
  const [newUserBranchId, setNewUserBranchId] = useState("");
  const [savingUser, setSavingUser] = useState(false);
  const [userModalError, setUserModalError] = useState("");

  // Load User Info
  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
          if (data.user.role === "RECEPTIONIST" && data.user.branchId) {
            setSelectedBranchId(data.user.branchId);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user session:", err);
      }
    }
    fetchMe();
  }, []);

  // Load Data
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [branchesRes, appointmentsRes, followUpsRes, patientsRes] = await Promise.all([
        fetch("/api/branches"),
        fetch(`/api/appointments?branchId=${selectedBranchId}`),
        fetch(`/api/follow-ups?branchId=${selectedBranchId}`),
        fetch("/api/patients"),
      ]);

      const bData = await branchesRes.json();
      const aData = await appointmentsRes.json();
      const fData = await followUpsRes.json();
      const pData = await patientsRes.json();

      if (bData.success) setBranches(bData.branches);
      if (aData.success) setAppointments(aData.appointments);
      if (fData.success) setFollowUps(fData.followUps);
      if (pData.success) setPatientsList(pData.patients);

      if (currentUser?.role === "SUPER_ADMIN" || !currentUser) {
        const usersRes = await fetch("/api/users");
        const uData = await usersRes.json();
        if (uData.success) setUsersList(uData.users);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
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
  const updateAppointmentStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setAppointments((prev) =>
          prev.map((apt) => (apt.id === id ? { ...apt, status: newStatus as any } : apt))
        );
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  // Update follow-up status
  const updateFollowUpStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/follow-ups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setFollowUps((prev) =>
          prev.map((f) => (f.id === id ? { ...f, status: newStatus as any } : f))
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
    } catch (err: any) {
      setUserModalError(err.message || "حدث خطأ أثناء إضافة المستخدم");
    } finally {
      setSavingUser(false);
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
  const filteredAppointments = appointments.filter((apt) => {
    const matchesStatus = statusFilter === "ALL" || apt.status === statusFilter;
    const matchesNoteType = noteTypeFilter === "ALL" || apt.noteType === noteTypeFilter;
    const matchesSearch =
      searchQuery === "" ||
      apt.patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.patient.phone.includes(searchQuery) ||
      apt.branch.name.includes(searchQuery);

    return matchesStatus && matchesNoteType && matchesSearch;
  });

  // Filter Patients
  const filteredPatients = patientsList.filter((p) => {
    if (!patientSearchQuery.trim()) return true;
    const q = patientSearchQuery.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      (p.nationalId && p.nationalId.includes(q)) ||
      (p.address && p.address.toLowerCase().includes(q))
    );
  });

  // Calculate KPIs
  const totalAppointmentsCount = appointments.length;
  const pendingAppointmentsCount = appointments.filter((a) => a.status === "PENDING").length;
  const confirmedAppointmentsCount = appointments.filter((a) => a.status === "CONFIRMED").length;
  const complaintsCount = appointments.filter((a) => a.noteType === "COMPLAINT").length;
  const suggestionsCount = appointments.filter((a) => a.noteType === "SUGGESTION").length;
  const scheduledFollowUpsCount = followUps.filter((f) => f.status === "SCHEDULED").length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <header className="bg-white text-slate-900 border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-black shadow-sm group-hover:scale-105 transition-transform duration-200">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 200 260" 
                  className="w-6 h-6 fill-current"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-slate-900">
                  LAVA <span className="text-blue-600">DASHBOARD</span>
                </span>
                <span className="text-[10px] text-slate-500 font-semibold tracking-wider">
                  الإدارة العامة للحالات والفروع والموظفين
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  {currentUser.name.slice(0, 1)}
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 block text-xs">{currentUser.name}</span>
                  <span className="text-[10px] text-blue-600 font-semibold">
                    {currentUser.role === "SUPER_ADMIN" ? "👑 المدير العام" : `🏢 ${currentUser.branchName || "استقبال"}`}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors flex items-center gap-1.5"
              title="تسجيل الخروج"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">خروج</span>
            </button>

            <Link
              href="/"
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors flex items-center gap-1.5"
            >
              <span>الموقع</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </Link>
          </div>

        </div>
      </header>
      {/* Main Content */}
<main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
        
        {/* Top Header & Branch Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              لوحة التحكم والإشراف الشامل
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {currentUser?.role === "SUPER_ADMIN"
                ? "أنت متصل بصلاحية المدير العام: يمكنك متابعة كافة الحالات شخصياً، التواصل مع أي مريض مباشرة هاتفياً أو واتساب، والتحكم في الموظفين وباسوورداتهم."
                : `أنت متصل بصلاحية: ${currentUser?.branchName || "استقبال الفرع"}`}
            </p>
          </div>

          {/* Branch Switcher Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {currentUser?.role === "SUPER_ADMIN" && (
              <button
                onClick={() => setSelectedBranchId("ALL")}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 ${
                  selectedBranchId === "ALL"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 ring-2 ring-blue-600/20"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                🏢 كل الفروع ({branches.length})
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
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 flex items-center gap-1.5 ${
                    selectedBranchId === b.id
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-[11px] font-bold text-slate-500">إجمالي الحجوزات</span>
            <div className="text-3xl font-black text-slate-900">{totalAppointmentsCount}</div>
            <div className="text-[10px] text-slate-400 font-semibold">بكل الفروع المحددة</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm space-y-2">
            <span className="text-[11px] font-bold text-blue-700 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              إجمالي المرضى
            </span>
            <div className="text-3xl font-black text-blue-600">{patientsList.length}</div>
            <div className="text-[10px] text-blue-600/80 font-semibold">ملف طبي مسجل</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-sm space-y-2">
            <span className="text-[11px] font-bold text-amber-700">قيد المراجعة</span>
            <div className="text-3xl font-black text-amber-600">{pendingAppointmentsCount}</div>
            <div className="text-[10px] text-amber-600/80 font-semibold">تحتاج تأكيد الاستقبال</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-sm space-y-2">
            <span className="text-[11px] font-bold text-rose-700 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              شكاوى الحالات
            </span>
            <div className="text-3xl font-black text-rose-600">{complaintsCount}</div>
            <div className="text-[10px] text-rose-600/80 font-semibold">شكاوى ألم وحالات طارئة</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-sm space-y-2">
            <span className="text-[11px] font-bold text-emerald-700">حجوزات مؤكدة</span>
            <div className="text-3xl font-black text-emerald-600">{confirmedAppointmentsCount}</div>
            <div className="text-[10px] text-emerald-600/80 font-semibold">مجدولة للحضور</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-indigo-200/80 shadow-sm space-y-2">
            <span className="text-[11px] font-bold text-indigo-700 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              متابعات دورية
            </span>
            <div className="text-3xl font-black text-indigo-600">{scheduledFollowUpsCount}</div>
            <div className="text-[10px] text-indigo-600/80 font-semibold">مواعيد كشف تالية</div>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-4 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("APPOINTMENTS")}
            className={`pb-4 px-2 text-sm font-black border-b-2 transition-all shrink-0 flex items-center gap-2 ${
              activeTab === "APPOINTMENTS"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>سجل الحجوزات والشكاوى ({filteredAppointments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("PATIENTS")}
            className={`pb-4 px-2 text-sm font-black border-b-2 transition-all shrink-0 flex items-center gap-2 ${
              activeTab === "PATIENTS"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>سجل الحالات والاتصال المباشر ({filteredPatients.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("FOLLOWUPS")}
            className={`pb-4 px-2 text-sm font-black border-b-2 transition-all shrink-0 flex items-center gap-2 ${
              activeTab === "FOLLOWUPS"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>نظام المتابعة والتذكير ({followUps.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("BRANCHES")}
            className={`pb-4 px-2 text-sm font-black border-b-2 transition-all shrink-0 flex items-center gap-2 ${
              activeTab === "BRANCHES"
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
              className={`pb-4 px-2 text-sm font-black border-b-2 transition-all shrink-0 flex items-center gap-2 ${
                activeTab === "USERS"
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
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
              
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

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
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
                            <div className="flex items-center gap-2">
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
                                📞 {apt.patient.phone}
                              </a>
                              {apt.patient.secondaryPhone && (
                                <span className="text-slate-500" dir="ltr">
                                  📱 طوارئ: {apt.patient.secondaryPhone}
                                </span>
                              )}
                              {apt.patient.address && (
                                <span>📍 {apt.patient.address}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-xl text-xs font-black ${
                              apt.status === "PENDING"
                                ? "bg-amber-100 text-amber-800"
                                : apt.status === "CONFIRMED"
                                ? "bg-emerald-100 text-emerald-800"
                                : apt.status === "COMPLETED"
                                ? "bg-indigo-100 text-indigo-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {apt.status === "PENDING" && "⏳ قيد المراجعة"}
                            {apt.status === "CONFIRMED" && "✔️ حجز مؤكد"}
                            {apt.status === "COMPLETED" && "✨ اكتمل العلاج"}
                            {apt.status === "CANCELLED" && "❌ ملغي"}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-slate-400 block mb-0.5">الخدمة المطلوبة:</span>
                          <span className="font-bold text-slate-900 text-sm">
                            {apt.service?.name || "كشف وتشخيص عام"}
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

                      {apt.noteType === "COMPLAINT" && apt.patientComplaint && (
                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-black text-rose-800">
                            <AlertCircle className="w-4 h-4 text-rose-600" />
                            <span>شكوى المريض ووصف الألم:</span>
                          </div>
                          <p className="text-rose-900 font-semibold leading-relaxed">
                            "{apt.patientComplaint}"
                          </p>
                          {apt.painLocation && (
                            <span className="inline-block mt-1 font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-lg">
                              🎯 السن / موضع الألم: {apt.painLocation}
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
                            "{apt.patientSuggestion}"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          {complaintsCount > 0 && (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-rose-100 text-rose-800 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {complaintsCount} شكوى
                            </span>
                          )}
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-slate-100 text-slate-700">
                            {totalVisits} زيارة
                          </span>
                        </div>
                      </div>

                      {/* Contact & Personal Data */}
                      <div className="space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">الهاتف الأساسي:</span>
                          <span className="font-bold text-slate-900 font-mono" dir="ltr">{p.phone}</span>
                        </div>
                        {p.secondaryPhone && (
                          <div className="flex items-center justify-between">
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
                            <span className="text-slate-800">{p.address}</span>
                          </div>
                        )}
                        {p.allergies && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">الحساسية:</span>
                            <span className="text-rose-600 font-bold">{p.allergies}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Direct Contact Actions */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
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
            <div className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">نظام المتابعة والتذكير الدوري للمرضى</h3>
                <p className="text-xs text-slate-500">
                  متابعة حالات ما بعد الزراعة، فك الغرز، جلسات التقويم، والتأكد من رضا المرضى.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
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
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${
                                f.status === "SCHEDULED"
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
            <div className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                      <div className="grid grid-cols-2 gap-2 text-center pt-1">
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
                  setUserModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-xl font-black text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة مستخدم جديد</span>
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
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
                              className={`px-3 py-1 rounded-xl text-[11px] font-black ${
                                u.role === "SUPER_ADMIN"
                                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                                  : u.role === "BRANCH_ADMIN"
                                  ? "bg-indigo-100 text-indigo-800"
                                  : u.role === "DOCTOR"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {u.role === "SUPER_ADMIN" && "👑 مدير عام"}
                              {u.role === "BRANCH_ADMIN" && "🏢 مدير فرع"}
                              {u.role === "DOCTOR" && "🩺 طبيب معالج"}
                              {u.role === "RECEPTIONIST" && "🧑‍💼 موظف استقبال"}
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
                            {!isMe && (
                              <button
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors inline-flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>حذف</span>
                              </button>
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

      </main>

      {/* MODAL: PATIENT FULL COMPREHENSIVE PROFILE & COMPLAINTS HISTORY */}
  {selectedPatientForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in overflow-y-auto font-sans">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-6 animate-in zoom-in-95 my-8">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">{selectedPatientForModal.fullName}</h3>
                  <span className="text-xs text-slate-500">الملف الطبي الشامل وسجل الشكاوى والزيارات</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatientForModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Direct Contact Bar */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">الهاتف المباشر للتواصل:</span>
                <span className="text-base font-black text-slate-900 font-mono" dir="ltr">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
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
                  <span className="font-bold text-slate-900">{selectedPatientForModal.address}</span>
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

              {selectedPatientForModal.appointments && selectedPatientForModal.appointments.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {selectedPatientForModal.appointments.map((a: any) => (
                    <div key={a.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-800">{a.branch.name} — {a.service?.name || "كشف عام"}</span>
                        <span className="text-slate-400">{new Date(a.appointmentDate).toLocaleDateString("ar-EG")}</span>
                      </div>

                      {a.patientComplaint && (
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 font-semibold">
                          <span className="font-bold block text-rose-800 mb-0.5">⚠️ الشكوى المسجلة:</span>
                          "{a.patientComplaint}"
                          {a.painLocation && <span className="block mt-1 text-rose-700">🎯 موضع الألم: {a.painLocation}</span>}
                        </div>
                      )}

                      {a.patientSuggestion && (
                        <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
                          <span className="font-bold block text-blue-800 mb-0.5">💡 المقترح:</span>
                          "{a.patientSuggestion}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">لا توجد شكاوى مسجلة لهذا المريض.</p>
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
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
                    {savingNewPassword ? "جاري التحديث..." : "حفظ وتعيين كلمة المرور"}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* MODAL: ADD NEW BRANCH */}
      {branchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
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

              <div className="grid grid-cols-2 gap-3">
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
                  {savingBranch ? "جاري الحفظ..." : "حفظ وإضافة الفرع"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW USER */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الصلاحية الممنوحة *
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e: any) => setNewUserRole(e.target.value)}
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
                    onChange={(e) => setNewUserBranchId(e.target.value)}
                    disabled={newUserRole === "SUPER_ADMIN"}
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
                  {savingUser ? "جاري الإنشاء..." : "إنشاء المستخدم وحفظ الصلاحيات"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SCHEDULE FOLLOW-UP */}
      {modalOpen && activeAppointmentForFollowUp && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
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
                  {savingFollowUp ? "جاري الحفظ..." : "حفظ المتابعة وإرسال التذكير"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
