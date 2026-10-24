"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Phone, MapPin, Clock, Heart, ShieldCheck } from "lucide-react";
import Logo from "@/components/Logo";

interface Branch {
  id: string;
  name: string;
  city: string;
  address: string;
}

export default function Footer() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [branchesError, setBranchesError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadBranches() {
      try {
        const response = await fetch("/api/branches", {
          signal: controller.signal,
        });
        const result: {
          success?: boolean;
          branches?: Branch[];
          message?: string;
        } = await response.json();

        if (!response.ok || !result.success || !Array.isArray(result.branches)) {
          throw new Error(result.message || "تعذر تحميل الفروع");
        }

        setBranches(result.branches);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Failed to load footer branches:", error);
        setBranchesError(
          error instanceof Error ? error.message : "تعذر تحميل الفروع حاليًا."
        );
      } finally {
        if (!controller.signal.aborted) setBranchesLoading(false);
      }
    }

    void loadBranches();
    return () => controller.abort();
  }, []);

  return (
    <footer className="border-t border-slate-200 bg-slate-50 py-14 text-slate-600 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          
          {/* Brand Col */}
   <div className="space-y-4">
  <Logo />

  <p className="text-sm leading-relaxed text-slate-600">
    المراكز المتخصصة الأولى في مصر لابتسامة هوليوود وزراعة الأسنان الفورية، بأعلى معايير التعقيم العالمية وأحدث الأجهزة الرقمية.
  </p>

  <div className="flex items-center gap-2 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3 text-xs text-slate-700">
    <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600" />
    <span>ضمان شامل ومكتوب على جميع التركيبات والزراعات</span>
  </div>
</div>

          {/* Branches Col */}
          <div className="space-y-4">
            <h4 className="border-b border-slate-200 pb-2 text-base font-black tracking-tight text-slate-900">فروعنا الحالية</h4>
            {branchesLoading ? (
              <ul aria-label="جاري تحميل الفروع" className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <li key={item} className="animate-pulse space-y-2">
                    <div className="h-4 w-2/3 rounded bg-cyan-100" />
                    <div className="h-3 w-full rounded bg-slate-100" />
                  </li>
                ))}
              </ul>
            ) : branchesError ? (
              <p role="status" className="text-xs leading-5 text-slate-500">
                {branchesError}
              </p>
            ) : branches.length === 0 ? (
              <p className="text-xs leading-5 text-slate-500">
                لا توجد فروع متاحة حاليًا.
              </p>
            ) : (
              <ul className="space-y-3 text-sm">
                {branches.map((branch) => (
                  <li key={branch.id} className="flex items-start gap-2.5">
                    <MapPin className="mt-1 h-4 w-4 shrink-0 text-cyan-600" />
                    <div className="min-w-0">
                      <span className="block break-words font-bold text-slate-900">
                        {branch.name}
                        {branch.city ? ` - ${branch.city}` : ""}
                      </span>
                      <span className="break-words text-xs text-slate-500">
                        {branch.address}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="border-b border-slate-200 pb-2 text-base font-black tracking-tight text-slate-900">روابط سريعة</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/book" className="hover:text-cyan-400 transition-colors">
                  حجز كشف جديد مع تسجيل شكوى
                </Link>
              </li>
              <li>
                <Link href="#services" className="hover:text-cyan-400 transition-colors">
                  قائمة الخدمات
                </Link>
              </li>
              <li>
                <Link href="#branches" className="hover:text-cyan-400 transition-colors">
                  مواعيد عمل الفروع
                </Link>
              </li>
              <li>

              </li>
            </ul>
          </div>

          {/* Contact Col */}
          <div className="space-y-4">
            <h4 className="border-b border-slate-200 pb-2 text-base font-black tracking-tight text-slate-900">خدمة العملاء والحجز</h4>
            <p className="text-xs text-slate-500">
              فريق الاستقبال متواجد يومياً للرد على استفساراتكم وشكاواكم طوال ساعات العمل.
            </p>
            <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span dir="ltr">01070707350</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5 text-cyan-600" />
                <span>يومياً من 10:00 صباحاً حتى 10:00 مساءً</span>
              </div>
            </div>
          </div>

        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 text-center text-xs text-slate-500 sm:flex-row">
          <p>© 2026 Lava Smile Dental Clinics. جميع الحقوق محفوظة.</p>
          <p className="flex items-center gap-1">
            صُمم بأحدث التقنيات لخدمة ابتسامتكم <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
          </p>
        </div>
      </div>
    </footer>
  );
}
