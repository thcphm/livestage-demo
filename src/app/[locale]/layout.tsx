import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Big_Shoulders, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { themeInitScript } from "@/components/layout/theme-toggle";
import "../globals.css";

const body = Hanken_Grotesk({ subsets: ["latin", "vietnamese"], weight: ["400", "500", "600", "700"], variable: "--font-hanken" });
const display = Big_Shoulders({ subsets: ["latin", "vietnamese"], weight: ["700", "800"], variable: "--font-big-shoulders", adjustFontFallback: false });
const mono = JetBrains_Mono({ subsets: ["latin", "vietnamese"], weight: ["400", "700"], variable: "--font-jetbrains" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("title"), description: t("description") };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    // The init script may add data-theme before React hydrates, hence suppressHydrationWarning.
    <html lang={locale} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeInitScript }} /></head>
      <body className={`${body.variable} ${display.variable} ${mono.variable} min-h-screen`}>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
