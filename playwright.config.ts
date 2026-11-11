import { config } from "dotenv";
import { defineConfig, devices } from "@playwright/test";

config({ path: ".env.local" });

// E2E_PORT points the suite at an already running server; PW_CHANNEL=msedge uses the installed Edge instead of a downloaded Chromium.
const PORT = Number(process.env.E2E_PORT ?? 3000);
const channel = process.env.PW_CHANNEL;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  // One worker: every spec file shares the server's in-memory sample data and resets it.
  workers: 1,
  retries: 0,
  reporter: "list",
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"], ...(channel ? { channel } : {}) } },
  ],
  webServer: {
    command: "pnpm dev",
    url: `http://localhost:${PORT}/vi`,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
