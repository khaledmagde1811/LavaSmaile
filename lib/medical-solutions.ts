export interface MedicalSolutionValues {
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

const allowedFields = new Set([
  "titleAr",
  "titleEn",
  "slug",
  "shortDescription",
  "content",
  "price",
  "icon",
  "imageUrl",
  "category",
  "isActive",
  "displayOrder",
]);

function optionalText(value: unknown, field: string, maxLength: number): string | null {
  if (value === null || value === "") return null;
  if (typeof value !== "string" || value.trim().length > maxLength) {
    throw new Error(`${field} غير صالح أو يتجاوز الحد المسموح`);
  }
  return value.trim() || null;
}

function validateImageUrl(value: unknown): string | null {
  const imageUrl = optionalText(value, "رابط الصورة", 2048);
  if (!imageUrl) return null;

  let url: URL;
  try {
    url = new URL(imageUrl);
  } catch {
    throw new Error("يرجى إدخال رابط صورة صالح");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("يجب أن يبدأ رابط الصورة بـ HTTP أو HTTPS");
  }
  return url.toString();
}

function parsePrice(value: unknown): number | null {
  if (value === null || value === "") return null;
  const price = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("السعر يجب أن يكون رقماً موجباً أو صفراً");
  }
  return price;
}

export function validateMedicalSolutionInput(
  input: unknown,
  existing?: MedicalSolutionValues
): { values: MedicalSolutionValues } | { error: string } {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "بيانات الخدمة الطبية غير صالحة" };
  }

  const body = input as Record<string, unknown>;
  const keys = Object.keys(body);
  if (keys.length === 0 || keys.some((key) => !allowedFields.has(key))) {
    return { error: "البيانات فارغة أو تحتوي على حقول غير مدعومة" };
  }

  try {
    const values: MedicalSolutionValues = existing
      ? { ...existing }
      : {
          titleAr: "",
          titleEn: null,
          slug: "",
          shortDescription: "",
          content: null,
          price: null,
          icon: null,
          imageUrl: null,
          category: null,
          isActive: true,
          displayOrder: 0,
        };

    if ("titleAr" in body) {
      if (typeof body.titleAr !== "string" || !body.titleAr.trim() || body.titleAr.trim().length > 160) {
        throw new Error("العنوان العربي مطلوب وبحد أقصى 160 حرفاً");
      }
      values.titleAr = body.titleAr.trim();
    } else if (!existing) {
      throw new Error("العنوان العربي مطلوب");
    }

    if ("titleEn" in body) values.titleEn = optionalText(body.titleEn, "العنوان الإنجليزي", 160);

    if ("slug" in body) {
      if (typeof body.slug !== "string") throw new Error("المعرّف غير صالح");
      const slug = body.slug.trim().toLowerCase();
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) {
        throw new Error("المعرّف يجب أن يتكون من أحرف إنجليزية صغيرة وأرقام وشرطات فقط");
      }
      values.slug = slug;
    } else if (!existing) {
      throw new Error("المعرّف مطلوب");
    }

    if ("shortDescription" in body) {
      if (typeof body.shortDescription !== "string" || !body.shortDescription.trim() || body.shortDescription.trim().length > 500) {
        throw new Error("الوصف المختصر مطلوب وبحد أقصى 500 حرف");
      }
      values.shortDescription = body.shortDescription.trim();
    } else if (!existing) {
      throw new Error("الوصف المختصر مطلوب");
    }

    if ("content" in body) values.content = optionalText(body.content, "التفاصيل", 10000);
    if ("price" in body) values.price = parsePrice(body.price);
    if ("icon" in body) values.icon = optionalText(body.icon, "الأيقونة", 80);
    if ("imageUrl" in body) values.imageUrl = validateImageUrl(body.imageUrl);
    if ("category" in body) values.category = optionalText(body.category, "التصنيف", 100);

    if ("isActive" in body) {
      if (typeof body.isActive !== "boolean") throw new Error("حالة التفعيل غير صالحة");
      values.isActive = body.isActive;
    }
    if ("displayOrder" in body) {
      const displayOrder = typeof body.displayOrder === "number" ? body.displayOrder : Number(body.displayOrder);
      if (!Number.isInteger(displayOrder) || displayOrder < 0 || displayOrder > 100000) {
        throw new Error("ترتيب الظهور يجب أن يكون عدداً صحيحاً من 0 إلى 100000");
      }
      values.displayOrder = displayOrder;
    }

    return { values };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "بيانات الخدمة الطبية غير صالحة" };
  }
}
