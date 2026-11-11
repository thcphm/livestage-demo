"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";

export const THEME_KEY = "ls_theme";

/**
 * Runs before first paint (inlined in <head>) so a saved dark theme never flashes light.
 * The choice lives in localStorage; without one the site stays light.
 */
export const themeInitScript = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="dark")document.documentElement.dataset.theme="dark"}catch(e){}`;

/** Light / dark switch in the header. */
export function ThemeToggle() {
  const t = useTranslations("nav");
  const [dark, setDark] = useState(false);

  // The server cannot know the saved theme, so read what the init script applied once mounted.
  useEffect(() => { setDark(document.documentElement.dataset.theme === "dark"); }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    if (next) document.documentElement.dataset.theme = "dark";
    else delete document.documentElement.dataset.theme;
    try { localStorage.setItem(THEME_KEY, next ? "dark" : "light"); } catch { /* private mode: applies to this page only */ }
  };

  const label = dark ? t("themeLight") : t("themeDark");
  return (
    <button type="button" onClick={toggle} aria-pressed={dark} aria-label={label} title={label} className="grid h-11 w-11 place-items-center rounded-lg text-muted hover:bg-surface2 hover:text-ink">
      <Icon name={dark ? "sun" : "moon"} size={18} />
    </button>
  );
}
