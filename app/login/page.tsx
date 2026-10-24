"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  KeyRound,
} from "lucide-react";
import Logo from "@/components/Logo";
import { LoadingIndicator } from "@/components/BrandLoader";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "فشل تسجيل الدخول، تأكد من صحة البيانات");
      }

      // التوجيه الذكي: إذا كان مريضاً يذهب لـ /patient وإذا كان موظفاً يذهب لـ /admin
      const targetUrl = data.redirectUrl || "/admin";
      router.push(targetUrl);
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "حدث خطأ أثناء تسجيل الدخول"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-slate-50 py-8 font-sans sm:px-6 sm:py-12 lg:px-8">
      
      {/* Decorative Background Orbs */}
      <div className="absolute top-0 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-cyan-200/50 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-10 w-64 h-64 sm:w-96 sm:h-96 bg-teal-200/40 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header / Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Logo className="group justify-center transition-transform duration-200 hover:scale-[1.02]" />
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          تسجيل الدخول الموحد
        </h2>
        <p className="break-words text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
          سجل دخولك لمتابعة ملفك الطبي وحجوزاتك، أو لإدارة العيادات والفروع
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-6 px-4 sm:py-8 sm:px-10 shadow-2xl rounded-3xl border border-slate-200/80 space-y-6">
          
          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2.5 text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="break-words">{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-600" />
                البريد الإلكتروني أو رقم الهاتف
              </label>
              <input
                type="text"
                required
                dir="ltr"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="010XXXXXXXX أو admin@lavasmile.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none text-right"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-600" />
                كلمة المرور
              </label>
              <input
                type="password"
                required
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none text-right"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-black text-white bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-700 hover:to-teal-600 shadow-md shadow-cyan-600/25 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingIndicator size="sm" className="border-white border-t-amber-300" />
                  <span>جاري تسجيل الدخول...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>تسجيل الدخول</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center border-t border-slate-100 flex flex-col gap-2">
            <Link
              href="/"
              className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center justify-center gap-1"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة إلى الصفحة الرئيسية للعيادة</span>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
