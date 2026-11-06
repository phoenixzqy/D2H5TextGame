# BUG-756 — Summon Baal’s five ordinary tentacles

Status: Fixed locally; not committed or independently accepted. Severity: High (missing boss
mechanic; no player workaround). Date:2026-11-05. Owner:root, solo.
Build:b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus inherited local changes.
Systems:monster content/schema/engine registry/native chapter/playback.
Environment:WSL/Node deterministic combat, locale/viewport independent. Seed13.

## Reproduction

1. Build native level82 Baal with monster-tentacles as its active action.
2. Record combat against a durable stationary player.
3. Inspect the first Tentacles action and enemy bodies.

Expected: monster-spec§8 summons five separate ordinary trash units.
Actual: aliases.ts installs an all-enemy physical damage30–50 stub, cooldown3;
there is no summoned body. Authored JSON instead describes physical/poison
damage and cooldown4, also contradicting the summon design. Three checks fail.
Evidence:/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-baal-tentacles-65qw1peq/red-native.log.
Regression:src/engine/combat/baal-tentacles.test.ts.

## Bounded implementation default

Five living per Baal, cast batch5 clipped to missing capacity; retain authored
4s cooldown. No startup summon or death refund. New dedicated ordinary melee
archetype copies existing ActV Barbarian Savage Life/growth, attack/growth,
AS100, defense40 and physical25 resistance; cannot roll elite/boss. This is a
provisional trash baseline because the design gives no tentacle stat table, not
a balance sign-off. Spawn at owner level; no map-population additions. Existing
summon identity/scheduling/target/death/playback and reward exclusion are reused.
Boss stats/rewards/waves and other skills remain unchanged.

## Local verification

All33focused cases in five affected Baal files pass: native summon/identity/grid/
independent actions, per-owner living cap, dead-body replacement, owner-death
cascade, strict authored resolver rejection, manual/idle chapter playback and
retained signatures/enrage. Strict scoped TypeScript604files/zero diagnostics;
changed-file ESLint passes after joining two test declarations (format only).
Strict Ajv passes50monster skills,11ActV archetypes and delivery. Existing rows
are unchanged except Tentacles; chapter base stats/rewards/enrage/waves preserved.

Actual Chromium diagnostic uses native chapter events, real playback, GameCard
and CombatLog: five separately named bodies and actual landed body damage;
en/zh-CN360×640 plus zh-CN1280×800, no overflow/console/page/request failures.
This component diagnostic is synthetic, not a full earned campaign or balance
acceptance. Root self-review only. Original RED/intermediate failures retained.
Exact evidence packet above is retained by root through full-v1 acceptance, then
root removes it. Exact owned server156655/browser/cache/pointer are absent.
