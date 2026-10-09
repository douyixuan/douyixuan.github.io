#!/usr/bin/env python3
"""Check the IELTS publication contract without external dependencies."""
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
errors = []
for path in sorted((root / 'content/posts/ielts-reading').glob('*.md')):
    if path.name == '_index.md':
        continue
    text = path.read_text()
    parts = text.split('---', 2)
    if len(parts) != 3:
        errors.append(f'{path.name}: missing front matter')
        continue
    front, body = parts[1:]
    for field in ('draft: false', 'ielts-reading', 'Daily IELTS Reading'):
        if field not in front:
            errors.append(f'{path.name}: missing {field}')
    if not re.search(r'_build:\s*\n\s+list: local', front):
        errors.append(f'{path.name}: must stay off homepage (list: local)')
    if not re.search(r'(?:\*\*Original article:\*\*|## Original article)[\s\S]*?https://[^\s]+', body):
        errors.append(f'{path.name}: missing original article URL')
    date = re.search(r'(?m)^date: (.+)$', front)
    if date:
        from datetime import datetime, timezone
        try:
            if datetime.fromisoformat(date[1]).astimezone(timezone.utc) > datetime.now(timezone.utc):
                errors.append(f'{path.name}: future date would be omitted by Hugo')
        except ValueError:
            errors.append(f'{path.name}: invalid publication date')
    sections = re.split(r'(?m)^\*\*\d+\.', body)[1:]
    if not sections:
        errors.append(f'{path.name}: missing numbered comprehension questions')
    for number, section in enumerate(sections, 1):
        answers = re.findall(r'{{< answer >}}(.*?){{< /answer >}}', section, re.S)
        if len(answers) != 1 or not answers[0].strip():
            errors.append(f'{path.name}: question {number} needs one nonempty answer shortcode')
if errors:
    raise SystemExit('\n'.join(errors))
print('IELTS publication contract passed')
