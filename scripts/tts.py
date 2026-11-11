"""Voice-over clips for the demo video (called by scripts/dub-demo.mjs voice).

Usage: python scripts/tts.py <scenes.json> <out_dir> <voice> [english_voice ffmpeg]
Writes <out_dir>/<id>.mp3 for each scene and <out_dir>/durations.json (spoken seconds).
Text is read from a UTF-8 file because Vietnamese text does not survive the Windows command line.

With english_voice and ffmpeg given, parts written as [[English words]] are spoken by the English voice
and spliced into the main voice, so names and terms keep a native accent.
"""
import asyncio
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

import edge_tts

RATE = "+4%"


async def synth_once(text: str, voice: str, out: Path) -> float:
    end = 0.0
    with out.open("wb") as f:
        async for chunk in edge_tts.Communicate(text, voice, rate=RATE).stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] in ("WordBoundary", "SentenceBoundary"):
                end = max(end, (chunk["offset"] + chunk["duration"]) / 10_000_000)
    return round(end, 2)


async def synth(text: str, voice: str, out: Path) -> float:
    # The speech service throttles bursts and then returns nothing: pace requests and back off before retrying.
    await asyncio.sleep(3)
    for attempt in range(8):
        try:
            return await synth_once(text, voice, out)
        except edge_tts.exceptions.NoAudioReceived:
            await asyncio.sleep(10 + attempt * 10)
    return await synth_once(text, voice, out)


async def synth_cached(text: str, voice: str, cache: Path) -> Path:
    """One spoken piece, cached by voice + text so a rerun only asks the service for what is missing."""
    cache.mkdir(parents=True, exist_ok=True)
    f = cache / (hashlib.sha1(f"{voice}|{RATE}|{text}".encode()).hexdigest()[:16] + ".mp3")
    if not f.exists() or f.stat().st_size == 0:
        tmp = f.with_suffix(".part")
        await synth(text, voice, tmp)
        tmp.replace(f)
    return f


def media_seconds(ffmpeg: str, path: Path) -> float:
    info = subprocess.run([ffmpeg, "-hide_banner", "-i", str(path)], capture_output=True, text=True).stderr
    h, m, s = re.search(r"Duration: (\d+):(\d+):([\d.]+)", info).groups()
    return round(int(h) * 3600 + int(m) * 60 + float(s), 2)


async def synth_mixed(text: str, voice: str, en_voice: str, ffmpeg: str, out: Path) -> float:
    """Main voice for plain text, English voice for [[...]] parts, joined with edge silences trimmed."""
    parts = [(p[2:-2], en_voice) if p.startswith("[[") else (p, voice)
             for p in re.split(r"(\[\[.+?\]\])", text) if p.strip(" ,.")]
    if len(parts) == 1 and parts[0][1] == voice:
        return await synth(text, voice, out)
    short = [p for p, v in parts if v == voice and len(p.strip(" ,.–").split()) < 2]
    if short:
        # The service returns no audio for a one-word Vietnamese piece: reword the narration instead.
        raise ValueError(f"Vietnamese piece too short between English words: {short!r} in {text!r}")
    files = [await synth_cached(chunk.strip(" ,.–"), v, out.parent / "_parts") for chunk, v in parts]
    # Trim leading/trailing silence of each piece (keep ~60 ms) so the splice flows like one sentence.
    trim = "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.06,areverse," \
           "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.06,areverse"
    inputs = sum((["-i", str(f)] for f in files), [])
    graph = ";".join(f"[{i}:a]aresample=24000,{trim}[p{i}]" for i in range(len(files)))
    graph += ";" + "".join(f"[p{i}]" for i in range(len(files))) + f"concat=n={len(files)}:v=0:a=1[a]"
    subprocess.run([ffmpeg, "-hide_banner", "-loglevel", "error", "-y", *inputs, "-filter_complex", graph,
                    "-map", "[a]", "-c:a", "libmp3lame", "-b:a", "96k", str(out)], check=True)
    return media_seconds(ffmpeg, out)


async def main() -> None:
    scenes = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    out_dir = Path(sys.argv[2])
    voice = sys.argv[3]
    en_voice = sys.argv[4] if len(sys.argv) > 5 else None
    ffmpeg = sys.argv[5] if len(sys.argv) > 5 else None
    out_dir.mkdir(parents=True, exist_ok=True)
    durations = {}
    for scene_id, text in scenes.items():
        out = out_dir / f"{scene_id}.mp3"
        if en_voice and "[[" in text:
            durations[scene_id] = await synth_mixed(text, voice, en_voice, ffmpeg, out)
        else:
            durations[scene_id] = await synth(text.replace("[[", "").replace("]]", ""), voice, out)
        print(f"{scene_id:<14} {durations[scene_id]} s", flush=True)
    (out_dir / "durations.json").write_text(json.dumps(durations, indent=2), encoding="utf-8")
    print(f"total {sum(durations.values()):.1f} s")


asyncio.run(main())
