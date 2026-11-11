import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

export interface DashTab {
  key: string;
  label: string;
  count?: number;
}

/** Dashboard frame: name and role line, an optional action, `?tab=` links, then the tab content. */
export function DashShell({ title, sub, avatar, action, tabs, active, basePath, children }: {
  title: ReactNode;
  sub?: ReactNode;
  avatar?: ReactNode;
  action?: ReactNode;
  tabs: DashTab[];
  active: string;
  basePath: string;
  children?: ReactNode;
}) {
  return (
    <div className="wrap py-6 sm:py-8">
      <div className="flex flex-wrap items-center gap-4 border-b border-line pb-5">
        {avatar}
        <div className="min-w-0 flex-1">
          <h1 className="h-sec">{title}</h1>
          {sub && <div className="mt-1 text-muted">{sub}</div>}
        </div>
        {action}
      </div>
      <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none]">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={{ pathname: basePath, query: { tab: tab.key } }}
            aria-current={tab.key === active ? "page" : undefined}
            className={`-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-[15px] ${tab.key === active ? "border-ink font-semibold text-ink" : "border-transparent text-muted hover:text-ink"}`}
          >
            {tab.label}
            {!!tab.count && <span className="rounded-md bg-gold px-1.5 text-xs font-bold text-ink tnum">{tab.count}</span>}
          </Link>
        ))}
      </nav>
      <div className="mt-6 space-y-6">{children}</div>
    </div>
  );
}

/** The active tab from `?tab=`, falling back to the first one. */
export const pickTab = <T extends DashTab>(tabs: T[], requested?: string): T => tabs.find((t) => t.key === requested) ?? tabs[0];
