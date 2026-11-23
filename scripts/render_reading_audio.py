"""Render a clean bilingual IELTS track from its published Hugo HTML."""
import argparse
import hashlib
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import wave

from bs4 import BeautifulSoup
import numpy as np
import sherpa_onnx as sherpa


def reading_script(html):
    soup = BeautifulSoup(html, "html.parser")
    original = soup.select_one(".post-content .ielts-source-text")
    if original is None:
        return []
    intro = soup.select_one(".post-content #introduction")
    paragraphs = []
    if intro:
        for node in intro.find_next_siblings():
            if node.name in ("h1", "h2"):
                break
            if node.name == "p":
                paragraphs.append(node)
    paragraphs.extend(original.select("p"))
    return [re.sub(r"\s+", " ", p.get_text()).strip() for p in paragraphs
            if p.get_text(strip=True)]


def render(paragraphs, model, output):
    kokoro = sherpa.OfflineTtsKokoroModelConfig(
        model=str(model / "model.onnx"), voices=str(model / "voices.bin"),
        tokens=str(model / "tokens.txt"), data_dir=str(model / "espeak-ng-data"),
        lexicon=",".join(str(model / name) for name in ("lexicon-zh.txt", "lexicon-us-en.txt")),
        dict_dir=str(model / "dict"),
    )
    engine = sherpa.OfflineTts(sherpa.OfflineTtsConfig(
        model=sherpa.OfflineTtsModelConfig(kokoro=kokoro, num_threads=2)))
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / "reading.wav"
        with wave.open(str(wav), "wb") as stream:
            stream.setparams((1, 2, engine.sample_rate, 0, "NONE", ""))
            for text in paragraphs:
                audio = engine.generate(text, sid=58, speed=1.0)  # zm_009
                if not len(audio.samples):
                    raise ValueError("Empty audio paragraph")
                pcm = (np.clip(audio.samples, -1, 1) * 32767).astype("<i2")
                stream.writeframes(pcm.tobytes())
                stream.writeframes(bytes(2 * engine.sample_rate // 3))
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-b:a", "64k", str(output)], check=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("public", type=Path)
    parser.add_argument("model", type=Path)
    parser.add_argument("cache", type=Path)
    args = parser.parse_args()
    args.cache.mkdir(parents=True, exist_ok=True)
    pages = (args.public / "posts/ielts-reading").glob("????-??-??/index.html")
    for page in sorted(pages):
        if page.parent.name < "2026-11-18":  # First issue with recorded audio
            continue
        html = page.read_text()
        paragraphs = reading_script(html)
        if not paragraphs:
            continue
        key = hashlib.sha256(Path(__file__).read_bytes() + "\n".join(paragraphs).encode()).hexdigest()[:16]
        filename = f"reading-{key}.mp3"
        cached = args.cache / filename
        if not cached.exists():
            render(paragraphs, args.model, cached.with_suffix(".tmp.mp3"))
            cached.with_suffix(".tmp.mp3").replace(cached)
        shutil.copyfile(cached, page.parent / filename)
        html, count = re.subn(r'(<button\b[^>]*?\bid=(?:"page-reader"|page-reader)(?=[\s>]))',
                              rf'\1 data-audio="{filename}"', html, count=1)
        if not count:
            raise ValueError(f"Missing player in {page}")
        page.write_text(html)
        print(f"Audio ready for {page.parent.name}: {filename}")


if __name__ == "__main__":
    main()
