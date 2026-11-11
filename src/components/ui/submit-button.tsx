"use client";

import type { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";

/**
 * Submit button for server-action forms: dims and shows a wait cursor while the action runs,
 * so a click never looks ignored.
 */
export function SubmitButton({ className = "", disabled, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      {...props}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={`${className} ${pending ? "opacity-60 cursor-wait" : ""}`}
    >
      {children}
    </button>
  );
}
