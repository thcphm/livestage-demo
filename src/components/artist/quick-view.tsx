"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CITIES, loc, type Locale } from "@/lib/catalog";
import { formatShortDate } from "@/lib/dates";
import type { QuickView as QuickViewData } from "@/demo/queries";

/**
 * Hovering (or focusing) an artist's name shows their recent shows and well-known songs (R5).
 * Touch screens have no hover, so a small "Quick view" button toggles the same panel.
 */
export function QuickView({ data, music, children }: { data: QuickViewData; music: boolean; children: ReactNode }) {
  const t = useTranslations("card");
  const locale = useLocale() as Locale;
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const box = useRef<HTMLSpanElement>(null);
  const id = useId();

  const show = () => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setOpen(true), 200); };
  const hide = () => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setOpen(false), 120); };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onDown = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onDown); };
  }, [open]);

  return (
    <span ref={box} className="relative inline-flex items-center gap-1.5 max-w-full" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      <span aria-describedby={open ? id : undefined} className="min-w-0">{children}</span>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o); }}
        aria-expanded={open}
        aria-label={t("quickView")}
        className="hidden [@media(hover:none)]:inline-flex shrink-0 h-6 w-6 items-center justify-center rounded-md border border-line text-[11px] text-muted"
      >
        i
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          onClick={(e) => e.preventDefault()}
          className="anim-rise absolute left-0 top-full z-30 mt-2 w-72 cursor-default rounded-xl border border-line bg-surface p-4 text-left shadow-lg"
        >
          <span className="block text-xs font-medium text-muted mb-1.5">{t("recentShows")}</span>
          {data.recentShows.length ? (
            <span className="block space-y-1 mb-3">
              {data.recentShows.map((s, i) => (
                <span key={i} className="flex gap-2 text-sm">
                  <span className="w-12 shrink-0 text-muted tnum">{formatShortDate(s.date, locale)}</span>
                  <span className="min-w-0 truncate">{s.venueName ?? t("privateEvent")}, {loc(CITIES[s.city].name, locale)}</span>
                </span>
              ))}
            </span>
          ) : <span className="block text-sm text-muted mb-3">{t("noShows")}</span>}
          <span className="block text-xs font-medium text-muted mb-1.5">{music ? t("songs") : t("acts")}</span>
          <span className="block space-y-1">
            {data.signatureSongs.map((s) => (
              <span key={s.title} className="block text-sm">
                {s.title} <span className="text-muted">· {s.original}</span>
              </span>
            ))}
          </span>
        </span>
      )}
    </span>
  );
}
