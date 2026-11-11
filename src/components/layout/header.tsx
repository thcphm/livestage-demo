import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { RegionId } from "@/lib/catalog";
import { signOut } from "@/server/auth/actions";
import type { SessionUser } from "@/server/auth/session";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { buttonClass } from "@/components/ui/button";
import { RegionLang } from "./region-lang";
import { ThemeToggle } from "./theme-toggle";

const navCls = "px-3 py-2 text-[15px] font-medium text-ink hover:underline decoration-accent decoration-[1.5px] underline-offset-[6px] whitespace-nowrap";

/** Wordmark with a single stage-light dot; used in the header and footer. */
export function Logo({ onDark = false }: { onDark?: boolean }) {
  return (
    <span className={`flex items-center gap-2 text-[19px] font-bold tracking-[-0.03em] ${onDark ? "text-white" : "text-ink"}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${onDark ? "bg-white/70" : "bg-accent"}`} aria-hidden="true" />LiveStage
    </span>
  );
}

export async function Header({ region, user }: { region: RegionId; user: SessionUser | null }) {
  const t = await getTranslations("nav");
  const ta = await getTranslations("account");
  const locale = await getLocale();
  const links = (
    <>
      <Link className={navCls} href="/artists">{t("artists")}</Link>
      <Link className={navCls} href="/shows">{t("shows")}</Link>
      <Link className={navCls} href="/quote">{t("quote")}</Link>
      <Link className={navCls} href="/for-artists">{t("forArtists")}</Link>
    </>
  );

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-line">
      <div className="wrap flex h-16 items-center gap-2 sm:gap-3">
        <Link href="/" className="shrink-0" aria-label={t("home")}><Logo /></Link>
        <nav className="hidden lg:flex items-center ml-6">{links}</nav>
        <div className="ml-auto flex min-w-0 items-center gap-0.5 sm:gap-2">
          <RegionLang region={region} />
          <ThemeToggle />
          {user ? (
            <>
              <Link href="/dashboard" className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-1 sm:pr-2.5 hover:bg-surface2" aria-label={ta("dashboard")}>
                <Avatar name={user.displayName} hue={user.hue} size={30} src={user.photo} />
                <span className="hidden sm:block max-w-[150px] truncate text-sm font-semibold">{user.displayName}</span>
              </Link>
              <form action={signOut}>
                <input type="hidden" name="locale" value={locale} />
                <button type="submit" className="rounded-lg p-2 text-muted hover:bg-surface2" aria-label={ta("logout")} title={ta("logout")}>
                  <Icon name="out" size={17} />
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className={buttonClass("ghost", "sm")}>{t("login")}</Link>
          )}
        </div>
      </div>
      <nav className="lg:hidden wrap -mt-1 pb-1.5 flex overflow-x-auto [scrollbar-width:none]">{links}</nav>
    </header>
  );
}
