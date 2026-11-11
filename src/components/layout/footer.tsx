import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "./header";

const linkCls = "block py-1 text-onnavymuted hover:text-white";

export async function Footer() {
  const t = await getTranslations("footer");
  return (
    <footer className="mt-24 bg-navy text-onnavy">
      <div className="wrap py-12 grid gap-8 grid-cols-2 lg:grid-cols-4 text-sm">
        <div className="col-span-2 lg:col-span-1 space-y-3">
          <Logo onDark />
          <p className="text-onnavymuted max-w-xs">{t("about")}</p>
        </div>
        <div>
          <div className="font-semibold text-white mb-2">{t("book")}</div>
          <Link className={linkCls} href="/artists">{t("findArtists")}</Link>
          <Link className={linkCls} href="/quote">{t("quote")}</Link>
          <Link className={linkCls} href={{ pathname: "/register", query: { role: "venue" } }}>{t("registerVenue")}</Link>
        </div>
        <div>
          <div className="font-semibold text-white mb-2">{t("audience")}</div>
          <Link className={linkCls} href="/shows">{t("shows")}</Link>
          <Link className={linkCls} href="/tickets">{t("myTickets")}</Link>
        </div>
        <div>
          <div className="font-semibold text-white mb-2">{t("artists")}</div>
          <Link className={linkCls} href="/for-artists">{t("forArtists")}</Link>
          <Link className={linkCls} href={{ pathname: "/register", query: { role: "artist" } }}>{t("createArtist")}</Link>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="wrap py-4 flex flex-wrap justify-between gap-2 text-xs text-onnavymuted">
          <span>{t("copyright", { year: new Date().getFullYear() })}</span>
          <span>{t("photos")}</span>
        </div>
      </div>
    </footer>
  );
}
