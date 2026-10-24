"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Edit2, ImagePlus, ShieldCheck, Trash2 } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import BrandLoader from "@/components/BrandLoader";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface TreatmentResult {
  id: string;
  procedure: string;
  branchName: string;
  consentReference: string;
  beforeImagePath: string | null;
  afterImagePath: string | null;
  beforeImageUrl: string | null;
  afterImageUrl: string | null;
  patientConsent: boolean;
  consentConfirmedAt: string | null;
  consentRevokedAt: string | null;
  isPublished: boolean;
  displayOrder: number;
}

export default function AdminTreatmentResultsPage() {
  const [results, setResults] = useState<TreatmentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [editingResult, setEditingResult] = useState<TreatmentResult | null>(null);
  const [editProcedure, setEditProcedure] = useState("");
  const [editBranchName, setEditBranchName] = useState("");
  const [editDisplayOrder, setEditDisplayOrder] = useState("0");
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchResults = useCallback(async () => {
    try {
      const response = await fetch("/api/treatment-results?all=true");
      const data = await response.json();
      if (response.status === 403) {
        setAccessDenied(true);
        return;
      }
      if (!response.ok || !data.success || !Array.isArray(data.treatmentResults)) {
        throw new Error(data.message || "تعذر تحميل نتائج العلاج.");
      }
      setResults(data.treatmentResults);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحميل نتائج العلاج.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadResults() {
      try {
        const response = await fetch("/api/treatment-results?all=true");
        const data = await response.json();
        if (response.status === 403) {
          if (active) setAccessDenied(true);
          return;
        }
        if (!response.ok || !data.success || !Array.isArray(data.treatmentResults)) {
          throw new Error(data.message || "تعذر تحميل نتائج العلاج.");
        }
        if (active) setResults(data.treatmentResults);
      } catch (error) {
        if (active) {
          toast.error(error instanceof Error ? error.message : "تعذر تحميل نتائج العلاج.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadResults();
    return () => {
      active = false;
    };
  }, []);

  const uploadImage = async (file: File) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error("يسمح فقط بصور JPEG وPNG وWebP.");
    }
    if (file.size === 0 || file.size > MAX_IMAGE_SIZE) {
      throw new Error("يجب ألا يتجاوز حجم الصورة 8 ميجابايت.");
    }

    const signedUrlResponse = await fetch("/api/treatment-results/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType: file.type }),
    });
    const signedUrlData = await signedUrlResponse.json();
    if (!signedUrlResponse.ok || !signedUrlData.success) {
      throw new Error(signedUrlData.message || "تعذر تجهيز رفع الصورة.");
    }
    if (typeof signedUrlData.path !== "string" || typeof signedUrlData.token !== "string") {
      throw new Error("استجابة تجهيز رفع الصورة غير صالحة.");
    }

    const client = createBrowserSupabaseClient();
    const { error } = await client.storage
      .from("treatment-results")
      .uploadToSignedUrl(signedUrlData.path, signedUrlData.token, file, {
        contentType: file.type,
        upsert: false,
      });
    if (error) throw new Error(error.message || "فشل رفع الصورة.");
    return signedUrlData.path;
  };

  const cleanupUploads = async (paths: string[]) => {
    if (paths.length === 0) return;
    const response = await fetch("/api/treatment-results/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paths }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "تعذر حذف الصور التي لم ترتبط بنتيجة.");
    }
  };

  const createTreatmentResult = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const beforeImage = formData.get("beforeImage");
    const afterImage = formData.get("afterImage");
    const uploadedPaths: string[] = [];

    try {
      if (!(beforeImage instanceof File) || !(afterImage instanceof File)) {
        throw new Error("اختر صورة قبل العلاج وصورة بعده.");
      }

      const beforeImagePath = await uploadImage(beforeImage);
      uploadedPaths.push(beforeImagePath);
      const afterImagePath = await uploadImage(afterImage);
      uploadedPaths.push(afterImagePath);

      const response = await fetch("/api/treatment-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          procedure: formData.get("procedure"),
          branchName: formData.get("branchName"),
          consentReference: formData.get("consentReference"),
          displayOrder: Number(formData.get("displayOrder") || 0),
          beforeImagePath,
          afterImagePath,
          patientConsent: formData.get("patientConsent") === "on",
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "تعذر حفظ نتيجة العلاج.");
      }

      uploadedPaths.length = 0;
      form.reset();
      toast.success("تم حفظ الحالة كمسودة. انشرها بعد مراجعة الصور والبيانات.");
      await fetchResults();
    } catch (error) {
      let message = error instanceof Error ? error.message : "تعذر إضافة النتيجة.";
      try {
        await cleanupUploads(uploadedPaths);
      } catch (cleanupError) {
        console.error("Failed to clean up uploaded treatment images:", cleanupError);
        message += " كما تعذر تنظيف الصور المرفوعة؛ تحقق من مساحة التخزين.";
      }
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const updatePublication = async (result: TreatmentResult) => {
    try {
      const response = await fetch(`/api/treatment-results/${result.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !result.isPublished }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "تعذر تحديث حالة النشر.");
      }
      setResults((current) =>
        current.map((item) => item.id === result.id ? data.treatmentResult : item)
      );
      toast.success(data.treatmentResult.isPublished ? "تم نشر النتيجة." : "تم إخفاء النتيجة.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحديث حالة النشر.");
    }
  };

  const editResult = (result: TreatmentResult) => {
    setEditingResult(result);
    setEditProcedure(result.procedure);
    setEditBranchName(result.branchName);
    setEditDisplayOrder(String(result.displayOrder));
  };

  const saveResultDetails = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingResult) return;
    setSavingEdit(true);
    try {
      const response = await fetch(`/api/treatment-results/${editingResult.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          procedure: editProcedure,
          branchName: editBranchName,
          displayOrder: Number(editDisplayOrder),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "تعذر تحديث بيانات الحالة.");
      }
      setResults((current) =>
        current.map((item) => item.id === editingResult.id ? data.treatmentResult : item)
      );
      setEditingResult(null);
      toast.success("تم تحديث بيانات الحالة.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحديث بيانات الحالة.");
    } finally {
      setSavingEdit(false);
    }
  };

  const revokeConsent = async (result: TreatmentResult) => {
    if (
      !window.confirm(
        `هل تأكدت من سحب موافقة نشر حالة «${result.procedure}»؟ سيُوقف النشر وتُحذف الصورتان من التخزين.`
      )
    ) {
      return;
    }
    try {
      const response = await fetch(`/api/treatment-results/${result.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revokeConsent: true }),
      });
      const data = await response.json();
      if (data.treatmentResult) {
        setResults((current) =>
          current.map((item) => item.id === result.id ? data.treatmentResult : item)
        );
      }
      if (!response.ok || !data.success) {
        throw new Error(data.message || "تعذر تنفيذ سحب الموافقة بالكامل.");
      }
      toast.success("تم إيقاف النشر وسحب الموافقة وحذف الصور.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر سحب الموافقة.");
    }
  };

  const deleteResult = async (result: TreatmentResult) => {
    if (!window.confirm(`هل تريد حذف سجل «${result.procedure}» وصوره نهائيًا؟`)) {
      return;
    }
    try {
      const response = await fetch(`/api/treatment-results/${result.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "تعذر حذف نتيجة العلاج.");
      }
      setResults((current) => current.filter((item) => item.id !== result.id));
      toast.success("تم حذف النتيجة وصورها.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حذف نتيجة العلاج.");
    }
  };

  if (loading) return <BrandLoader message="جاري تحميل نتائج العلاج..." fullScreen />;

  if (accessDenied) {
    return (
      <main dir="rtl" className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">غير مصرح لك بإدارة معرض النتائج</h1>
          <p className="mt-2 text-sm text-slate-600">هذه الصفحة متاحة للمدير العام فقط.</p>
          <Link href="/admin" className="mt-5 inline-flex items-center gap-2 font-bold text-cyan-700">
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
        <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <Link href="/admin" className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-cyan-700">
            <ArrowRight size={16} /> لوحة الإدارة
          </Link>
          <h1 className="text-2xl font-black sm:text-3xl">إدارة معرض نتائج العلاج</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            ارفع صورًا لا تكشف هوية المريض، ولا تضف أي حالة قبل الحصول على موافقة صريحة
            وموثقة للنشر. تُحفظ الحالات كمسودات حتى تختار نشرها.
          </p>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
              <ImagePlus className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-black">إضافة حالة قبل وبعد</h2>
              <p className="mt-1 text-xs text-slate-500">JPEG أو PNG أو WebP، بحد أقصى 8 ميجابايت للصورة.</p>
            </div>
          </div>

          <form onSubmit={createTreatmentResult} className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-bold">
              <span>الإجراء العلاجي *</span>
              <input
                name="procedure"
                required
                minLength={2}
                maxLength={120}
                placeholder="مثال: تجميل الأسنان"
                className="w-full rounded-xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="space-y-1.5 text-sm font-bold">
              <span>الفرع *</span>
              <input
                name="branchName"
                required
                minLength={2}
                maxLength={120}
                placeholder="اسم الفرع"
                className="w-full rounded-xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="space-y-1.5 text-sm font-bold sm:col-span-2">
              <span>مرجع نموذج الموافقة المحفوظ في العيادة *</span>
              <input
                name="consentReference"
                required
                minLength={2}
                maxLength={120}
                placeholder="رقم أو مرجع نموذج الموافقة"
                className="w-full rounded-xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="space-y-1.5 text-sm font-bold">
              <span>صورة قبل العلاج *</span>
              <input
                name="beforeImage"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs file:ml-3 file:rounded-lg file:border-0 file:bg-cyan-50 file:px-3 file:py-2 file:font-bold file:text-cyan-800"
              />
            </label>
            <label className="space-y-1.5 text-sm font-bold">
              <span>صورة بعد العلاج *</span>
              <input
                name="afterImage"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs file:ml-3 file:rounded-lg file:border-0 file:bg-cyan-50 file:px-3 file:py-2 file:font-bold file:text-cyan-800"
              />
            </label>
            <label className="space-y-1.5 text-sm font-bold">
              <span>ترتيب العرض</span>
              <input
                name="displayOrder"
                type="number"
                min="0"
                step="1"
                defaultValue="0"
                className="w-full rounded-xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="flex min-h-12 items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-900 sm:col-span-2">
              <input
                name="patientConsent"
                type="checkbox"
                required
                className="mt-1 h-4 w-4 shrink-0 accent-cyan-700"
              />
              <span>
                أؤكد أن موافقة المريض الصريحة والموثقة على نشر صور قبل وبعد متوفرة،
                وأن الصور لا تكشف هويته. سيُسجل وقت التأكيد وحساب المدير.
              </span>
            </label>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-cyan-700 to-teal-500 px-5 py-3 font-bold text-white shadow-sm transition-opacity disabled:cursor-wait disabled:opacity-60 sm:col-span-2"
            >
              <ShieldCheck className="h-4 w-4" />
              {saving ? "جارٍ رفع الصور وحفظ المسودة..." : "حفظ الحالة كمسودة"}
            </button>
          </form>
        </section>

        <section aria-labelledby="treatment-results-admin-title" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="treatment-results-admin-title" className="text-xl font-black">الحالات المضافة</h2>
              <p className="mt-1 text-sm text-slate-500">راجع الموافقة والصور قبل تفعيل النشر.</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm">
              {results.length} حالة
            </span>
          </div>

          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              لا توجد حالات بعد.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((result) => (
                <article key={result.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1.5">
                    {[result.beforeImageUrl, result.afterImageUrl].map((url, index) => (
                      <div key={index} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-200">
                        {url && (
                          <Image
                            src={url}
                            alt={index === 0 ? `قبل العلاج: ${result.procedure}` : `بعد العلاج: ${result.procedure}`}
                            fill
                            unoptimized
                            sizes="(max-width: 640px) 45vw, 22vw"
                            className="object-cover"
                          />
                        )}
                        <span className="absolute bottom-2 right-2 rounded-full bg-slate-950/75 px-2.5 py-1 text-[11px] font-bold text-white">
                          {index === 0 ? "قبل" : "بعد"}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-black">{result.procedure}</h3>
                        <p className="mt-1 text-xs text-slate-500">{result.branchName}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        result.isPublished
                          ? "bg-emerald-50 text-emerald-700"
                          : result.patientConsent
                            ? "bg-amber-50 text-amber-800"
                            : "bg-rose-50 text-rose-700"
                      }`}>
                        {result.isPublished ? "منشورة" : result.patientConsent ? "مسودة" : "الموافقة مسحوبة"}
                      </span>
                    </div>
                    <p className="text-[11px] leading-5 text-slate-500">
                      {result.consentConfirmedAt
                        ? `مرجع الموافقة: ${result.consentReference} — أكدها المدير في ${new Date(result.consentConfirmedAt).toLocaleString("ar-EG")}`
                        : "لا توجد موافقة سارية"}
                      {result.consentRevokedAt
                        ? ` — سُحبت: ${new Date(result.consentRevokedAt).toLocaleString("ar-EG")}`
                        : ""}
                    </p>
                    <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        disabled={!result.patientConsent}
                        onClick={() => void updatePublication(result)}
                        className="min-h-10 rounded-xl bg-cyan-50 px-3 py-2 text-xs font-bold text-cyan-800 transition-colors hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {result.isPublished ? "إخفاء من الموقع" : "نشر على الموقع"}
                      </button>
                      {result.patientConsent ? (
                        <button
                          type="button"
                          onClick={() => void revokeConsent(result)}
                          className="min-h-10 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-100"
                        >
                          سحب الموافقة
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void deleteResult(result)}
                          className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> حذف السجل
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => editResult(result)}
                      className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      تعديل الإجراء والفرع والترتيب
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {editingResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEditingResult(null);
          }}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-treatment-result-title"
            onSubmit={saveResultDetails}
            className="w-full max-w-lg space-y-4 rounded-3xl bg-white p-5 shadow-2xl sm:p-7"
          >
            <h2 id="edit-treatment-result-title" className="text-xl font-black">
              تعديل بيانات الحالة
            </h2>
            <label className="block space-y-1.5 text-sm font-bold">
              <span>الإجراء العلاجي</span>
              <input
                value={editProcedure}
                onChange={(event) => setEditProcedure(event.target.value)}
                required
                minLength={2}
                maxLength={120}
                className="w-full rounded-xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="block space-y-1.5 text-sm font-bold">
              <span>الفرع</span>
              <input
                value={editBranchName}
                onChange={(event) => setEditBranchName(event.target.value)}
                required
                minLength={2}
                maxLength={120}
                className="w-full rounded-xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="block space-y-1.5 text-sm font-bold">
              <span>ترتيب العرض</span>
              <input
                type="number"
                min="0"
                step="1"
                value={editDisplayOrder}
                onChange={(event) => setEditDisplayOrder(event.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3"
              />
            </label>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setEditingResult(null)}
                className="min-h-11 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="min-h-11 rounded-xl bg-cyan-700 px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                {savingEdit ? "جارٍ الحفظ..." : "حفظ التغييرات"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
