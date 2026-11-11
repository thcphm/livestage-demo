import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { BOOKING_STATUS, type BookingStatus } from "@/lib/catalog";
import { Icon } from "./icon";

type Tone = "neutral" | "ok" | "warn" | "bad" | "info" | "accent" | "gold";

const TONES: Record<Tone, string> = {
  neutral: "bg-surface2 text-muted",
  ok: "bg-oksoft text-ok",
  warn: "bg-warnsoft text-warn",
  bad: "bg-badsoft text-bad",
  info: "bg-infosoft text-info",
  accent: "bg-accentsoft text-accentink",
  gold: "bg-gold text-ink",
};

export function Badge({ tone = "neutral", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[12.5px] font-semibold whitespace-nowrap ${TONES[tone]} ${className}`}>{children}</span>;
}

export async function StatusBadge({ status }: { status: BookingStatus }) {
  const t = await getTranslations("status");
  return <Badge tone={BOOKING_STATUS[status].tone as Tone}>{t(status)}</Badge>;
}

/** "★ 4.9 (86)" with the count in muted text. */
export function Rating({ value, count, className = "" }: { value: number; count?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-sm tnum ${className}`}>
      <Icon name="star" size={14} fill className="text-ink" />
      <span className="font-medium">{value.toFixed(1)}</span>
      {count !== undefined && <span className="text-muted">({count})</span>}
    </span>
  );
}
