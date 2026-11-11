/*
 * Converts a WebM recording to MP4 (H.264) without extra software: plays it in Microsoft Edge
 * and re-records the stream with MediaRecorder. Runs in real time (a 5-minute video takes ~5 minutes).
 *   node scripts/webm-to-mp4.mjs [in.webm] [out.mp4]
 */
import { chromium } from "@playwright/test";
import { statSync } from "node:fs";
import { resolve } from "node:path";

const input = resolve(process.argv[2] ?? "recordings/livestage-demo.webm");
const output = resolve(process.argv[3] ?? input.replace(/\.webm$/i, ".mp4"));
const ORIGIN = "http://convert.local";

const browser = await chromium.launch({ channel: "msedge" }).catch(() => chromium.launch());
const page = await browser.newPage({ acceptDownloads: true });
await page.route(`${ORIGIN}/**`, (route) =>
  route.request().url().endsWith("/in.webm")
    ? route.fulfill({ path: input, contentType: "video/webm" })
    : route.fulfill({ body: "<!doctype html><title>convert</title><body></body>", contentType: "text/html" }));
await page.goto(`${ORIGIN}/`);

const download = page.waitForEvent("download", { timeout: 0 });
const info = await page.evaluate(async () => {
  const mime = ["video/mp4;codecs=avc1.640028", "video/mp4;codecs=avc1.42E01E", "video/mp4"].find((m) => MediaRecorder.isTypeSupported(m));
  if (!mime) throw new Error("This browser cannot record MP4");
  const v = document.createElement("video");
  v.src = "/in.webm"; v.muted = true; v.playsInline = true;
  document.body.appendChild(v);
  await new Promise((ok, fail) => { v.onloadedmetadata = ok; v.onerror = () => fail(new Error("cannot load video")); });
  const stream = v.captureStream(25);
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise((ok) => { rec.onstop = ok; });
  v.onended = () => rec.stop();
  rec.start(1000);
  await v.play();
  await done;
  const url = URL.createObjectURL(new Blob(chunks, { type: "video/mp4" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: "out.mp4" });
  document.body.appendChild(a); a.click();
  return { mime, seconds: Math.round(v.duration) };
});
await (await download).saveAs(output);
await browser.close();
console.log(`saved ${output} (${info.mime}, ${info.seconds}s, ${(statSync(output).size / 1e6).toFixed(1)} MB)`);
