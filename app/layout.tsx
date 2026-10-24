import type { Metadata } from "next";
import type { Viewport } from "next";
import RouteLoadingOverlay from "@/components/RouteLoadingOverlay";
import WhatsAppContactButton from "@/components/WhatsAppContactButton";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lavasmile.com";
const siteName = "مراكز لاڤا لطب وتجميل الأسنان";
const siteDescription =
  "اكتشف خدمات مراكز لاڤا سمايل لطب وتجميل الأسنان، من تجميل الأسنان وزراعة الأسنان إلى التقويم والعدسات التجميلية، في فروع المهندسين ومدينة نصر والتجمع الخامس.";
const siteImage = "/og-image.png";
const telephone = "+201012345671";
const openingHours = [
  {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    opens: "10:00",
    closes: "22:00",
  },
];

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "مراكز لاڤا لطب وتجميل الأسنان | Lava Smile Dental Centers",
    template: "%s | Lava Smile",
  },
  description: siteDescription,
  keywords: [
    "عيادة أسنان",
    "زراعة أسنان مصر",
    "تجميل أسنان",
    "تقويم أسنان",
    "لاڤا سمايل",
    "Lava Smile",
    "زيركون",
    "فينير",
  ],
  authors: [{ name: siteName }],
  publisher: siteName,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/favicon.ico" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "ar_EG",
    siteName,
    title: "مراكز لاڤا لطب وتجميل الأسنان | Lava Smile Dental Centers",
    description: siteDescription,
    url: "/",
    images: [
      {
        url: siteImage,
        width: 1200,
        height: 630,
        alt: "مراكز لاڤا لطب وتجميل الأسنان - Lava Smile",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "مراكز لاڤا لطب وتجميل الأسنان | Lava Smile Dental Centers",
    description: siteDescription,
    images: [siteImage],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0891b2" },
    { media: "(prefers-color-scheme: dark)", color: "#d97706" },
  ],
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": ["Dentist", "MedicalBusiness"],
  "@id": `${siteUrl}/#business`,
  name: siteName,
  alternateName: "Lava Smile Dental Centers",
  description: siteDescription,
  url: siteUrl,
  logo: `${siteUrl}/icon.svg`,
  image: `${siteUrl}${siteImage}`,
  telephone,
  medicalSpecialty: "Dentistry",
  openingHoursSpecification: openingHours,
  department: [
    {
      "@type": "Dentist",
      name: "مراكز لاڤا سمايل - فرع المهندسين",
      telephone,
      address: {
        "@type": "PostalAddress",
        streetAddress: "شارع جامعة الدول العربية، أمام نادي الصيد",
        addressLocality: "المهندسين، الجيزة",
        addressCountry: "EG",
      },
      openingHoursSpecification: openingHours,
    },
    {
      "@type": "Dentist",
      name: "مراكز لاڤا سمايل - فرع مدينة نصر",
      telephone,
      address: {
        "@type": "PostalAddress",
        streetAddress: "شارع عباس العقاد، بجوار كيدزانيا",
        addressLocality: "مدينة نصر، القاهرة",
        addressCountry: "EG",
      },
      openingHoursSpecification: openingHours,
    },
    {
      "@type": "Dentist",
      name: "مراكز لاڤا سمايل - فرع التجمع الخامس",
      telephone,
      address: {
        "@type": "PostalAddress",
        streetAddress: "شارع التسعين الشمالي، ميديكال بارك",
        addressLocality: "التجمع الخامس، القاهرة",
        addressCountry: "EG",
      },
      openingHoursSpecification: openingHours,
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased scroll-smooth">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        {children}
        <WhatsAppContactButton />
        <RouteLoadingOverlay />
      </body>
    </html>
  );
}
