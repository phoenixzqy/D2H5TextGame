# BUG-764 — Use native JSON-backed monster direct actions

- Status: Fixed and verified locally; uncommitted.
- Severity: Medium — three enabled monster actions still use hardcoded compatibility payloads; the published catalog conflicts with the adopted tuning for two of them.
- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited local changes, `feat/playable-foundations`.
- Environment: Node/Vitest pure engine, no browser/locale dependency; native functional control seed13/factory7.
- Owner: root working solo; engine/data authority.
- Requirements: G2/F02/F03, JSON-owned game tuning, zero enabled stubs. `docs/plans/decisions/P15-monster-signature-batch-v1.md` retains Bone Spirit40–60/CD2; `P15-boss-signature-family-v1.md` retains Whirlwind40–60/CD3 independently of the catalog discrepancy.

## Reproduction

1. Load the production skill registry and monster JSON catalog.
2. Resolve `monster-frost-bolt`, `monster-bone-spirit` and `monster-whirlwind` through both aliases.
3. Inspect native archetype/source and compare the two adopted tuning decisions with their JSON rows.

Expected: native monster actions derive their payloads from validated JSON; source data agrees with approved tuning. Preserve Frost Bolt25–40/CD2/Chill/500ms flight, Bone Spirit40–60/CD2/500ms flight, Whirlwind40–60/CD3/all-enemies, native delivery and all existing combat outcomes.

Actual: all three registry objects come from the compatibility factory and declare mercenary archetype. Hardcoded Bone Spirit40–60/CD2 and Whirlwind40–60/CD3 disagree with catalog50–80/CD3 and50–80/CD4. The current runtime values are intentional accepted decisions, not newly diagnosed damage/cooldown defects.

## Evidence and repair boundary

All five causal assertions in `src/engine/skills/monster-direct.test.ts` fail before repair. Exact packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-native-direct-monsters-4rf_g8g8`; `red.json`/`.log`, source preimages and native parity script retained by root through full-v1 acceptance.

Align only those two JSON rows with already-adopted tuning, add free costs explicitly, close the three schema shapes and install immutable native direct actions. Remove their compatibility entries. No new damage tuning, curve/scaling, combo behavior, target rules, status rules, chapter data, saves, loot, UI, CI or campaign allowance.

## Local verification

Native `monster-direct.ts` validates, copies and freezes all three actions; registry installs them and their compatibility entries are removed. JSON now contains the adopted runtime tuning and explicit free costs. Exactly three closed schema rules reject unsupported carriers and metadata. No other game-data row changes; shared combat/status are byte-identical to retained preimages.

Five causal RED assertions become GREEN. Final affected checks:65 direct-skill assertions plus26 selected native consumer assertions pass (91distinct);124 unrelated assertions filtered, not counted as passes. Strict scoped451files/zero diagnostics, four-file lint and strict Ajv validation of all monster-skill rows pass. Native Horror Mage, Oblivion Knight and Ancient Barbarian full snapshots/results/events match before/after exactly; plain/recorded/replay/input-immutability controls pass. See packet `verification.json`, `native-parity-result.json`, `final-increment.diff` and `source-review.json`.

The first edit script stopped before schema/data writes because an anchor also matched nested schema blocks. An intermediate test run therefore failed during suite loading; `green-initial.json`/`.log` remain as failed evidence. The corrected top-level anchor and full source/data/schema alignment pass all final checks. All task handles terminal; no server/browser/build/cache/disposable output created. Root retains the named evidence packet through full-v1 acceptance and owns eventual cleanup. No campaign or exhausted sample/retry renewal; no balance/pacing/full-v1 acceptance claim.
