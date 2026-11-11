"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { setRegion } from "@/lib/actions";
import { CITIES, LOCALES, REGIONS, loc, type Locale, type RegionId } from "@/lib/catalog";
import { Icon } from "@/components/ui/icon";

const LANGUAGE_NAMES: Record<Locale, string> = { vi: "Tiếng Việt", en: "English" };

export function RegionLang({ region }: { region: RegionId }) {
  const t = useTranslations("regionLang");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const chooseLocale = (next: Locale) => startTransition(() => router.replace(pathname, { locale: next }));
  const chooseRegion = (next: RegionId) => {
    setOpen(false);
    startTransition(async () => { await setRegion(next); router.refresh(); });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={t("button")}
        className={`flex items-center gap-1.5 rounded-lg px-2 h-11 text-[13.5px] text-muted hover:bg-surface2 hover:text-ink ${pending ? "opacity-60" : ""}`}
      >
        <Icon name="globe" size={16} />
        <span>{REGIONS[region].flag}</span>
        <span>{locale.toUpperCase()}</span>
        <Icon name="down" size={13} className="text-muted" />
      </button>
      {open && (
        <div className="anim-rise absolute right-0 mt-2 w-64 rounded-xl border border-line bg-surface p-3 shadow-lg z-50">
          <div className="eyebrow text-muted mb-2">{t("language")}</div>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface2 p-1 text-sm mb-4">
            {LOCALES.map((l) => (
              <button
                key={l}
                type="button"
                lang={l}
                aria-pressed={locale === l}
                onClick={() => chooseLocale(l)}
                className={`rounded-md py-1.5 ${locale === l ? "bg-surface shadow-sm font-medium" : "text-muted"}`}
              >
                {LANGUAGE_NAMES[l]}
              </button>
            ))}
          </div>
          <div className="eyebrow text-muted mb-2">{t("region")}</div>
          <div className="space-y-1">
            {Object.values(REGIONS).map((r) => (
              <button
                key={r.id}
                type="button"
                aria-pressed={region === r.id}
                onClick={() => chooseRegion(r.id)}
                className={`w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-left ${region === r.id ? "bg-surface2 font-medium" : "hover:bg-surface2"}`}
              >
                <span className="whitespace-nowrap">{loc(r.name, locale)}</span>
                <span className="text-xs text-muted truncate">
                  {r.currency}, {r.cities.slice(0, 2).map((c) => loc(CITIES[c].name, locale)).join(", ")}…
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
