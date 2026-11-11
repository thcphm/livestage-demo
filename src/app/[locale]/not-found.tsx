import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonClass } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <main className="wrap py-24 text-center">
      <div className="text-5xl font-semibold text-muted tnum">404</div>
      <h1 className="h-sec mt-3">{t("title")}</h1>
      <p className="text-sm text-muted mt-2">{t("text")}</p>
      <Link href="/" className={buttonClass("ghost", "md", "mt-6")}>{t("back")}</Link>
    </main>
  );
}
