import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export const inputCls =
  "w-full h-11 rounded-lg border border-line bg-surface px-3 text-[15px] text-ink placeholder:text-muted focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink aria-[invalid=true]:border-bad";

export function Field({ label, hint, error, children }: { label: ReactNode; hint?: ReactNode; error?: ReactNode; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="block mb-1.5 text-[13px] font-medium text-ink">{label}</span>
      {children}
      {error ? <span className="block mt-1 text-xs text-bad">{error}</span> : hint && <span className="block mt-1 text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Input({ className = "", invalid, ...props }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input {...props} aria-invalid={invalid || undefined} className={`${inputCls} ${className}`} />;
}

export function Select({ options, invalid, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[]; invalid?: boolean }) {
  return (
    <select {...props} aria-invalid={invalid || undefined} className={inputCls}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function Alert({ tone, children }: { tone: "bad" | "ok" | "info"; children: ReactNode }) {
  const cls = { bad: "bg-badsoft text-bad", ok: "bg-oksoft text-ok", info: "bg-infosoft text-info" }[tone];
  return <div role={tone === "bad" ? "alert" : "status"} className={`rounded-lg px-3 py-2 text-sm ${cls}`}>{children}</div>;
}

/** Centred card used by the login / register / password pages. */
export function AuthCard({ title, sub, children }: { title: ReactNode; sub?: ReactNode; children: ReactNode }) {
  return (
    <div className="wrap py-10 sm:py-14">
      <div className="mx-auto max-w-md rounded-xl border border-line bg-surface">
        <div className="border-b border-line px-6 py-4">
          <h1 className="h-sub">{title}</h1>
          {sub && <p className="text-sm text-muted mt-0.5">{sub}</p>}
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
