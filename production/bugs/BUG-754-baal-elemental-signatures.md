# BUG-754 — Restore Baal’s three elemental chapter attacks

Status: Fixed locally; not committed or independently accepted. Severity: High (missing boss attacks; no player workaround).
Date: 2026-11-05. Owner: root, solo. Systems: content/schema, engine registry, native chapter.
Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus inherited local changes.
Environment: WSL/Node deterministic engine; browser/viewport/locale independent.
Seed13, challengeOrdinal450. Synthetic durable controls are not earned campaign evidence.

## Reproduction

1. Resolve the real manual/idle Throne of Destruction chapter plan.
2. Build Baal with buildEnemiesForWave; record actions against a durable party.
3. Inspect his elemental actions and landed statuses.

Expected: monster-spec §8: all-target Frost Nova with one-turn Freeze; cone-five
Inferno with five Burn stacks and Armor Melt; all-target Mana Rift with Mana Burn.
Actual: chapter override selects Tentacles alone; other opportunities use basic
attacks. Both manual/idle action-sequence tests fail before production edits.
Restoring generic spell IDs alone would still apply Chill/one Burn stack and
omit Armor Melt. Short priority cooldowns can also starve later actions.

Evidence: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-baal-signature-l9qjl80k/red-native.log.
Regression: src/stores/combatHelpers.baal-signature.test.ts and
src/engine/combat/baal-signatures.test.ts.
Tentacle summons, Baal status immunity/enrage and full-v1 acceptance remain open.

## Local resolution

Baal-only JSON variants and immutable registry payloads restore all three spells
in the native manual/idle chapter. Shared spells, chapter stats/rewards and
pre-Baal waves are preserved. Variant descriptions now match the effects in both
locales. Build remains the SHA above plus local changes.

30 distinct selected cases pass (12 resolver, 10 engine, 2 native, 6 affected);
strict scoped types: 603 implementation/data files, zero diagnostics. Changed-file
lint passes after removing a statically redundant test guard. Final direct schema/
bilingual/source comparison passes. Actual CombatLog Chromium diagnostic passes
EN/ZH at360x640 and ZH at1280x800 without overflow/page/console/network failures.
This synthetic evidence is not an earned campaign or balance acceptance.

See docs/plans/evidence/p15-baal-elemental-signatures.md. Root retains the exact
evidence packet through full-v1 acceptance and owns eventual removal. Task server
PID150789 and exact Vite cache are absent; no spent run allowance renewed.
