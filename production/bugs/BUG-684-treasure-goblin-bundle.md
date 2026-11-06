# BUG-684 — Separate goblin equipment and material rewards

- **Status:** Resolved locally; uncommitted on the recorded build plus preserved changes.
- **Severity:** High; treasure encounters miss their documented reward bundle and later levels refuse rewards.
- **Owner / affected systems:** Root / loot engine, material economy/schema, native reward settlement.
- **Build:** `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus preserved local first-kill work.
- **Environment:** WSL, deterministic Node reward path; browser/viewport/locale independent.
- **Seed:**7; Act I–V levels4/20/34/47/78 plus Nightmare20/Hell44 offsets.

## Reproduction

1. Run `node_modules/.bin/vitest run src/engine/loot/treasure-goblin.test.ts --reporter=basic`.
2. Roll the real `loot/treasure-goblin` table with tier `boss` for each act/difficulty.
3. Check equipment count, additional rare+, material quantities/identities and live ilvl.

Expected: drop-tables §4.9 requires five equipment picks, the additional rare+
already implemented under D09, independent1–4runes from the next act's pool
(Act V capped to V), and5–10gems, subject to current D10 identity caps.

Actual: all15cases fail before implementation. Mixed currency/rune/gem rows
consume the equipment slots, independent fallback drops at most one rune/gem,
and Hell Act V level122 throws `No materializable guaranteed equipment` because
every goblin equipment row ends at99. Required original evidence:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p17-treasure-goblin-v1/original-failure.log`.

Root cause: a single mixed treasure class represents both ordinary equipment and
independent rewards. No live goblin bundle policy exists; its historical finite
equipment envelope also misses the supported campaign/replay maximum.
Fix at reward preparation using a schema-validated live goblin policy; do not
inflate generic boss drops, change raw cache contents, or fall back on refusal.
Existing wishstone §9 policy and rune-shard replacement for gold remain controlling.

## Native binding reproduction

The focused binding reproduction (seed7, manual/idle, ordinals0/9/12) also
fails in all three actual treasure areas: Cold Plains clones its single authored
goblin into11 enemies at ordinal0; Lost City and City of the Damned clone it
into13. All receive the same goblin table. Authored non-challenge plans use
`elite`, so a boss-only reward gate misses them as well. Six engine cases fail
before correction; the native Cold Plains test also asserts the single spawn.
See packet `native-binding-red.log`.

maps-spec §6 requires one goblin. Retain the authored treasure roster rather
than applying the ordinary challenge-count fitting to it. Existing wave levels,
elite promotion/affix draws and the ordinary8–20 roster remain authoritative.
Reward table identity supplies boss-tier loot weights/material context, not a
combat-tier mutation. Quest caches still bypass live reward generation.

## Expanded verification findings

`boundaries-planner.log` retains9failures/143passes. Five planner assertions
still require an ordinary8–20 roster for the treasure wave (including12Fallen
at ordinal40), contradicting maps-spec §6 and the original single-spawn source.
Replace only those treasure assertions with exact one-spawn/source/level/affix
checks; keep ordinary `expectCore`, pity, metadata and RNG assertions intact.
Four new gem endpoint oracles incorrectly expect flawed gems in every act:
boss weights are [0,0,20,65,15], so the minimum is normal except where Act I's
cap folds it to flawed. Correct the oracle against authored D10 weights.

`missing-source-red.log` additionally reproduces a real missing-source defect:
removing the configured goblin table returns baseline currency instead of
refusing its complete bag. Reject that configured missing source before RNG
draws; retain generic unknown-table fallback. Add native preparation refusal
coverage before XP/inventory publication. These are constructed checks without
earned campaign or balance credit.

## Resolution and verification

The configured table now projects five equipment-only picks at boss loot
weights and the existing rare+ guarantee, with independent1–4next-act runes
and5–10actual-act gems. Only the terminal band extends to122. Treasure fitting
retains its authored roster; missing configured source refuses before any draw.
Native actual-wave delivery, preparation refusal before XP/inventory, and full
publication restoration pass.

[Evidence](../../docs/plans/evidence/p17-treasure-goblin.md) records original
failures,35final goblin cases,164affected loot passes and237final selected passes
(overlapping). Scoped strict types/explicit lint and isolated production,
offline precache and13-JS bridge scans pass. Ten source and766build hashes
verified; exact disposable build/config removed and absence verified. Regression
paths: `src/engine/loot/treasure-goblin.test.ts`,
`src/engine/combat/sub-area-run.test.ts`,
`src/stores/combatHelpers.settlement.test.ts`. No earned/balance acceptance.
