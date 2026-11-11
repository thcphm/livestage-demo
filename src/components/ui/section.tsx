import type { ReactNode } from "react";

/** Page section: one heading, an optional one-line subtitle and an optional action on the right. */
export function Section({ id, title, sub, action, children, className = "" }: {
  id?: string;
  title: ReactNode;
  sub?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-24 ${className}`}>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 mb-4">
        <div>
          <h2 className="h-sec">{title}</h2>
          {sub && <p className="text-sm text-muted mt-1">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
