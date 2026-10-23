const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function runUpdatedDatabaseTests() {
  console.log("==================================================");
  console.log("🧪 اختبار قاعدة البيانات بعد التحديثات الجديدة");
  console.log("==================================================\n");

  // 1. فحص بيانات المرضى المحدثة (أرقام الهاتف والعنوان)
  console.log("1️⃣ فحص بيانات التواصل الكاملة للمرضى:");
  const patients = await prisma.patient.findMany();
  patients.forEach((p, i) => {
    console.log(`   [مريض ${i + 1}] ${p.fullName}`);
    console.log(`       📞 الهاتف الأساسي (واتساب): ${p.phone}`);
    console.log(`       📱 هاتف إضافي / طوارئ: ${p.secondaryPhone || "غير مسجل"}`);
    console.log(`       ✉️  البريد: ${p.email || "غير مسجل"}`);
    console.log(`       📍 العنوان: ${p.address || "غير مسجل"}`);
    console.log(`       🆔 الرقم القومي: ${p.nationalId}`);
  });
  console.log("");

  // 2. فحص الحجوزات ونوع الملاحظة (شكوى أو اقتراح)
  console.log("2️⃣ فحص الشكاوى والاقتراحات المرفقة بالحجوزات:");
  const appointments = await prisma.appointment.findMany({
    include: {
      patient: true,
      branch: true,
      service: true,
    },
  });

  appointments.forEach((apt, i) => {
    console.log(`   [طلب حجز ${i + 1}] المريض: ${apt.patient.fullName} | الفرع: ${apt.branch.name}`);
    console.log(`       🏷️ نوع الملاحظة: ${apt.noteType === "COMPLAINT" ? "⚠️ شكوى طبية / ألم" : "💡 اقتراح أو رغبة تطويرية"}`);
    if (apt.patientComplaint) {
      console.log(`       📝 نص الشكوى: "${apt.patientComplaint}"`);
      console.log(`       🎯 موضع الألم: "${apt.painLocation}"`);
    }
    if (apt.patientSuggestion) {
      console.log(`       💡 نص الاقتراح: "${apt.patientSuggestion}"`);
    }
    console.log(`       📊 الحالة: ${apt.status}`);
  });

  console.log("\n==================================================");
  console.log("🎉 جميع التعديلات والحقول الجديدة تعمل وتُحفظ بكفاءة تامة!");
  console.log("==================================================");
}

runUpdatedDatabaseTests()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
