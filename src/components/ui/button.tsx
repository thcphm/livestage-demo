import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "dark" | "ghost" | "soft" | "light" | "danger" | "ok";
export type ButtonSize = "sm" | "md" | "lg";

const SIZES: Record<ButtonSize, string> = {
  sm: "text-[13.5px] px-3 h-9",
  md: "text-[15px] px-5 h-11",
  lg: "text-[15px] px-6 h-12",
};

/** `primary` (evergreen) is the main action of a view; `dark` and `ghost` for the rest; `light` (white) sits on photos and dark bands. */
const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-onaccent hover:bg-accentink",
  dark: "bg-ink text-bg hover:opacity-90",
  ghost: "border border-ink/25 bg-surface text-ink hover:border-ink hover:bg-surface2",
  soft: "bg-surface2 text-ink hover:brightness-95",
  light: "bg-white text-[#14171a] hover:bg-[#f1f3f2]",
  danger: "border border-line bg-surface text-bad hover:bg-badsoft",
  ok: "bg-ok text-bg hover:brightness-110",
};

/** Class string for anything styled as a button (also used on links). */
export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", extra = ""): string {
  return `inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${SIZES[size]} ${VARIANTS[variant]} ${extra}`;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize };

export function Button({ variant, size, className = "", type = "button", ...props }: ButtonProps) {
  return <button type={type} {...props} className={buttonClass(variant, size, className)} />;
}
