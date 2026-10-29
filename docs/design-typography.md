# Typography and content hierarchy

Reference: https://anthonymorris.dev/second-brain. Adopt its restrained editorial scale and whitespace rather than copying its layout.

## Type tokens

| Element | Desktop | Mobile | Purpose |
| --- | --- | --- | --- |
| Site identity | 18px | 17px | Short label only |
| Navigation | 14px | 13px | Compact and horizontally scrollable on mobile |
| Article title | 32px | 28px | Primary heading; no duplicated date/series |
| Section title | 30px | 27px | Section landing pages |
| Article H2 / H3 | 22px / 18px | 21px / 18px | Reading hierarchy |
| Body | 16px | 16px | Consistent reading size, line height 1.75 |
| Index title | 19px | 18px | Listing rows |
| Summary | 14px | 14px | Supporting information |
| Meta / breadcrumbs | 13px | 13px | Date, reading time, author |
| Contents | 14px | 14px | Secondary navigation |

## Editorial rules

- One meaningful H1 per article. Make the title describe the topic rather than repeating a section name or date.
- Put date, reading time, author and series in navigation/meta, not in the visible H1.
- Existing Daily IELTS Reading titles retain their metadata and links; the shared display-title partial removes only the repetitive prefix at render time, including future posts using the same format.
- Use H2 for main article sections, H3 for their subdivisions. Avoid using a heading solely for visual emphasis.
- Keep the navigation label short; the full site title remains available to search engines and the browser.
- Design at 375px mobile width first. Do not shrink body text below 16px for long-form reading.
- CSS tokens and overrides live only in `assets/css/extended/theme.css` to prevent per-section drift.
