"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Edit2, Home, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import BrandLoader, { LoadingIndicator } from "@/components/BrandLoader";

interface Offer {
  id: string;
  title: string;
  description: string | null;
  originalPrice: number | null;
  discountPrice: number;
  imageUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  showOnHome: boolean;
  displayOrder: number;
  serviceId: string | null;
  service?: { name: string } | null;
}

interface ServiceOption {
  id: string;
  name: string;
  isActive: boolean;
}

function dateInputValue(value: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  const fetchOffers = useCallback(async () => {
    try {
      const response = await fetch("/api/offers?all=true");
      const data = await response.json();
      if (response.status === 403) {
        setAccessDenied(true);
        return;
      }
      if (!response.ok || !data.success) {
        throw new Error(data.message || "فشل في جلب العروض");
      }
      setOffers(data.offers);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل في جلب العروض");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadOfferOptions() {
      try {
        const [offerResponse, serviceResponse] = await Promise.all([
          fetch("/api/offers?all=true"),
          fetch("/api/services/manage"),
        ]);
        const [offerData, serviceData] = await Promise.all([
          offerResponse.json(),
          serviceResponse.json(),
        ]);
        if (offerResponse.status === 403 || serviceResponse.status === 403) {
          if (isMounted) setAccessDenied(true);
          return;
        }
        if (!offerResponse.ok || !offerData.success) {
          throw new Error(offerData.message || "فشل في جلب العروض");
        }
        if (!serviceResponse.ok || !serviceData.success) {
          throw new Error(serviceData.message || "فشل في جلب الخدمات لربط العرض");
        }
        if (isMounted) {
          setOffers(offerData.offers);
          setServices(serviceData.services);
        }
      } catch (error) {
        if (isMounted) {
          toast.error(error instanceof Error ? error.message : "فشل في تحميل بيانات العروض");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadOfferOptions();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleOffer = async (offer: Offer, field: "isActive" | "showOnHome") => {
    try {
      const response = await fetch(`/api/offers/${offer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !offer[field] }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "فشل تحديث العرض");
      }
      setOffers((current) => current.map((item) => item.id === offer.id ? data.offer : item));
      toast.success("تم تحديث العرض");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل تحديث العرض");
    }
  };

  const deleteOffer = async (offer: Offer) => {
    if (!window.confirm(`هل تريد حذف العرض «${offer.title}»؟`)) return;
    try {
      const response = await fetch(`/api/offers/${offer.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "فشل حذف العرض");
      }
      setOffers((current) => current.filter((item) => item.id !== offer.id));
      toast.success("تم حذف العرض");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل حذف العرض");
    }
  };

  const saveOffer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const body = {
      title: form.get("title"),
      description: form.get("description"),
      imageUrl: form.get("imageUrl"),
      originalPrice: form.get("originalPrice") || null,
      discountPrice: form.get("discountPrice"),
      serviceId: form.get("serviceId") || null,
      startDate: form.get("startDate") || null,
      endDate: form.get("endDate") || null,
      isActive: form.get("isActive") === "on",
      showOnHome: form.get("showOnHome") === "on",
      displayOrder: form.get("displayOrder"),
    };

    try {
      const response = await fetch(
        editingOffer ? `/api/offers/${editingOffer.id}` : "/api/offers",
        {
          method: editingOffer ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "فشل حفظ العرض");
      }
      toast.success(editingOffer ? "تم تحديث العرض" : "تمت إضافة العرض");
      setIsModalOpen(false);
      setEditingOffer(null);
      await fetchOffers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل حفظ العرض");
    } finally {
      setSaving(false);
    }
  };

  if (accessDenied) {
    return (
      <main dir="rtl" className="min-h-screen bg-slate-50 p-6">
        <Toaster position="top-center" />
        <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">غير مصرح لك بإدارة العروض</h1>
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
            <h1 className="text-2xl font-black">إدارة العروض والخصومات</h1>
            <p className="mt-1 text-sm text-slate-500">أضف العروض وحدد صلاحيتها وظهورها على الصفحة الرئيسية.</p>
          </div>
          <button
            type="button"
            onClick={() => { setEditingOffer(null); setIsModalOpen(true); }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-500 px-4 py-3 font-bold text-white shadow-md shadow-cyan-500/20 transition-all hover:from-cyan-700 hover:to-sky-600 active:scale-95"
          >
            <Plus size={20} /> إضافة عرض جديد
          </button>
        </header>

        {loading ? (
          <BrandLoader message="جاري تحميل العروض..." />
        ) : offers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            لا توجد عروض حتى الآن. أضف عرضاً جديداً للبدء.
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {offers.map((offer) => (
              <article key={offer.id} className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all hover:border-cyan-300 hover:shadow-md">
                {offer.imageUrl ? (
                  <div className="relative h-48 bg-slate-100">
                    <Image src={offer.imageUrl} alt={offer.title} fill unoptimized sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center bg-slate-100 text-slate-400">لا توجد صورة</div>
                )}
                <div className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold">{offer.title}</h2>
                      <p className="mt-1 line-clamp-2 min-h-10 text-sm text-slate-500">{offer.description || "بدون وصف"}</p>
                      {offer.service && (
                        <p className="text-xs font-semibold text-slate-500">
                          مرتبط بخدمة: {offer.service.name}
                        </p>
                      )}
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${offer.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {offer.isActive ? "نشط" : "متوقف"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-blue-600">{offer.discountPrice.toLocaleString("ar-EG")} ج.م</span>
                    {offer.originalPrice !== null && (
                      <span className="text-sm text-slate-400 line-through">{offer.originalPrice.toLocaleString("ar-EG")} ج.م</span>
                    )}
                  </div>
                  {(offer.startDate || offer.endDate) && (
                    <p className="text-xs text-slate-500">
                      الصلاحية: {offer.startDate ? new Date(offer.startDate).toLocaleDateString("ar-EG") : "دون بداية"}
                      {" — "}
                      {offer.endDate ? new Date(offer.endDate).toLocaleDateString("ar-EG") : "دون انتهاء"}
                    </p>
                  )}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => void toggleOffer(offer, "isActive")} className="rounded-lg bg-slate-50 p-2 text-slate-600" title={offer.isActive ? "إيقاف العرض" : "تفعيل العرض"}>
                        {offer.isActive ? <ToggleRight /> : <ToggleLeft />}
                      </button>
                      <button type="button" onClick={() => void toggleOffer(offer, "showOnHome")} className={`rounded-lg p-2 ${offer.showOnHome ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400"}`} title={offer.showOnHome ? "إخفاء من الرئيسية" : "إظهار في الرئيسية"}>
                        <Home size={20} />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { setEditingOffer(offer); setIsModalOpen(true); }} className="rounded-lg bg-blue-50 p-2 text-blue-600" title="تعديل العرض">
                        <Edit2 size={18} />
                      </button>
                      <button type="button" onClick={() => void deleteOffer(offer)} className="rounded-lg bg-rose-50 p-2 text-rose-600" title="حذف العرض">
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4">
          <div className="my-auto max-h-[90vh] w-[95%] max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl sm:w-full sm:p-6">
            <h2 className="mb-5 -mx-4 -mt-4 border-b border-cyan-100 bg-cyan-50/60 px-4 py-4 text-xl font-black sm:-mx-6 sm:-mt-6 sm:px-6">{editingOffer ? "تعديل العرض" : "إضافة عرض جديد"}</h2>
            <form key={editingOffer?.id ?? "new"} onSubmit={saveOffer} className="space-y-4">
              <label className="block text-sm font-semibold">
                عنوان العرض *
                <input name="title" defaultValue={editingOffer?.title ?? ""} required maxLength={120} className="mt-1 w-full rounded-lg border border-slate-300 p-3" />
              </label>
              <label className="block text-sm font-semibold">
                وصف العرض
                <textarea name="description" defaultValue={editingOffer?.description ?? ""} maxLength={5000} rows={3} className="mt-1 w-full rounded-lg border border-slate-300 p-3" />
              </label>
              <label className="block text-sm font-semibold">
                الخدمة المرتبطة (اختياري)
                <select
                  name="serviceId"
                  defaultValue={editingOffer?.serviceId ?? ""}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3"
                >
                  <option value="">عرض عام غير مرتبط بخدمة</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id} disabled={!service.isActive}>
                      {service.name}{service.isActive ? "" : " (متوقفة)"}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-xs font-normal text-slate-500">
                  اربط عرض التبييض بخدمة التبييض ليظهر للمريض بدلاً من السعر الأساسي طوال مدة العرض.
                </span>
              </label>
              <label className="block text-sm font-semibold">
                رابط صورة العرض (JPG أو PNG أو WEBP أو GIF)
                <input name="imageUrl" type="url" defaultValue={editingOffer?.imageUrl ?? ""} placeholder="https://example.com/offer.jpg" className="mt-1 w-full rounded-lg border border-slate-300 p-3" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold">
                  السعر الأصلي
                  <input name="originalPrice" type="number" min="0" step="0.01" defaultValue={editingOffer?.originalPrice ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 p-3" />
                </label>
                <label className="block text-sm font-semibold">
                  سعر العرض *
                  <input name="discountPrice" type="number" min="0" step="0.01" defaultValue={editingOffer?.discountPrice ?? ""} required className="mt-1 w-full rounded-lg border border-slate-300 p-3" />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold">
                  يبدأ في
                  <input name="startDate" type="date" defaultValue={dateInputValue(editingOffer?.startDate ?? null)} className="mt-1 w-full rounded-lg border border-slate-300 p-3" />
                </label>
                <label className="block text-sm font-semibold">
                  ينتهي في
                  <input name="endDate" type="date" defaultValue={dateInputValue(editingOffer?.endDate ?? null)} className="mt-1 w-full rounded-lg border border-slate-300 p-3" />
                </label>
              </div>
              <label className="block text-sm font-semibold">
                ترتيب العرض
                <input name="displayOrder" type="number" min="0" step="1" defaultValue={editingOffer?.displayOrder ?? 0} className="mt-1 w-full rounded-lg border border-slate-300 p-3" />
              </label>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input name="isActive" type="checkbox" defaultChecked={editingOffer?.isActive ?? true} className="h-4 w-4 accent-blue-600" />
                  العرض نشط
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input name="showOnHome" type="checkbox" defaultChecked={editingOffer?.showOnHome ?? true} className="h-4 w-4 accent-blue-600" />
                  إظهار في الصفحة الرئيسية
                </label>
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg px-4 py-2 font-semibold text-slate-600" disabled={saving}>إلغاء</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-gradient-to-r from-cyan-600 to-sky-500 px-5 py-2 font-bold text-white shadow-sm shadow-cyan-500/20 transition-all hover:from-cyan-700 hover:to-sky-600 disabled:opacity-60">
                  {saving ? <><LoadingIndicator size="sm" className="border-white border-t-amber-300" /> جارٍ الحفظ...</> : "حفظ العرض"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
