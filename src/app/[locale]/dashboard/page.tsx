import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/lib/catalog";
import { dashboardPath } from "@/server/auth/access";
import { getSessionUser } from "@/server/auth/session";

/** /dashboard – the signed-in user's own dashboard. */
export default async function DashboardIndex() {
  const user = await getSessionUser();
  const locale = (await getLocale()) as Locale;
  redirect({ href: user ? dashboardPath(user.role) : "/login", locale });
}
