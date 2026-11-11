import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/lib/catalog";

/** Old link from the first demo; the quote form now lives at /quote. */
export default async function QuickQuotePage() {
  redirect({ href: "/quote", locale: (await getLocale()) as Locale });
}
