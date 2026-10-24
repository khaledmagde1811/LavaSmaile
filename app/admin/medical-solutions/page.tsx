"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Edit2,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import BrandLoader, { LoadingIndicator } from "@/components/BrandLoader";

interface MedicalSolution {
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
}

export default function AdminMedicalSolutionsPage() {
  const [solutions, setSolutions] = useState<MedicalSolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MedicalSolution | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  const loadSolutions = useCallback(async () => {
    try {
      const response = await fetch("/api/medical-solutions?all=true");
      const data = await response.json();
      if (response.status === 403) {
        setAccessDenied(true);
        return;
      }
      if (!response.ok || !data.success) {
        throw new Error(data.message || "فشل في جلب الخدمات الطبية");
      }
      setSolutions(data.solutions);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل في جلب الخدمات الطبية");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const response = await fetch("/api/medical-solutions?all=true");
        const data = await response.json();
        if (response.status === 403) {
          if (isMounted) setAccessDenied(true);
          return;
        }
        if (!response.ok || !data.success) {
          throw new Error(data.message || "فشل في جلب الخدمات الطبية");
        }
        if (isMounted) setSolutions(data.solutions);
      } catch (error) {
        if (isMounted) toast.error(error instanceof Error ? error.message : "فشل في جلب الخدمات الطبية");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    void load();
    return () => { isMounted = false; };
  }, []);

  const saveSolution = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const body = {
      titleAr: form.get("titleAr"),
      titleEn: form.get("titleEn"),
      slug: form.get("slug"),
      shortDescription: form.get("shortDescription"),
      content: form.get("content"),
      price: form.get("price"),
      icon: form.get("icon"),
      imageUrl: form.get("imageUrl"),
      category: form.get("category"),
      isActive: form.get("isActive") === "on",
      displayOrder: form.get("displayOrder"),
    };

    try {
      const response = await fetch(
        editing ? `/api/medical-solutions/${editing.id}` : "/api/medical-solutions",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "فشل حفظ الخدمة الطبية");
      }
      toast.success(editing ? "تم تحديث الخدمة الطبية" : "تمت إضافة الخدمة الطبية");
      setModalOpen(false);
      setEditing(null);
      await loadSolutions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل حفظ الخدمة الطبية");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (solution: MedicalSolution) => {
    try {
      const response = await fetch(`/api/medical-solutions/${solution.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !solution.isActive }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "فشل تحديث حالة الخدمة");
      }
      setSolutions((current) =>
        current.map((item) => item.id === solution.id ? data.solution : item)
      );
      toast.success("تم تحديث حالة الخدمة");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل تحديث حالة الخدمة");
    }
  };

  const deleteSolution = async (solution: MedicalSolution) => {
    if (!window.confirm(`هل تريد حذف الخدمة «${solution.titleAr}»؟`)) return;
    try {
      const response = await fetch(`/api/medical-solutions/${solution.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "فشل حذف الخدمة");
      }
      setSolutions((current) => current.filter((item) => item.id !== solution.id));
      toast.success("تم حذف الخدمة الطبية");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل حذف الخدمة");
    }
  };

  if (accessDenied) {
    return (
      <main dir="rtl" className="min-h-screen bg-slate-50 p-6">
        <Toaster position="top-center" />
        <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold">غير مصرح لك بإدارة الخدمات الطبية</h1>
          <p className="mt-2 text-sm text-slate-600">هذه الصفحة متاحة للمدير العام فقط.</p>
          <Link href="/admin" className="mt-5 inline-flex items-center gap-2 font-bold text-blue-600">
            العودة إلى لوحة الإدارة <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 p-4 text-slate-900 sm:p-8">
      <Toaster position="top-center" />
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-6">
          <div>
            <Link href="/admin" className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
              <ArrowRight size={16} /> لوحة الإدارة
            </Link>
            <h1 className="text-2xl font-black">إدارة الحلول والخدمات الطبية</h1>
            <p className="mt-1 text-sm text-slate-500">أدر الخدمات المعروضة في قسم الحلول الطبية على الصفحة الرئيسية.</p>
          </div>
          <button
            type="button"
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-500 px-4 py-3 font-bold text-white shadow-md shadow-cyan-500/20 transition-all hover:from-cyan-700 hover:to-sky-600 active:scale-95"
          >
            <Plus size={20} /> إضافة خدمة طبية
          </button>
        </header>

        {loading ? (
          <BrandLoader message="جاري تحميل الخدمات..." />
        ) : solutions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            لا توجد خدمات طبية بعد. أضف أول خدمة لتظهر في الصفحة الرئيسية.
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {solutions.map((solution) => (
              <article key={solution.id} className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all hover:border-cyan-300 hover:shadow-md">
                {solution.imageUrl ? (
                  <div className="relative h-44 bg-slate-100">
                    <Image src={solution.imageUrl} alt={solution.titleAr} fill unoptimized sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-24 items-center justify-center bg-blue-50 text-sm font-bold text-blue-600">
                    {solution.icon || "Medical solution"}
                  </div>
                )}
                <div className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold">{solution.titleAr}</h2>
                      {solution.titleEn && <p className="mt-1 text-xs text-slate-500" dir="ltr">{solution.titleEn}</p>}
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${solution.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {solution.isActive ? "نشط" : "متوقف"}
                    </span>
                  </div>
                  <p className="line-clamp-3 min-h-12 text-sm leading-6 text-slate-500">{solution.shortDescription}</p>
                  {solution.price !== null && (
                    <p className="text-sm font-bold text-blue-700">
                      السعر: {solution.price.toLocaleString("ar-EG")} ج.م
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-3 py-1" dir="ltr">{solution.slug}</span>
                    {solution.category && <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{solution.category}</span>}
                    <span className="rounded-full bg-slate-100 px-3 py-1">الترتيب: {solution.displayOrder}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <button type="button" onClick={() => void toggleActive(solution)} className="rounded-lg bg-slate-50 p-2 text-slate-600" title={solution.isActive ? "إيقاف الخدمة" : "تفعيل الخدمة"}>
                      {solution.isActive ? <ToggleRight /> : <ToggleLeft />}
                    </button>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { setEditing(solution); setModalOpen(true); }} className="rounded-lg bg-blue-50 p-2 text-blue-600" title="تعديل الخدمة">
                        <Edit2 size={18} />
                      </button>
                      <button type="button" onClick={() => void deleteSolution(solution)} className="rounded-lg bg-rose-50 p-2 text-rose-600" title="حذف الخدمة">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4">
          <div className="my-auto max-h-[90vh] w-[95%] max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl sm:w-full sm:p-6">
            <h2 className="mb-5 -mx-4 -mt-4 border-b border-cyan-100 bg-cyan-50/60 px-4 py-4 text-xl font-black sm:-mx-6 sm:-mt-6 sm:px-6">{editing ? "تعديل الخدمة الطبية" : "إضافة خدمة طبية"}</h2>
            <form key={editing?.id ?? "new"} onSubmit={saveSolution} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold">
                  العنوان بالعربية *
                  <input name="titleAr" defaultValue={editing?.titleAr ?? ""} required maxLength={160} className="mt-1 w-full rounded-lg border border-slate-300 p-3" />
                </label>
                <label className="block text-sm font-semibold">
                  العنوان بالإنجليزية
                  <input name="titleEn" defaultValue={editing?.titleEn ?? ""} maxLength={160} dir="ltr" className="mt-1 w-full rounded-lg border border-slate-300 p-3" />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold">
                  المعرّف (Slug) *
                  <input name="slug" defaultValue={editing?.slug ?? ""} required maxLength={120} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" dir="ltr" placeholder="dental-implants" className="mt-1 w-full rounded-lg border border-slate-300 p-3" />
                </label>
                <label className="block text-sm font-semibold">
                  التصنيف
                  <input name="category" defaultValue={editing?.category ?? ""} maxLength={100} placeholder="تجميل الأسنان" className="mt-1 w-full rounded-lg border border-slate-300 p-3" />
                </label>
              </div>
              <label className="block text-sm font-semibold">
                الوصف المختصر *
                <textarea name="shortDescription" defaultValue={editing?.shortDescription ?? ""} required maxLength={500} rows={2} className="mt-1 w-full rounded-lg border border-slate-300 p-3" />
              </label>
              <label className="block text-sm font-semibold">
                التفاصيل الكاملة
                <textarea name="content" defaultValue={editing?.content ?? ""} maxLength={10000} rows={4} className="mt-1 w-full rounded-lg border border-slate-300 p-3" />
              </label>
              <label className="block text-sm font-semibold">
                السعر (اختياري، بالجنيه المصري)
                <input name="price" type="number" min="0" step="0.01" defaultValue={editing?.price ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 p-3" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold">
                  اسم أيقونة Lucide (مثال: Sparkles)
                  <input name="icon" defaultValue={editing?.icon ?? ""} maxLength={80} dir="ltr" placeholder="Sparkles" className="mt-1 w-full rounded-lg border border-slate-300 p-3" />
                </label>
                <label className="block text-sm font-semibold">
                  رابط الصورة (اختياري)
                  <input name="imageUrl" type="url" defaultValue={editing?.imageUrl ?? ""} placeholder="https://example.com/image.jpg" dir="ltr" className="mt-1 w-full rounded-lg border border-slate-300 p-3" />
                </label>
              </div>
              <label className="block text-sm font-semibold">
                ترتيب الظهور
                <input name="displayOrder" type="number" min="0" max="100000" step="1" defaultValue={editing?.displayOrder ?? 0} className="mt-1 w-full rounded-lg border border-slate-300 p-3" />
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input name="isActive" type="checkbox" defaultChecked={editing?.isActive ?? true} className="h-4 w-4 accent-blue-600" />
                الخدمة نشطة وتظهر للزوار
              </label>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setModalOpen(false)} disabled={saving} className="rounded-lg px-4 py-2 font-semibold text-slate-600">إلغاء</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-gradient-to-r from-cyan-600 to-sky-500 px-5 py-2 font-bold text-white shadow-sm shadow-cyan-500/20 transition-all hover:from-cyan-700 hover:to-sky-600 disabled:opacity-60">
                  {saving ? <><LoadingIndicator size="sm" className="border-white border-t-amber-300" /> جارٍ الحفظ...</> : "حفظ الخدمة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
