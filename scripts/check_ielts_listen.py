#!/usr/bin/env python3
"""Ensure the pilot is derived from the real article and remains out of article listings."""
from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
article = (root / "content/posts/ielts-reading/2026-11-02.md").read_text()
layout = (root / "layouts/_default/listen.html").read_text()
pilot = (root / "content/listen/2026-11-02.md").read_text()
script = (root / "static/js/ielts-listen.js").read_text()
single = (root / "layouts/_default/single.html").read_text()

assert len(re.findall(r"<p(?:\s[^>]*)?>", article.split('<section class="ielts-source-text"', 1)[1])) >= 20
assert '{{ $source.Content }}' in layout, "pilot must reuse, not copy, the canonical text"
assert ".ielts-source-text" in script
assert "SpeechSynthesisUtterance" in script
assert 'list: never' in pilot
assert '2026-11-02/listen/' in pilot
assert '2026-11-02/listen/' in single
assert "Reprinted with permission of MIT News" in layout
print("IELTS listening pilot source contract passed")
