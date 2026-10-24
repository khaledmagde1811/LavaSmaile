"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { isTeethWhiteningService } from "@/lib/whitening";

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  isActive: boolean;
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadServices() {
      try {
        const response = await fetch("/api/services/manage");
        const data = await response.json();
        if (response.status === 403) {
          if (isMounted) setAccessDenied(true);
          return;
        }
        if (!response.ok || !data.success) {
          throw new Error(data.message || "فشل في جلب الخدمات");
        }
        if (isMounted) setServices(data.services);
      } catch (error) {
        if (isMounted) {
          toast.error(error instanceof Error ? error.message : "فشل في جلب الخدمات");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadServices();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleService = async (service: Service) => {
    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !service.isActive }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "فشل تحديث حالة الخدمة");
      }
      setServices((current) =>
        current.map((item) => (item.id === service.id ? data.service : item))
      );
      toast.success(data.service.isActive ? "تم تفعيل الخدمة" : "تم إيقاف الخدمة");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل تحديث حالة الخدمة");
    }
  };

  const deleteService = async (service: Service) => {
    if (!window.confirm(`هل تريد حذف الخدمة «${service.name}»؟`)) return;
    try {
      const response = await fetch(`/api/services/${service.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "فشل حذف الخدمة");
      }
      setServices((current) => current.filter((item) => item.id !== service.id));
      toast.success("تم حذف الخدمة");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل حذف الخدمة");
    }
  };

  const saveService = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const body = {
      name: form.get("name"),
      description: form.get("description"),
      category: form.get("category"),
      price: form.get("price"),
      isActive: form.get("isActive") === "on",
    };

    try {
      const response = await fetch(
        editingService ? `/api/services/${editingService.id}` : "/api/services",
        {
          method: editingService ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "فشل حفظ الخدمة");
      }

      if (editingService) {
        setServices((current) =>
          current.map((service) => service.id === data.service.id ? data.service : service)
        );
      } else {
        setServices((current) => [...current, data.service]);
      }
      toast.success(editingService ? "تم تحديث الخدمة" : "تمت إضافة الخدمة");
      setIsModalOpen(false);
      setEditingService(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل حفظ الخدمة");
    } finally {
      setSaving(false);
    }
  };

  if (accessDenied) {
    return (
      <main dir="rtl" className="min-h-screen bg-slate-50 p-6">
        <Toaster position="top-center" />
        <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">غير مصرح لك بإدارة الخدمات</h1>
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
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-6">
          <div>
            <Link href="/admin" className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
              <ArrowRight size={16} /> لوحة الإدارة
            </Link>
            <h1 className="text-2xl font-black">إدارة خدمات الحجز</h1>
            <p className="mt-1 text-sm text-slate-500">
              أضف الخدمات وعدّل تفاصيلها. الخدمات النشطة فقط تظهر مباشرة في نموذج الحجز.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingService(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-500 px-4 py-3 font-bold text-white shadow-md shadow-cyan-500/20 transition-all hover:from-cyan-700 hover:to-sky-600 active:scale-95"
          >
            <Plus size={20} /> إضافة خدمة جديدة
          </button>
        </header>

        <aside className="flex flex-col justify-between gap-3 rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4 text-sm sm:flex-row sm:items-center">
          <p className="font-semibold leading-6 text-cyan-950">
            سعر التبييض الأساسي يُدار من خدمة اسمها أو تصنيفها يحتوي على «تبييض». عند وجود عرض سارٍ مرتبط بهذه الخدمة، يظهر سعر العرض للمريض بدلاً من السعر الأساسي.
          </p>
          <Link
            href="/admin/offers"
            className="inline-flex shrink-0 items-center gap-2 font-bold text-cyan-800 hover:text-cyan-950"
          >
            إدارة عروض التبييض <ArrowRight size={16} />
          </Link>
        </aside>

        {loading ? (
          <BrandLoader message="جاري تحميل الخدمات..." />
        ) : services.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            لا توجد خدمات حتى الآن. أضف خدمة جديدة للبدء.
          </div>
        ) : (
          <section className="space-y-3">
            {services.map((service) => (
              <article
                key={service.id}
                className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:border-cyan-300 hover:shadow-md sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold">{service.name}</h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      service.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {service.isActive ? "نشطة" : "متوقفة"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{service.description || "بدون وصف"}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    {service.category ? `${service.category} · ` : ""}
                    {service.price.toLocaleString("ar-EG")} ج.م
                  </p>
                  {isTeethWhiteningService(service) && (
                    <span className="mt-2 inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-800">
                      خدمة التبييض — السعر الأساسي للمريض
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void toggleService(service)}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 font-bold text-slate-700 hover:bg-slate-100"
                    title={service.isActive ? "إيقاف الخدمة" : "تفعيل الخدمة"}
                  >
                    {service.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    <span>{service.isActive ? "إيقاف" : "تفعيل"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingService(service);
                      setIsModalOpen(true);
                    }}
                    className="rounded-xl bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                    title="تعديل الخدمة"
                    aria-label={`تعديل ${service.name}`}
                  >
                    <Edit2 size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteService(service)}
                    className="rounded-xl bg-rose-50 p-2 text-rose-600 hover:bg-rose-100"
                    title="حذف الخدمة"
                    aria-label={`حذف ${service.name}`}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4">
          <div className="my-auto max-h-[90vh] w-[95%] max-w-xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl sm:w-full sm:p-6">
            <h2 className="mb-5 -mx-4 -mt-4 border-b border-cyan-100 bg-cyan-50/60 px-4 py-4 text-xl font-black sm:-mx-6 sm:-mt-6 sm:px-6">
              {editingService ? "تعديل الخدمة" : "إضافة خدمة جديدة"}
            </h2>
            <form
              key={editingService?.id ?? "new"}
              onSubmit={saveService}
              className="space-y-4"
            >
              <label className="block text-sm font-semibold">
                اسم الخدمة *
                <input
                  name="name"
                  defaultValue={editingService?.name ?? ""}
                  required
                  maxLength={120}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-3"
                />
              </label>
              <label className="block text-sm font-semibold">
                الوصف المختصر
                <textarea
                  name="description"
                  defaultValue={editingService?.description ?? ""}
                  maxLength={5000}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-3"
                />
              </label>
              <label className="block text-sm font-semibold">
                التصنيف
                <input
                  name="category"
                  defaultValue={editingService?.category ?? ""}
                  maxLength={120}
                  placeholder="مثال: تجميل، جراحة وزراعة"
                  className="mt-1 w-full rounded-lg border border-slate-300 p-3"
                />
              </label>
              <label className="block text-sm font-semibold">
                {editingService && isTeethWhiteningService(editingService)
                  ? "السعر الأساسي للتبييض (جنيه) *"
                  : "السعر الأساسي (جنيه) *"}
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={editingService?.price ?? ""}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 p-3"
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  name="isActive"
                  type="checkbox"
                  defaultChecked={editingService?.isActive ?? true}
                  className="h-4 w-4 accent-blue-600"
                />
                الخدمة نشطة وتظهر في نموذج الحجز
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingService(null);
                  }}
                  className="rounded-lg bg-slate-100 px-4 py-2 font-bold text-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-cyan-600 to-sky-500 px-5 py-2 font-bold text-white shadow-sm shadow-cyan-500/20 transition-all hover:from-cyan-700 hover:to-sky-600 disabled:opacity-60"
                >
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
