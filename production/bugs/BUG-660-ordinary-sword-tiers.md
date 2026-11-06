# BUG-660 — Restore ordinary War Sword and Legend Sword drops

- **Status:** Locally fixed and verified — retained uncommitted source; no commit requested.
- **Severity:** Medium; special goblin drops are an existing workaround.
- **Owner:** Root; content/game design.
- **Affected systems:** Ordinary loot, one-handed sword progression, Sword Mastery builds.

## Reproduction

Build `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained uncommitted
production tree `1566ace2ed41d60cabeeb224cf43aefad255f45f21d9e43b6ae06e3367a65e7d`.
WSL/Linux, native JSON inspection; no browser, viewport, locale or RNG involved.

1. Read the locked six-tier sword ladder in `docs/design/items-spec.md` §3.8.
2. Resolve `items/base/wp1h-war-sword` (level32) and `wp1h-legend-sword` (level60).
3. Inspect every `entries` array in `src/data/loot/treasure-classes.json`.
4. Both bases occur only in `loot/treasure-goblin`; no ordinary campaign source
   offers either. Adjacent level22/50 swords have ordinary picks.

Expected: the existing six-tier ladder offers attainable ordinary upgrades
through its finite source envelopes, alongside the authored ranged/throwing ladders.
Actual: exceptional32 and elite60 sword tiers depend on a special goblin event.
No missing base, schema, localization or native equip implementation is involved.

Evidence: exact before bytes retained under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p15-sword-progression-v1-preimages/`.
Decision: `docs/plans/decisions/P15-ordinary-sword-tiers-v1.md`.
This omission does not explain why BUG659 rejected already-owned better weapons;
fixing availability alone grants no late-act viability or pacing acceptance.

## Local fix and verification — 2026-11-03

Appended34 picks in24 ordinary weapon-bearing tables using the existing War
Sword32 and Legend Sword60 bases and their declared source intersections. All38
tables equal the exact preimage plus that independent delta; old fields/order/
weights/bounds, goblin and fixed reward content are preserved. No stat/schema/
save/locale change. Weights remain provisional economy tuning.

Focused checks:49 loot cases (original49 RED failures retained), two native
equipment cases and one exact predecessor comparison pass. Scoped strict types
and explicit unignored zero-warning lint pass. Four Chromium cases pass:
en/zh-CN ×1280×800 desktop/360×640 mobile; localized picker/details, loaded sword
art, native equip, exact62 Attack delta, displaced-item/shield custody, explicit
save and reload, zero page/console errors or warnings and no horizontal overflow.
All eight captures inspected; mobile content uses the existing modal scroll area.
The level60 fixture is constructed, not earned acquisition or balance evidence.

Regression paths: `src/engine/loot/sword-progression.test.ts`,
`src/stores/sword-progression.test.ts`, `tests/e2e/sword-progression.spec.ts` and
`src/engine/loot/hell-data-preservation.test.ts` (exact-delta case only).
Evidence: retained root packet, `p15-sword-progression-v1/closure.json`,
`green.json`, screenshots, type/lint logs and `independent-preservation.json`;
original unit logs use root prefix `p15-sword-progression-v1-`.
Recorded browser processes are absent; server closed; exact owned config/cache
removed and absence verified. Extraction corrected to decode embedded screenshot
bodies without rerunning browser tests or installing tools.

BUG659 and all closed attempts remain unchanged. Root self-review is not final
independent acceptance. No agents/install/CI/commit/push/publication.
