import { defineRouting } from "next-intl/routing";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/catalog";

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "always",
  // English is the default for everyone (no Accept-Language detection); visitors switch to Vietnamese in the header.
  localeDetection: false,
});
