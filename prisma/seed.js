const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 بدء ملء وتأمين بيانات المستخدمين والعيادات...");

  // 1. تنظيف البيانات السابقة
  await prisma.followUp.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.service.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();

  // 2. إنشاء الفروع الثلاثة
  const branch1 = await prisma.branch.create({
    data: {
      name: "فرع المهندسين (الرئيسي)",
      city: "الجيزة",
      address: "شارع جامعة الدول العربية، أمام نادي الصيد",
      phone: "01012345671",
      workingHours: "10:00 ص - 10:00 م",
      mapUrl: "https://maps.google.com/?q=30.0526,31.2017",
      status: "ACTIVE",
    },
  });

  const branch2 = await prisma.branch.create({
    data: {
      name: "فرع مدينة نصر",
      city: "القاهرة",
      address: "شارع عباس العقاد، بجوار كيدزانيا",
      phone: "01012345672",
      workingHours: "11:00 ص - 11:00 م",
      mapUrl: "https://maps.google.com/?q=30.0561,31.3437",
      status: "ACTIVE",
    },
  });

  const branch3 = await prisma.branch.create({
    data: {
      name: "فرع التجمع الخامس",
      city: "القاهرة الجديدة",
      address: "شارع التسعين الشمالي، مجمع عيادات ميديكال بارك",
      phone: "01012345673",
      workingHours: "12:00 م - 10:00 م",
      mapUrl: "https://maps.google.com/?q=30.0264,31.4883",
      status: "ACTIVE",
    },
  });

  console.log("✅ تم إنشاء الفروع الثلاثة.");

  // 3. إنشاء مستخدمي النظام وتشفير كلمات المرور بـ Bcrypt
  const adminPasswordHash = bcrypt.hashSync("admin123", 10);
  const receptionPasswordHash = bcrypt.hashSync("reception123", 10);

  // 3.1 المدير العام (Super Admin)
  await prisma.user.create({
    data: {
      name: "د. طارق العوضي (المدير العام)",
      email: "admin@lavasmile.com",
      password: adminPasswordHash,
      role: "SUPER_ADMIN",
    },
  });

  // 3.2 موظف استقبال المهندسين
  await prisma.user.create({
    data: {
      name: "سارة محمود (استقبال المهندسين)",
      email: "reception.mohandessin@lavasmile.com",
      password: receptionPasswordHash,
      role: "RECEPTIONIST",
      branchId: branch1.id,
    },
  });

  // 3.3 موظف استقبال مدينة نصر
  await prisma.user.create({
    data: {
      name: "عمر الشريف (استقبال مدينة نصر)",
      email: "reception.nasrcity@lavasmile.com",
      password: receptionPasswordHash,
      role: "RECEPTIONIST",
      branchId: branch2.id,
    },
  });

  // 3.4 موظف استقبال التجمع
  await prisma.user.create({
    data: {
      name: "مي فاروق (استقبال التجمع الخامس)",
      email: "reception.tagamoa@lavasmile.com",
      password: receptionPasswordHash,
      role: "RECEPTIONIST",
      branchId: branch3.id,
    },
  });

  console.log("✅ تم إنشاء حسابات الإدارة والاستقبال وتشفير كلمات المرور.");

  // 4. إنشاء الأطباء
  const doc1 = await prisma.doctor.create({
    data: {
      name: "د. أحمد زهران",
      specialty: "استشاري جراحة وزراعة الأسنان",
      phone: "01122334455",
      email: "dr.zahran@lavasmile.com",
      workingDays: "السبت، الإثنين، الأربعاء",
      branchId: branch1.id,
    },
  });

  const doc2 = await prisma.doctor.create({
    data: {
      name: "د. دينا عادل",
      specialty: "أخصائية تجميل الأسنان وابتسامة هوليوود",
      phone: "01199887766",
      email: "dr.dina@lavasmile.com",
      workingDays: "الأحد، الثلاثاء، الخميس",
      branchId: branch2.id,
    },
  });

  const doc3 = await prisma.doctor.create({
    data: {
      name: "د. كريم الشناوي",
      specialty: "أخصائي تقويم الأسنان والفكين",
      phone: "01144556677",
      email: "dr.karim@lavasmile.com",
      workingDays: "يومياً عدا الجمعة",
      branchId: branch3.id,
    },
  });

  console.log("✅ تم إنشاء الأطباء.");

  // 5. إنشاء الخدمات
  const srv1 = await prisma.service.create({
    data: {
      name: "ابتسامة هوليوود (Lava 3D Smile)",
      description: "تصميم رقمي كامل للابتسامة وعدسات إيماكس عالية الدقة",
      category: "تجميل",
      price: 18000,
      durationMinutes: 60,
    },
  });

  const srv2 = await prisma.service.create({
    data: {
      name: "زراعة الأسنان الفورية الألمانية",
      description: "غرسات تيتانيوم ألمانية مع تركيب فوري خلال نفس الجلسة",
      category: "جراحة وزراعة",
      price: 9500,
      durationMinutes: 45,
    },
  });

  const srv3 = await prisma.service.create({
    data: {
      name: "جلسة تبييض الأسنان بالليزر (Zoom 4)",
      description: "تفتيح لون الأسنان حتى 8 درجات في جلسة واحدة مدتها 45 دقيقة",
      category: "تجميل",
      price: 2500,
      durationMinutes: 45,
    },
  });

  console.log("✅ تم إنشاء قائمة الخدمات.");

  // 6. إنشاء بيانات العملاء الكاملة
  const patientPasswordHash = bcrypt.hashSync("patient123", 10);

  const patient1 = await prisma.patient.create({
    data: {
      fullName: "محمود حسن السيد",
      phone: "01001234567",
      secondaryPhone: "01155443322",
      email: "mahmoud.hassan@gmail.com",
      password: patientPasswordHash,
      address: "الدقي، شارع مصدق، الجيزة",
      nationalId: "29201011234567",
      gender: "MALE",
      birthDate: new Date("1992-05-14"),
      chronicDiseases: "لا يوجد",
      allergies: "حساسية بنسلين",
      notes: "يفضل التواصل واتساب قبل الموعد بـ 24 ساعة",
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      fullName: "نورهان طارق القاضي",
      phone: "01209876543",
      secondaryPhone: "01099887711",
      email: "nourhan.kadi@outlook.com",
      password: patientPasswordHash,
      address: "مصر الجديدة، ميدان الكوربة، القاهرة",
      nationalId: "29708151234568",
      gender: "FEMALE",
      birthDate: new Date("1997-08-15"),
      chronicDiseases: "ضغط منخفض",
      allergies: "لا يوجد",
      notes: "مهتمة بتركيب عدسات تجميلية للفك العلوي",
    },
  });

  console.log("✅ تم إنشاء المرضى.");

  // 7. إنشاء حجوزات تجريبية
  const appointment1 = await prisma.appointment.create({
    data: {
      branchId: branch1.id,
      patientId: patient1.id,
      doctorId: doc1.id,
      serviceId: srv2.id,
      appointmentDate: new Date(Date.now() + 86400000), // غداً
      status: "CONFIRMED",
      noteType: "COMPLAINT",
      patientComplaint: "أعاني من كسر في الضرس الخلفي السفلي الأيمن وصعوبة شديدة في مضغ الطعام وألم نابض مع المشروبات الباردة والساخنة.",
      painLocation: "الضرس السفلي رقم 6 يمين",
    },
  });

  const appointment2 = await prisma.appointment.create({
    data: {
      branchId: branch2.id,
      patientId: patient2.id,
      doctorId: doc2.id,
      serviceId: srv1.id,
      appointmentDate: new Date(Date.now() + 172800000), // بعد يومين
      status: "PENDING",
      noteType: "SUGGESTION",
      patientSuggestion: "أقترح توفير خيارات تقسيط مباشر أو دفع إلكتروني لخدمات تجميل الأسنان بدون فوائد، وتوفير مواعيد استشارة مسائية متأخرة بعد الساعة 8.",
      painLocation: "لا يوجد ألم حالي - استشارة تجميلية",
    },
  });

  console.log("✅ تم إنشاء الحجوزات مع الشكاوى والمقترحات.");

  // 8. إنشاء متابعة دورية
  await prisma.followUp.create({
    data: {
      patientId: patient1.id,
      branchId: branch1.id,
      doctorId: doc1.id,
      appointmentId: appointment1.id,
      scheduledDate: new Date(Date.now() + 604800000), // بعد أسبوع
      followUpType: "فحص ما بعد الزراعة وتغيير الضماد",
      status: "SCHEDULED",
      notes: "متابعة التئام اللثة بعد وضع غرسة التيتانيوم والتأكد من عدم وجود التهاب.",
    },
  });

  console.log("✅ تم إنشاء المتابعات الدورية.");
  console.log("🎉 تم تجهيز قاعدة البيانات وتأمين كلمات المرور بنجاح تام!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
