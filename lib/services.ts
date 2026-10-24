export interface ServiceValues {
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  isActive: boolean;
}

const serviceFields = new Set(["name", "description", "category", "price", "isActive"]);

function parseOptionalText(value: unknown, field: string, maxLength: number): string | null {
  if (value === null || value === "") return null;
  if (typeof value !== "string" || value.length > maxLength) {
    throw new Error(`${field} غير صالح`);
  }
  return value.trim() || null;
}

export function validateServiceInput(
  input: unknown,
  existing?: ServiceValues
): { values: ServiceValues } | { error: string } {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "بيانات الخدمة غير صالحة" };
  }

  const body = input as Record<string, unknown>;
  const keys = Object.keys(body);
  if (keys.some((key) => !serviceFields.has(key))) {
    return { error: "تحتوي البيانات على حقول غير مدعومة" };
  }
  if (existing && keys.length === 0) {
    return { error: "لم يتم تحديد أي بيانات للتحديث" };
  }

  try {
    const values: ServiceValues = {
      name: existing?.name ?? "",
      description: existing?.description ?? null,
      category: existing?.category ?? null,
      price: existing?.price ?? Number.NaN,
      isActive: existing?.isActive ?? true,
    };

    if ("name" in body) {
      if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 120) {
        throw new Error("اسم الخدمة مطلوب وبحد أقصى 120 حرفاً");
      }
      values.name = body.name.trim();
    } else if (!existing) {
      throw new Error("اسم الخدمة مطلوب");
    }

    if ("description" in body) {
      values.description = parseOptionalText(body.description, "وصف الخدمة", 5000);
    }
    if ("category" in body) {
      values.category = parseOptionalText(body.category, "تصنيف الخدمة", 120);
    }
    if ("price" in body) {
      const price = typeof body.price === "number" ? body.price : Number(body.price);
      if (!Number.isFinite(price) || price < 0) {
        throw new Error("السعر يجب أن يكون رقماً موجباً أو صفراً");
      }
      values.price = price;
    } else if (!existing) {
      throw new Error("سعر الخدمة مطلوب");
    }

    if ("isActive" in body) {
      if (typeof body.isActive !== "boolean") throw new Error("حالة الخدمة غير صالحة");
      values.isActive = body.isActive;
    }

    return { values };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "بيانات الخدمة غير صالحة" };
  }
}
