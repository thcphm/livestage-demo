/*
 * Voice-over and final mix for the demo video.
 *   DEMO_LANG=vi|en|boss node scripts/dub-demo.mjs voice  – one MP3 per scene (edge-tts) + durations.json
 *   DEMO_LANG=vi|en|boss node scripts/dub-demo.mjs mix    – voice at the recorded cue times + soft generated
 *                                                     background music, muxed with the WebM into an MP4
 * vi → recordings/livestage-demo.mp4 (vi-VN-NamMinhNeural) · en → recordings/en/livestage-demo-en.mp4 (en-CA-LiamNeural)
 * boss → recordings/boss/livestage-highlights-vi.mp4: short R1–R7 cut, Vietnamese voice with English words in en-CA-LiamNeural
 * Env: TTS_PYTHON (a Python with edge-tts installed), FFMPEG (path to a full ffmpeg build), VOICE (optional override).
 * The background music is synthesised by ffmpeg (no third-party audio, no licence questions).
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { scenesFor } from "./demo-narration.mjs";

const L = ["en", "boss"].includes(process.env.DEMO_LANG) ? process.env.DEMO_LANG : "vi";
const SCENES = scenesFor(L);
const OUT = resolve(L === "vi" ? "recordings" : `recordings/${L}`);
const VOICE_DIR = join(OUT, "voice");
const VOICE = process.env.VOICE ?? (L === "en" ? "en-CA-LiamNeural" : "vi-VN-NamMinhNeural");
// The management cut speaks Vietnamese but says English names and terms ([[...]]) with this voice.
const EN_VOICE = process.env.EN_VOICE ?? "en-CA-LiamNeural";
const MP4 = { vi: "livestage-demo.mp4", en: "livestage-demo-en.mp4", boss: "livestage-highlights-vi.mp4" }[L];
const step = process.argv[2];

if (step === "voice") {
  const py = process.env.TTS_PYTHON;
  if (!py) throw new Error("Set TTS_PYTHON to a Python that has edge-tts installed");
  mkdirSync(VOICE_DIR, { recursive: true });
  const texts = Object.fromEntries(Object.entries(SCENES).map(([id, s]) => [id, s.voice]));
  const json = join(VOICE_DIR, "scenes.json");
  writeFileSync(json, JSON.stringify(texts, null, 2), "utf8");
  const mixed = L === "boss" ? [EN_VOICE, process.env.FFMPEG ?? ""] : [];
  if (L === "boss" && !process.env.FFMPEG) throw new Error("Set FFMPEG: the boss cut splices English words into the voice");
  execFileSync(py, [resolve("scripts/tts.py"), json, VOICE_DIR, VOICE, ...mixed], { stdio: "inherit" });
}

if (step === "mix") {
  const ff = process.env.FFMPEG;
  if (!ff) throw new Error("Set FFMPEG to a full ffmpeg build");
  const cues = JSON.parse(readFileSync(join(OUT, "cues.json"), "utf8"));
  const video = join(OUT, cues.video ?? "livestage-demo.webm");
  const total = cues.duration;

  // Background: slow I–vi–IV–V pad (C, Am, F, G), soft sine voices with gentle tremolo, low-passed.
  const chords = [[261.63, 329.63, 392.0], [220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [196.0, 246.94, 293.66]];
  const bar = 4; // seconds per chord
  const tone = (f) => `sin(2*PI*${f}*t)+0.35*sin(2*PI*${f * 2}*t)`;
  const chordExpr = chords.map((c, i) =>
    `between(mod(t,${bar * chords.length}),${i * bar},${(i + 1) * bar})*(${c.map(tone).join("+")})`).join("+");
  const pad = `aevalsrc='0.06*(${chordExpr})*(0.85+0.15*sin(2*PI*0.25*t))':s=44100:d=${total.toFixed(2)}`;

  const inputs = ["-y", "-i", video, "-f", "lavfi", "-i", pad];
  const parts = [];
  cues.cues.forEach((c, i) => {
    const mp3 = join(VOICE_DIR, `${c.id}.mp3`);
    if (!existsSync(mp3)) return;
    inputs.push("-i", mp3);
    const ms = Math.max(0, Math.round(c.at * 1000));
    parts.push({ label: `v${i}`, filter: `[${inputs.filter((x) => x === "-i").length - 1}:a]aresample=44100,adelay=${ms}|${ms},apad=whole_dur=${total.toFixed(2)}[v${i}]` });
  });
  const voiceMix = `${parts.map((p) => `[${p.label}]`).join("")}amix=inputs=${parts.length}:normalize=0:dropout_transition=0,volume=1.6[voice]`;
  // Music sits well under the voice and ducks further while someone is speaking; fades in and out.
  const music = `[1:a]lowpass=f=1800,volume=0.5,afade=t=in:d=2,afade=t=out:st=${(total - 3).toFixed(2)}:d=3[mus]`;
  const duck = `[mus][voicekey]sidechaincompress=threshold=0.02:ratio=8:attack=20:release=600[ducked]`;
  const filter = [
    ...parts.map((p) => p.filter),
    voiceMix,
    "[voice]asplit=2[voiceout][voicekey]",
    music,
    duck,
    "[voiceout][ducked]amix=inputs=2:normalize=0:dropout_transition=0,alimiter=limit=0.95[aout]",
  ].join(";");

  const mp4 = join(OUT, MP4);
  execFileSync(ff, [...inputs, "-filter_complex", filter, "-map", "0:v", "-map", "[aout]",
    "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", mp4], { stdio: "inherit" });
  console.log("saved", mp4);
}
