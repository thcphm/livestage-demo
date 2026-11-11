/*
 * Records a narrated walkthrough of the demo: captions burned into the page and a visible cursor.
 * Each scene lasts at least as long as its voice-over (<out>/voice/durations.json, from
 * `node scripts/dub-demo.mjs voice`), and the start time of every scene is written to <out>/cues.json
 * so `node scripts/dub-demo.mjs mix` can lay the voice exactly under it.
 * Needs the demo running, e.g. start-demo.cmd, or: NEXT_DIST_DIR=.next-demo next start -p 3011
 *   DEMO_LANG=vi|en node scripts/record-demo.mjs [baseUrl] [outDir]
 * The Vietnamese video starts in Vietnam and switches to Canada; the English one stays in Canada.
 */
import { chromium } from "@playwright/test";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { scenesFor } from "./demo-narration.mjs";

/** vi / en: full walkthrough · boss: short R1–R7 cut in the English UI with Vietnamese captions. */
const CUT = ["en", "boss"].includes(process.env.DEMO_LANG) ? process.env.DEMO_LANG : "vi";
const L = CUT === "vi" ? "vi" : "en"; // language of the UI being recorded
const SCENES = scenesFor(CUT);
const MSG = JSON.parse(readFileSync(`src/messages/${L}.json`, "utf8"));
/** UI string from the app's own messages, so locators always match the language being recorded. */
const T = (key, vars = {}) =>
  Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, v), key.split(".").reduce((o, k) => o[k], MSG));
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const BASE = process.argv[2] ?? "http://localhost:3011";
const OUT = process.argv[3] ?? (CUT === "vi" ? "recordings" : `recordings/${CUT}`);
const W = 1440, H = 900;
const GAP = 0.6; // seconds of breathing room after each line of voice-over
mkdirSync(OUT, { recursive: true });
const tmp = join(OUT, "_raw");
rmSync(tmp, { recursive: true, force: true });
const durFile = join(OUT, "voice", "durations.json");
const DUR = existsSync(durFile) ? JSON.parse(readFileSync(durFile, "utf8")) : {};
const VIDEO = { vi: "livestage-demo.webm", en: "livestage-demo-en.webm", boss: "livestage-highlights-vi.webm" }[CUT];

// Injected on every page: a cursor that follows the mouse, click ripples, the caption bar and title cards.
const OVERLAY = () => {
  const css = `
    #rec-cursor{position:fixed;z-index:2147483647;width:22px;height:22px;margin:-4px 0 0 -4px;pointer-events:none;
      background:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M3 2l7 19 2.5-7.5L20 11z' fill='%231a1d29' stroke='white' stroke-width='1.5' stroke-linejoin='round'/></svg>") no-repeat}
    .rec-ripple{position:fixed;z-index:2147483646;width:36px;height:36px;margin:-18px 0 0 -18px;border-radius:50%;border:3px solid #d2461f;pointer-events:none;animation:rec-r .5s ease-out forwards}
    @keyframes rec-r{from{transform:scale(.3);opacity:1}to{transform:scale(1.6);opacity:0}}
    #rec-cap{position:fixed;z-index:2147483645;pointer-events:none;left:50%;bottom:28px;transform:translateX(-50%);max-width:1100px;width:calc(100% - 80px);
      background:rgba(28,37,65,.94);color:#fff;border-radius:14px;padding:16px 24px;font:500 22px/1.45 'Be Vietnam Pro',system-ui,sans-serif;
      box-shadow:0 12px 40px rgba(0,0,0,.35);display:none}
    #rec-cap b{display:inline-block;margin-right:10px;padding:2px 10px;border-radius:6px;background:#d2461f;font-size:15px;font-weight:700;vertical-align:3px}
    #rec-cap small{display:block;margin-top:4px;font-size:17px;font-weight:400;color:#c9cfe0}
    #rec-title{position:fixed;inset:0;z-index:2147483644;display:none;pointer-events:none;place-items:center;background:#1c2541;color:#fff;text-align:center;font-family:'Be Vietnam Pro',system-ui,sans-serif}
    #rec-title h1{font-size:56px;font-weight:700;margin:0} #rec-title p{font-size:24px;color:#c9cfe0;margin:14px 0 0}
    #rec-title .mark{display:inline-grid;place-items:center;width:64px;height:64px;border-radius:14px;background:#d2461f;margin-bottom:22px;font-size:34px}
    .rec-hl{outline:4px solid #d2461f !important;outline-offset:4px;border-radius:10px}`;
  const mount = () => {
    if (document.getElementById("rec-cap")) return;
    const s = document.createElement("style"); s.textContent = css; document.head.appendChild(s);
    const c = document.createElement("div"); c.id = "rec-cursor"; document.body.appendChild(c);
    const cap = document.createElement("div"); cap.id = "rec-cap"; document.body.appendChild(cap);
    const t = document.createElement("div"); t.id = "rec-title"; document.body.appendChild(t);
    const pos = JSON.parse(sessionStorage.getItem("rec-pos") || "[720,450]");
    c.style.left = pos[0] + "px"; c.style.top = pos[1] + "px";
    addEventListener("mousemove", (e) => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; sessionStorage.setItem("rec-pos", JSON.stringify([e.clientX, e.clientY])); }, true);
    addEventListener("mousedown", (e) => { const r = document.createElement("div"); r.className = "rec-ripple"; r.style.left = e.clientX + "px"; r.style.top = e.clientY + "px"; document.body.appendChild(r); setTimeout(() => r.remove(), 600); }, true);
    window.__cap = (html) => { sessionStorage.setItem("rec-cap", html || ""); cap.innerHTML = html || ""; cap.style.display = html ? "block" : "none"; };
    window.__title = (html) => { sessionStorage.setItem("rec-title", html || ""); t.innerHTML = html || ""; t.style.display = html ? "grid" : "none"; };
    window.__cap(sessionStorage.getItem("rec-cap"));
    window.__title(sessionStorage.getItem("rec-title"));
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, locale: L === "en" ? "en-CA" : "vi-VN", recordVideo: { dir: tmp, size: { width: W, height: H } } });
await ctx.addInitScript(OVERLAY);
const page = await ctx.newPage();
const t0 = Date.now(); // the video starts with the page
const wait = (ms) => page.waitForTimeout(ms);
const cues = [];

const setCap = (html) => page.evaluate(([h]) => window.__cap?.(h), [html]);
const title = (html) => page.evaluate(([h]) => window.__title?.(h), [html]);
const capHtml = (s) => (s?.line ? `${s.tag ? `<b>${s.tag}</b>` : ""}${s.line}${s.detail ? `<small>${s.detail}</small>` : ""}` : "");
const region = (r) => page.context().addCookies([{ name: "ls_region", value: r, url: BASE }]);

/** One narrated scene: shows its caption, runs the actions, then holds until the voice-over has finished. */
async function scene(id, actions = async () => {}) {
  await setCap(capHtml(SCENES[id]));
  const start = (Date.now() - t0) / 1000;
  cues.push({ id, at: Math.round(start * 100) / 100 });
  await actions();
  const need = ((DUR[id] ?? 3) + GAP) * 1000;
  const spent = Date.now() - t0 - start * 1000;
  if (spent < need) await wait(need - spent);
}

const go = async (path) => { await page.goto(`${BASE}/${L}${path}`, { waitUntil: "networkidle" }); await wait(300); };
const scrollTo = async (y, ms = 1200) => { await page.evaluate(([top]) => window.scrollTo({ top, behavior: "smooth" }), [y]); await wait(ms); };
const scrollIntoView = async (loc, ms = 1100) => { await loc.first().evaluate((el) => el.scrollIntoView({ behavior: "smooth", block: "center" })); await wait(ms); };
async function point(loc) {
  loc = loc.first();
  await scrollIntoView(loc, 800);
  const b = await loc.boundingBox();
  if (b) await page.mouse.move(b.x + Math.min(b.width / 2, 60), b.y + b.height / 2, { steps: 25 });
  await wait(250);
}
async function click(loc, after = 1000) { await point(loc); await loc.first().click(); await page.waitForLoadState("networkidle").catch(() => {}); await wait(after); }
async function hl(loc, ms = 2000) {
  loc = loc.first();
  await scrollIntoView(loc, 700);
  await loc.evaluate((el) => el.classList.add("rec-hl"));
  await wait(ms);
  await loc.evaluate((el) => el.classList.remove("rec-hl")).catch(() => {});
}
/** Switches demo account (no voice-over; a short caption says what happens). */
async function switchAccount(email, next) {
  await setCap(L === "en" ? `<b>Switch role</b>Switching to demo account ${email}` : `<b>Đổi vai trò</b>Chuyển sang tài khoản demo ${email}`);
  await go(`/demo?next=${encodeURIComponent(next)}`);
  await click(page.getByRole("button", { name: new RegExp(esc(email)) }), 900);
}
const heading = (key) => page.getByRole("heading", { name: T(key) });
const tab = (key) => page.getByRole("link", { name: T(`dash.tabs.${key}`), exact: true });
const startsWith = (text) => new RegExp(`^${esc(text)}`);
const MARK = `<div class="mark">🎤</div><h1>LiveStage</h1>`;

/* ---------------- management cut (R1–R7, Canada, English UI, Vietnamese captions) ---------------- */

async function bossFlow() {
  await page.goto(`${BASE}/${L}/demo`, { waitUntil: "networkidle" });
  await title(`<div>${MARK}</div>`);
  await page.getByRole("button", { name: T("demo.reset") }).click();
  await page.waitForLoadState("networkidle");
  await region("ca");
  await go("");

  await scene("intro", async () => {
    await title(`<div>${MARK}<p>Các tính năng chính theo yêu cầu · Khu vực Canada</p><p style="font-size:18px;margin-top:28px">Bản demo giới thiệu · vận hành bởi Olive</p></div>`);
  });
  await title("");
  await scene("home", async () => { await wait(1200); await hl(page.locator("form").first(), 2500); });
  await scene("quick", async () => {
    const names = page.locator("article a.font-semibold");
    await scrollIntoView(names.nth(0), 900);
    await point(names.nth(0)); await wait(4000);
    await point(names.nth(2)); await wait(2500);
    await page.mouse.move(700, 120, { steps: 15 });
  });
  await scene("tour", async () => {
    await scrollIntoView(heading("home.trips"), 1500);
    await hl(page.locator("section", { has: heading("home.trips") }).getByRole("link", { name: /Aria Benoit/ }), 5000);
  });
  await scrollTo(0, 900);
  await scene("search", async () => {
    await point(page.locator("select[name=city]"));
    await page.selectOption("select[name=city]", "ham"); await wait(600);
    await point(page.locator("input[name=date]"));
    await page.fill("input[name=date]", "2026-12-13"); await wait(600);
    await click(page.getByRole("button", { name: T("home.search") }), 1000);
    await hl(page.getByText(T("card.inCity", { city: "Hamilton" })), 3500);
  });
  await scene("schedule", async () => {
    await click(page.getByRole("link", { name: "Aria Benoit" }), 1200);
    await scrollIntoView(heading("profile.schedule"));
    await hl(page.getByText(`${T("profile.privateEvent")} · Hamilton`), 4000);
  });

  await switchAccount("olivia@demo.com", "/dashboard/bookings/w4");
  await scene("client", async () => { await wait(2500); await hl(page.locator("aside section").first(), 3000); });
  await scene("setlist", async () => {
    await scrollIntoView(heading("booking.setlist"), 1500);
    await hl(page.getByText(T("booking.requests"), { exact: true }).locator(".."), 6000);
  });
  await scene("contract", async () => { await scrollIntoView(heading("booking.contract"), 1500); await hl(heading("booking.contract").locator("xpath=ancestor::section[1]"), 5000); });
  await scene("messages", async () => { await scrollIntoView(page.locator("#messages")); await hl(page.getByText(T("booking.masked")), 4000); });
  await scene("pay", async () => {
    await click(page.getByRole("button", { name: T("booking.acceptQuote") }), 1500);
    await click(page.getByRole("button", { name: startsWith(T("booking.payButton").split("{")[0].trim()) }), 1200);
  });
  await scene("confirmed", async () => { await scrollTo(0, 1000); await hl(page.locator("aside section").first(), 3000); await scrollIntoView(page.locator("#messages")); });

  await switchAccount("aria@demo.com", "/dashboard/artist?tab=calendar&month=2026-12");
  await scene("artistCal", async () => { await wait(1500); await scrollTo(250, 1500); });

  await switchAccount("admin@demo.com", "/dashboard/admin?tab=artists");
  await scene("adminFee", async () => { await wait(1000); await hl(page.locator("table tbody tr").first(), 3500); });
  await scene("adminSplit", async () => { await go("/dashboard/bookings/w4"); await hl(page.getByText(T("booking.feeOnly")).locator("xpath=ancestor::section[1]"), 4500); });

  await setCap("");
  await scene("outro", async () => {
    await title(`<div>${MARK}<p>Cảm ơn đã theo dõi · Bản demo – dữ liệu mẫu, thanh toán giả lập</p></div>`);
  });
  await wait(1500);
}

/* ---------------- full walkthrough ---------------- */

async function fullFlow() {
await page.goto(`${BASE}/${L}/demo`, { waitUntil: "networkidle" });
await title(`<div>${MARK}</div>`);
await page.getByRole("button", { name: T("demo.reset") }).click();
await page.waitForLoadState("networkidle");
await region(L === "en" ? "ca" : "vn");
await go("");

await scene("intro", async () => {
  await title(L === "en"
    ? `<div>${MARK}<p>Book live performers &amp; sell show tickets · Canada and Vietnam</p><p style="font-size:18px;margin-top:28px">Feature demo · run by Olive</p></div>`
    : `<div>${MARK}<p>Nền tảng đặt nghệ sĩ biểu diễn &amp; bán vé show · Việt Nam và Canada</p><p style="font-size:18px;margin-top:28px">Bản demo giới thiệu chức năng · vận hành bởi Olive</p></div>`);
});
await title("");

await scene("home1", async () => { await wait(1500); await hl(page.locator("form").first(), 3000); });
await scene("home2", async () => { await scrollTo(520, 1500); });
await scene("home3", async () => { await scrollTo(760, 1500); });
await scene("quick", async () => {
  const names = page.locator("article a.font-semibold");
  await scrollIntoView(names.nth(0), 900);
  await point(names.nth(0)); await wait(4200);
  await point(names.nth(1)); await wait(3500);
  await page.mouse.move(700, 120, { steps: 15 });
});
await scene("trips", async () => { await scrollIntoView(heading("home.trips")); });
await scene("shows", async () => { await scrollIntoView(heading("home.shows")); });
await scene("private", async () => { await scrollIntoView(heading("home.privateTitle")); });
await scene("how", async () => { await scrollIntoView(heading("home.how")); });

await scrollTo(0, 1000);
await scene("region", async () => {
  await click(page.getByRole("button", { name: T("regionLang.button") }), 800);
  if (L === "en") {
    // Show both regions, then stay in Canada.
    await point(page.getByRole("button", { name: /^Vietnam/ })); await wait(1500);
    await point(page.getByRole("button", { name: /^Canada/ })); await wait(1200);
    await page.keyboard.press("Escape"); await wait(600);
  } else {
    await click(page.getByRole("button", { name: /^Canada/ }), 1500);
  }
});
await scene("searchDate", async () => {
  await point(page.locator("select[name=city]"));
  await page.selectOption("select[name=city]", "ham"); await wait(700);
  await point(page.locator("input[name=date]"));
  await page.fill("input[name=date]", "2026-12-13"); await wait(800);
  await click(page.getByRole("button", { name: T("home.search") }), 1200);
});
await scene("searchResult", async () => { await hl(page.getByText(T("card.inCity", { city: "Hamilton" })), 4000); await scrollTo(380, 1500); });

await scene("profile1", async () => { await click(page.getByRole("link", { name: "Aria Benoit" }), 1500); });
await scene("profile2", async () => { await hl(page.locator("aside"), 4500); });
await scene("profile3", async () => { await scrollIntoView(heading("profile.songs")); });
await scene("profile4", async () => { await scrollIntoView(heading("profile.schedule")); await hl(page.getByText(`${T("profile.privateEvent")} · Hamilton`), 3500); });
await scene("profile5", async () => { await scrollIntoView(page.getByRole("heading", { name: new RegExp(esc(T("profile.reviews"))) })); });

if (L === "vi") await region("vn");
await scene("tickets1", async () => { await go("/shows"); await wait(800); await click(page.locator('main a[href*="/shows/"]'), 800); });
await scene("tickets2", async () => {
  const name = page.getByLabel(T("shows.name"));
  const email = page.getByLabel(T("shows.email"));
  await point(name); await name.pressSequentially(L === "en" ? "Olivia Grant" : "Trần Bảo Ngọc", { delay: 50 });
  await point(email); await email.pressSequentially(L === "en" ? "olivia.grant@example.com" : "ngoc.tran@example.com", { delay: 30 });
  await wait(400);
  await click(page.getByRole("button", { name: T("shows.pay"), exact: true }), 800);
});
await scene("tickets3");

await scene("roles", async () => { await go("/demo"); await wait(3000); await scrollTo(450, 2000); });

await switchAccount("thuha@demo.com", "/dashboard/bookings/w1");
await scene("client1", async () => { await wait(3000); await scrollIntoView(heading("booking.quote")); });
await scene("client2", async () => { await scrollIntoView(heading("booking.setlist")); });
await scene("client3", async () => { await hl(page.getByText(T("booking.requests"), { exact: true }).locator(".."), 5000); });
await scene("client4", async () => { await scrollIntoView(heading("booking.contract")); });
await scene("client5", async () => { await scrollIntoView(page.locator("#messages")); await hl(page.getByText(T("booking.masked")), 3500); });
await scene("client6", async () => { await click(page.getByRole("button", { name: T("booking.acceptQuote") }), 800); });
await scene("client7", async () => { await click(page.getByRole("button", { name: startsWith(T("booking.payButton").split("{")[0].trim()) }), 1000); });
await scene("client8", async () => { await scrollTo(0, 1000); await hl(page.locator("aside section"), 2800); await scrollIntoView(page.locator("#messages")); });

await switchAccount("baonam@demo.com", "/dashboard/bookings/w3");
await scene("artist1", async () => { await hl(page.getByText(T("booking.addressHidden")), 4000); });
await scene("artist2", async () => {
  const price = page.getByPlaceholder(startsWith(T("booking.price")));
  await point(price); await price.pressSequentially("3000000", { delay: 60 }); await wait(400);
  await click(page.getByRole("button", { name: T("booking.sendQuote") }), 1000);
  await scrollIntoView(page.getByText(T("booking.contractVersion", { v: "1" })));
});
await scene("artist3", async () => {
  const fee = page.getByPlaceholder(startsWith(T("booking.extraFee")));
  await point(fee); await fee.pressSequentially("200000", { delay: 60 });
  await click(page.getByRole("button", { name: T("booking.acceptSong"), exact: true }), 1000);
});
await scene("artist4", async () => { await scrollIntoView(page.getByText(T("booking.contractVersion", { v: "2" }))); });

await switchAccount("aria@demo.com", "/dashboard/artist?tab=calendar&month=2026-12");
await scene("calendar", async () => { await wait(2000); await scrollTo(250, 1500); });
await scene("tripsTab", async () => { await scrollTo(0, 600); await click(tab("trips"), 800); });
await scene("songsTab", async () => { await click(tab("songs"), 800); });
await scene("opps", async () => { await click(page.getByRole("link", { name: startsWith(T("dash.tabs.opps")) }), 800); });

await switchAccount(L === "en" ? "maple@demo.com" : "jazz@demo.com", "/dashboard/venue?tab=shows");
await scene("venue1");
await scene("venue2", async () => { await click(tab("slot"), 800); });

await switchAccount("sarah@demo.com", "/quote?eventType=birthday");
await scene("quickQuote", async () => { await wait(2500); await scrollTo(300, 2000); });

await region("ca");
await switchAccount("admin@demo.com", "/dashboard/admin?tab=artists");
await scene("admin1");
await scene("admin2", async () => { await go("/dashboard/bookings/w2"); await hl(page.getByText(T("booking.feeOnly")).locator("xpath=ancestor::section[1]"), 4000); });
await scene("admin3", async () => {
  await click(page.getByRole("link", { name: T("booking.back") }), 600);
  await click(tab("overview"), 600);
});

await setCap("");
await scene("outro", async () => {
  await title(L === "en"
    ? `<div>${MARK}<p>Thanks for watching · Demo – sample data, simulated payments</p></div>`
    : `<div>${MARK}<p>Cảm ơn đã theo dõi · Bản demo – dữ liệu mẫu, thanh toán giả lập</p></div>`);
});
await wait(1500);
}

await (CUT === "boss" ? bossFlow() : fullFlow());

const duration = (Date.now() - t0) / 1000;
await ctx.close();
await browser.close();
const raw = readdirSync(tmp).find((f) => f.endsWith(".webm"));
renameSync(join(tmp, raw), join(OUT, VIDEO));
rmSync(tmp, { recursive: true, force: true });
writeFileSync(join(OUT, "cues.json"), JSON.stringify({ duration: Math.round(duration * 100) / 100, video: VIDEO, cues }, null, 2));
console.log("saved", join(OUT, VIDEO), `${duration.toFixed(1)}s`, `${cues.length} cues`);
