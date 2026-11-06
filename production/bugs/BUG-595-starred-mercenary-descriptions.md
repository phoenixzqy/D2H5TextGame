# BUG-595 — Distinguish base mercenary descriptions from star potency

Status: fixed locally, uncommitted; independent review pending. Severity: Medium.
Owner: root / frontend-dev. Affected systems: mercenary roster, zh-CN/en copy.

## Reproduction

Source authority36, tree `85a1c213214a0da9c7f687f8182a17b86c6ee918a4a105cb5a58b1095768ba9e`.
Chromium147, 1280×800/en and 360×640/zh-CN. No combat RNG is involved.

1. Import the authentic earned paid-recruitment preparation through Settings.
2. Open Mercs and upgrade the owned Pickpocket using100 earned duplicate shards.
3. Inspect the description and star panel.

Expected: identify static ability descriptions as base values and show the
current authored signature bonus, so a player can distinguish it from secondary
skills and fixed limits. Actual: rank2 is visible, but the unlabeled description
says Pilfer gives30 points; the real upgraded primary effect gives33.6 points.
The star panel explains natural-stat growth but omits signature potency.

Evidence: ongoing packet `bug594-browser-stars-reveal-v2-stars-desktop-en.png`
and `bug594-browser-stars-reveal-v2.json`. All payment/save/browser assertions
pass; screenshot review identifies this copy gap separately.

Root cause: static `byId.*.lore` mixes flavor and base ability values, while
the new star panel displays only rank. Label those descriptions and expose the
authored rank bonus at the shared roster panel, rather than rewriting25 static
descriptions with duplicated combat formulas. Costs, fixed effects, secondary
skills and engine behavior stay authored. Workaround: derive12% per earned rank
from the recruitment design. No user action or external blocker is required.

Security check: pass; first-party local presentation only, no network export,
dependencies, permission changes, commits or publication.

## Local verification

Existing bilingual star-upgrade tests reproduce the missing12% display
(0pass/2fail), then both pass with the shared display fix. The final10-case
run also verifies the signature fixture. Real Chromium desktop/en and mobile/zh
read the base label and live12% bonus and upgrade through the keyboard; added
layout checks cover1920×1080,412×915 and landscape640×360. No page/console
errors or horizontal overflow; controls remain48px high. Evidence:
`bug595-copy-{red,green}-v1.json`, `bug595-browser-star-copy-v1.json` and
screenshots in the continuing packet. Source authority37; no commit is made.
