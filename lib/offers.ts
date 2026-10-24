export interface OfferValues {
  title: string;
  description: string | null;
  imageUrl: string | null;
  originalPrice: number | null;
  discountPrice: number;
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean;
  showOnHome: boolean;
  displayOrder: number;
  serviceId: string | null;
}

const offerFields = new Set([
  "title",
  "description",
  "imageUrl",
  "originalPrice",
  "discountPrice",
  "startDate",
  "endDate",
  "isActive",
  "showOnHome",
  "displayOrder",
  "serviceId",
]);

function parsePrice(value: unknown, field: string): number | null {
  if (value === null || value === "") return null;
  const price = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(price) || price < 0) {
    throw new Error(`${field} يجب أن يكون رقماً موجباً أو صفراً`);
  }
  return price;
}

function parseDate(value: unknown, field: string, isEndDate: boolean): Date | null {
  if (value === null || value === "") return null;
  if (typeof value !== "string") throw new Error(`${field} غير صالح`);

  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const date = dateOnly
    ? new Date(
        Number(dateOnly[1]),
        Number(dateOnly[2]) - 1,
        Number(dateOnly[3]),
        isEndDate ? 23 : 0,
        isEndDate ? 59 : 0,
        isEndDate ? 59 : 0,
        isEndDate ? 999 : 0
      )
    : new Date(value);

  if (
    Number.isNaN(date.getTime()) ||
    (dateOnly &&
      (date.getFullYear() !== Number(dateOnly[1]) ||
        date.getMonth() !== Number(dateOnly[2]) - 1 ||
        date.getDate() !== Number(dateOnly[3])))
  ) {
    throw new Error(`${field} غير صالح`);
  }
  return date;
}

function parseImageUrl(value: unknown): string | null {
  if (value === null || value === "") return null;
  if (typeof value !== "string" || value.length > 2048) {
    throw new Error("رابط الصورة غير صالح");
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("يرجى إدخال رابط صورة صالح");
  }

  const supportedImage = /\.(?:jpe?g|png|webp|gif)$/i.test(url.pathname);
  if (!["http:", "https:"].includes(url.protocol) || !supportedImage) {
    throw new Error("صيغة الصورة المدعومة: JPG أو PNG أو WEBP أو GIF");
  }

  return url.toString();
}

export function validateOfferInput(
  input: unknown,
  existing?: OfferValues
): { values: OfferValues } | { error: string } {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "بيانات العرض غير صالحة" };
  }

  const body = input as Record<string, unknown>;
  const keys = Object.keys(body);

  if (keys.some((key) => !offerFields.has(key))) {
    return { error: "تحتوي البيانات على حقول غير مدعومة" };
  }
  if (existing && keys.length === 0) {
    return { error: "لم يتم تحديد أي بيانات للتحديث" };
  }

  try {
    const values: OfferValues = {
      title: existing?.title ?? "",
      description: existing?.description ?? null,
      imageUrl: existing?.imageUrl ?? null,
      originalPrice: existing?.originalPrice ?? null,
      discountPrice: existing?.discountPrice ?? Number.NaN,
      startDate: existing?.startDate ?? null,
      endDate: existing?.endDate ?? null,
      isActive: existing?.isActive ?? true,
      showOnHome: existing?.showOnHome ?? false,
      displayOrder: existing?.displayOrder ?? 0,
      serviceId: existing?.serviceId ?? null,
    };

    if ("title" in body) {
      if (typeof body.title !== "string" || !body.title.trim() || body.title.trim().length > 120) {
        throw new Error("عنوان العرض مطلوب وبحد أقصى 120 حرفاً");
      }
      values.title = body.title.trim();
    } else if (!existing) {
      throw new Error("عنوان العرض مطلوب");
    }

    if ("description" in body) {
      if (body.description !== null && typeof body.description !== "string") {
        throw new Error("وصف العرض غير صالح");
      }
      if (typeof body.description === "string" && body.description.length > 5000) {
        throw new Error("الوصف يجب ألا يتجاوز 5000 حرف");
      }
      values.description = typeof body.description === "string" ? body.description.trim() || null : null;
    }

    if ("imageUrl" in body) values.imageUrl = parseImageUrl(body.imageUrl);
    if ("originalPrice" in body) {
      values.originalPrice = parsePrice(body.originalPrice, "السعر الأصلي");
    }
    if ("discountPrice" in body) {
      const price = parsePrice(body.discountPrice, "سعر العرض");
      if (price === null) throw new Error("سعر العرض مطلوب");
      values.discountPrice = price;
    } else if (!existing) {
      throw new Error("سعر العرض مطلوب");
    }

    if ("startDate" in body) values.startDate = parseDate(body.startDate, "تاريخ البداية", false);
    if ("endDate" in body) values.endDate = parseDate(body.endDate, "تاريخ الانتهاء", true);

    if ("isActive" in body) {
      if (typeof body.isActive !== "boolean") throw new Error("حالة العرض غير صالحة");
      values.isActive = body.isActive;
    }
    if ("showOnHome" in body) {
      if (typeof body.showOnHome !== "boolean") throw new Error("حالة الظهور في الرئيسية غير صالحة");
      values.showOnHome = body.showOnHome;
    }
    if ("displayOrder" in body) {
      const order = typeof body.displayOrder === "number" ? body.displayOrder : Number(body.displayOrder);
      if (!Number.isInteger(order) || order < 0) throw new Error("ترتيب العرض يجب أن يكون رقماً صحيحاً غير سالب");
      values.displayOrder = order;
    }
    if ("serviceId" in body) {
      if (body.serviceId !== null && typeof body.serviceId !== "string") {
        throw new Error("الخدمة المرتبطة بالعرض غير صالحة");
      }
      values.serviceId = typeof body.serviceId === "string" && body.serviceId.trim() ? body.serviceId.trim() : null;
    }

    if (values.originalPrice !== null && values.originalPrice <= values.discountPrice) {
      throw new Error("يجب أن يكون السعر الأصلي أكبر من سعر العرض");
    }
    if (values.startDate && values.endDate && values.startDate > values.endDate) {
      throw new Error("تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية");
    }

    return { values };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "بيانات العرض غير صالحة" };
  }
}
