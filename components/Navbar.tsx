"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, LayoutDashboard, LogOut, Menu, User, UserPlus, X } from "lucide-react";
import Logo from "@/components/Logo";
import { LoadingIndicator } from "@/components/BrandLoader";

interface NavbarUser {
  name: string;
  role: "PATIENT" | "SUPER_ADMIN" | "BRANCH_ADMIN" | "DOCTOR" | "RECEPTIONIST";
}

export default function Navbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<NavbarUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch("/api/auth/me");
        const result = await response.json();
        if (response.status === 401) return;
        if (!response.ok || !result.success || !result.user) {
          throw new Error(result.message || "تعذر التحقق من جلسة المستخدم");
        }
        setCurrentUser(result.user);
      } catch (error) {
        console.error("Failed to load navbar session:", error);
        setAuthError(
          error instanceof Error ? error.message : "تعذر التحقق من الجلسة"
        );
      } finally {
        setAuthChecked(true);
      }
    }
    loadSession();
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    setAuthError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "تعذر تسجيل الخروج");
      }
      setCurrentUser(null);
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      setAuthError(error instanceof Error ? error.message : "تعذر تسجيل الخروج");
      setLoggingOut(false);
    }
  }

  const isPatient = currentUser?.role === "PATIENT";
  const isStaff = Boolean(currentUser && !isPatient);
  const authActions = authChecked ? (
    currentUser ? (
      <>
        <span className="max-w-36 truncate text-xs font-bold text-slate-600">
          {currentUser.name}
        </span>
        <Link
          href={isPatient ? "/patient" : "/admin"}
          className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-xs font-bold text-cyan-800 transition-colors hover:bg-cyan-100"
        >
          {isStaff ? <LayoutDashboard className="h-4 w-4" /> : <User className="h-4 w-4" />}
          {isStaff ? "لوحة التحكم" : "حسابي / حجوزاتي وشكاواي"}
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-60"
        >
          <LogOut className="h-4 w-4" />
          {loggingOut ? <><LoadingIndicator size="sm" /> جارٍ الخروج...</> : "تسجيل الخروج"}
        </button>
      </>
    ) : (
      <>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200"
        >
          <User className="h-4 w-4 text-cyan-600" />
          تسجيل الدخول
        </Link>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-xs font-bold text-cyan-800 transition-colors hover:bg-cyan-100"
        >
          <UserPlus className="h-4 w-4" />
          إنشاء حساب مريض
        </Link>
      </>
    )
  ) : null;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-[#F4F7F8]/90 py-2 shadow-sm shadow-slate-900/[0.03] backdrop-blur-md">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
        <div className="flex min-h-16 items-center justify-between gap-3 rounded-full border border-[#E3EAEE] bg-white px-4 py-2 shadow-sm sm:px-6">
          
          <Logo className="group transition-transform duration-200 hover:scale-[1.02]" />

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-5 text-sm font-bold text-slate-600">
            <Link href="/" className="hover:text-cyan-600 transition-colors">الرئيسية</Link>
            <Link href="#branches" className="hover:text-cyan-600 transition-colors">فروعنا</Link>
            <Link href="#services" className="hover:text-cyan-600 transition-colors">خدماتنا</Link>
            <Link href="#features" className="hover:text-cyan-600 transition-colors">لماذا لاڤا؟</Link>
            <Link href="#testimonials" className="hover:text-cyan-600 transition-colors">قصص النجاح</Link>
          </nav>

          {/* Action Buttons */}
          <div className="hidden xl:flex flex-wrap items-center justify-end gap-2">
            {authActions}
            {authError && <span role="alert" className="max-w-40 text-xs font-bold text-rose-700">{authError}</span>}
            <Link
              href="/book"
              className="inline-flex min-h-12 items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-700 hover:to-teal-600 shadow-md shadow-cyan-500/25 transition-all hover:shadow-lg active:scale-95"
            >
              <Calendar className="w-4 h-4" />
              احجز كشفك الآن
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex shrink-0 xl:hidden items-center gap-2">
            <Link
              href="/book"
              className="px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-cyan-600"
            >
              حجز
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="القائمة"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="xl:hidden max-h-[calc(100svh-5rem)] overflow-y-auto border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-bold text-slate-700 hover:bg-slate-50"
          >
            الرئيسية
          </Link>
          <Link href="#branches" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-lg text-base font-bold text-slate-700 hover:bg-slate-50">
            فروعنا
          </Link>
          <Link
            href="#services"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-bold text-slate-700 hover:bg-slate-50"
          >
            خدماتنا
          </Link>
          <Link
            href="#features"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-bold text-slate-700 hover:bg-slate-50"
          >
            لماذا لاڤا؟
          </Link>
          <Link
            href="#testimonials"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-bold text-slate-700 hover:bg-slate-50"
          >
            قصص النجاح
          </Link>
          {authChecked && (currentUser ? (
            <>
              <div className="px-3 py-2 text-xs font-bold text-slate-500">{currentUser.name}</div>
              <Link
                href={isStaff ? "/admin" : "/patient"}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 rounded-lg bg-cyan-50 px-3 py-2 text-base font-bold text-cyan-800"
              >
                {isStaff ? <LayoutDashboard className="h-4 w-4" /> : <User className="h-4 w-4" />}
                {isStaff ? "لوحة التحكم" : "حسابي / حجوزاتي وشكاواي"}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-left text-base font-bold text-rose-700 disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />
                {loggingOut ? <><LoadingIndicator size="sm" /> جارٍ الخروج...</> : "تسجيل الخروج"}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setIsOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-base font-bold text-slate-700 hover:bg-slate-50">
                <User className="h-4 w-4 text-cyan-600" /> تسجيل الدخول
              </Link>
              <Link href="/register" onClick={() => setIsOpen(false)} className="flex items-center gap-2 rounded-lg bg-cyan-50 px-3 py-2 text-base font-bold text-cyan-800">
                <UserPlus className="h-4 w-4" /> إنشاء حساب مريض
              </Link>
            </>
          ))}
          {authError && <p role="alert" className="px-3 text-xs font-bold text-rose-700">{authError}</p>}
          <Link
            href="/book"
            onClick={() => setIsOpen(false)}
            className="block text-center py-3 rounded-xl text-base font-bold text-white bg-gradient-to-r from-cyan-600 to-teal-500 shadow-md"
          >
            احجز موعدك وسجل شكواك
          </Link>
        </div>
      )}
    </header>
  );
}
