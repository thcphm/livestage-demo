import "server-only";
import { buildDemoData } from "./data";
import type { DemoData } from "./types";

/**
 * In-memory demo store. Changes made while clicking through the demo (tickets, quotes, messages…)
 * live in this server process and reset on restart – this is a showcase, not persistence.
 */
const g = globalThis as unknown as { __livestageDemo?: DemoData };

export function getStore(): DemoData {
  g.__livestageDemo ??= buildDemoData();
  return g.__livestageDemo;
}

export function resetStore(): void {
  g.__livestageDemo = buildDemoData();
}

/** "Today" for the demo, so the dataset (Oct–Dec 2026) always has upcoming shows. */
export const DEMO_TODAY = "2026-10-30";

export const nowIso = (): string => new Date().toISOString().slice(0, 16);

let counter = 0;
export const newId = (prefix: string): string => `${prefix}${Date.now().toString(36)}${(counter++).toString(36)}`;
