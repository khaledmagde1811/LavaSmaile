import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lava Smile | مراكز لاڤا لطب وتجميل الأسنان",
  description: "المراكز الرائدة في تجميل وزراعة الأسنان، ابتسامة هوليوود، وعلاج الجذور عبر فروعنا في مصر.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased scroll-smooth">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
