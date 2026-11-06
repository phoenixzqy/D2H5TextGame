# P16 — Blood Lord and Frozen Terror artwork registered

2026-11-05. Previous goal turn was a status report/no implementation progress.
This increment closes BUG780 locally; full private v1 remains unfinished.

## Result

Both canonical Act V identities now use locally stored, attributed official
Diablo II bestiary artwork through `src/data/image-overrides.json`. Blizzard's
Blood Lord page names that identity; the Frozen Horror page explicitly lists
Frozen Terror as a family variant. Each local PNG retains the original GIF's
default first frame, proportionally fitted onto a 256×256 canvas. The two files
total 54,263 bytes; the adjacent `SOURCE.md` records provenance, transformation,
source hashes and the existing public-release replacement requirement.

No AI image generation, generated manifest rewriting, monster proxy, resolver
logic, combat, reward, save or schema change occurs. The existing PNG precache
pattern includes these paths; a production offline reload is not exercised.

## Verification

One fresh constructed baseline mounts two native champion units on the actual
paused `CombatScreen`: both images resolve to null and four missing-key warnings
appear, without browser/network errors. No plan, combat admission, battle or
reward roll occurs. The defect is filed before production changes.

After registration:

- All nine existing helper/override unit cases pass in one focused launch.
  The old missing-art fixture is updated to actual absent identities, retaining
  five negative cases and the absent-canonical-identity override control.
- Explicit one-file test lint has zero warnings. Strict draft-2020-12 Ajv
  validates the actual override data; a separate readback confirms exactly two
  additions, unchanged other maps, existing local PNGs, 256×256 headers and
  per-file sizes below the prospective 40 KB bound.
- Four Chromium 147 cases cover en/zh-CN at360×640and1280×800 on the actual
  paused combat screen. Both native IDs resolve to the intended local images;
  decoded dimensions, visible cards/images, localized nonempty alt text,
  immunity lists and absence of horizontal overflow pass. There are zero
  browser errors/warnings, failed requests or bad HTTP responses. Root inspects
  both source PNGs plus final English mobile/desktop screenshots.

This is static artwork/configuration, so no new behavioral unit tests, broad
suites, engine checks, campaign reruns, build or CI run are added. There is no
source API/type change. The earlier champion-immunity packet keeps its original
`passed:false` result; this new art-only verification resolves its missing-art
cause without renewing that diagnostic's closed combat allowance.

## Review, evidence and cleanup

Security check passes: bounded HTTPS image downloads only, no executable remote
content or save-data export. Focused plan self-review is ready. Root reviews the
incremental preimage diff, source attribution and exact asset/mapping identity;
this is not independent art/QA approval or full-v1 acceptance.

Root retains preimages, downloaded GIFs, conversion record, output hashes,
baseline/final browser results and screenshots, focused unit/lint/schema evidence,
review and cleanup receipts in:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-act5-art-ps4qdjjb`.
Root removes that packet after full-v1 acceptance and all consumers finish.
All command handles are terminal and task Vite/Vitest caches are removed;
`cleanup.json` records PID/port/cache absence. The finite budget closes after two
source-image downloads, one conversion, one baseline page, four final pages and
one affected-unit launch; the unused correction allowance closes unused.

Historical14/14intended Normal completions,210source contexts and formal0/210
balance acceptance remain unchanged. Remaining gameplay/content, progression/
challenge/acquisition/economy,30–50active-hour pacing, difficulty/endgame,
integrated mobile/PWA/a11y/performance/soak, independent review and later owner
playtest remain open. Browser works; CI excluded; no user answer is pending.
