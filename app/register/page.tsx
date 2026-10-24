"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Lock,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";
import Logo from "@/components/Logo";
import { LoadingIndicator } from "@/components/BrandLoader";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "تعذر إنشاء الحساب");
      }
      router.push(result.redirectUrl || "/patient");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "حدث خطأ أثناء إنشاء الحساب"
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500";
  const labelClass = "mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700";

  return (
    <main className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-slate-50 py-8 font-sans sm:px-6 sm:py-12 lg:px-8">
      <div className="pointer-events-none absolute right-1/4 top-0 -z-10 h-64 w-64 sm:h-96 sm:w-96 rounded-full bg-cyan-200/50 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-10 -z-10 h-64 w-64 sm:h-96 sm:w-96 rounded-full bg-teal-200/40 blur-3xl" />

      <div className="mx-auto w-full max-w-md space-y-3 px-4 text-center sm:px-0">
        <Logo className="justify-center" />
        <h1 className="pt-2 text-xl sm:text-2xl font-black tracking-tight text-slate-900">
          إنشاء حساب مريض
        </h1>
        <p className="break-words text-xs sm:text-sm text-slate-500">
          أنشئ حسابك لمتابعة حجوزاتك وملفك الطبي وشكاواك
        </p>
      </div>

      <section className="mx-auto mt-7 w-full max-w-md px-4 sm:px-0">
        <div className="space-y-5 rounded-3xl border border-slate-200/80 bg-white px-4 py-6 shadow-2xl sm:px-9 sm:py-7">
          {errorMessage && (
            <div role="alert" className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span className="break-words">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="fullName" className={labelClass}>
                <UserRound className="h-3.5 w-3.5 text-cyan-600" /> الاسم بالكامل
              </label>
              <input id="fullName" name="fullName" autoComplete="name" required maxLength={120} className={inputClass} />
            </div>
            <div>
              <label htmlFor="phone" className={labelClass}>
                <Phone className="h-3.5 w-3.5 text-cyan-600" /> رقم الهاتف الأساسي
              </label>
              <input id="phone" name="phone" type="tel" dir="ltr" autoComplete="tel" required maxLength={32} className={`${inputClass} text-right`} />
            </div>
            <div>
              <label htmlFor="secondaryPhone" className={labelClass}>
                <Phone className="h-3.5 w-3.5 text-cyan-600" /> هاتف الطوارئ (اختياري)
              </label>
              <input id="secondaryPhone" name="secondaryPhone" type="tel" dir="ltr" maxLength={32} className={`${inputClass} text-right`} />
            </div>
            <div>
              <label htmlFor="email" className={labelClass}>
                <Mail className="h-3.5 w-3.5 text-cyan-600" /> البريد الإلكتروني (اختياري)
              </label>
              <input id="email" name="email" type="email" autoComplete="email" maxLength={254} className={inputClass} />
            </div>
            <div>
              <label htmlFor="password" className={labelClass}>
                <Lock className="h-3.5 w-3.5 text-cyan-600" /> كلمة المرور
              </label>
              <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} className={inputClass} />
              <p className="mt-1 text-[11px] text-slate-500">8 أحرف على الأقل</p>
            </div>
            <div>
              <label htmlFor="address" className={labelClass}>
                <MapPin className="h-3.5 w-3.5 text-cyan-600" /> العنوان (اختياري)
              </label>
              <input id="address" name="address" autoComplete="street-address" maxLength={500} className={inputClass} />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 px-4 py-3.5 text-sm font-black text-white shadow-md shadow-cyan-600/25 transition-all hover:from-cyan-700 hover:to-teal-600 disabled:cursor-wait disabled:opacity-60"
            >
              {loading ? <><LoadingIndicator size="sm" className="border-white border-t-amber-300" /> جارٍ إنشاء الحساب...</> : "إنشاء حسابي"}
            </button>
          </form>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-slate-600">
              لديك حساب بالفعل؟{" "}
              <Link href="/login" className="font-black text-cyan-700 hover:text-cyan-800">
                سجل الدخول
              </Link>
            </p>
            <Link href="/" className="flex items-center justify-center gap-1 text-xs font-bold text-slate-500 hover:text-cyan-700">
              <ArrowRight className="h-3.5 w-3.5" /> العودة للرئيسية
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
