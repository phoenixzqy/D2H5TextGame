# BUG-732 — Restore Frost Aura to the Duriel chapter encounter

- Severity: Medium; the playable chapter encounter loses its cold party pressure.
- Status: Fixed in working tree based on `b5a0898`; focused verification passed.
- Owner: root acting as content-designer/qa-engineer; no delegation.
- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, baseline runtime tree
  `441be64f42573072076f7acb4ba5929c22609d80f0da407a893e67835aadb8e1`.
- Environment: Vitest 1.6.1, WSL/Node, native production data and wave builder;
  browser viewport/locale do not apply to the engine reproduction.
- Seed: 13; Normal Tomb challenge ordinal 450, manual and idle.

## Reproduction

1. Run `./node_modules/.bin/vitest run src/stores/combatHelpers.duriel-aura.test.ts`.
2. Resolve the real Tomb chapter wave with `resolveChallengeWavePlan` and build
   its enemies with production `buildEnemiesForWave`.
3. Record combat against synthetic high-life hero, mercenary and summon targets.
4. Inspect Duriel's actions for `monster.frost_aura`.

Expected: Duriel retains Charge and casts his existing cold Frost Aura against
all three player roles, applying Chill and slowing their attack cadence. See
`docs/design/monster-spec.md` and `docs/design/monsters-act1-2-canon.md`.

Actual: both regression cases fail because no Frost Aura action exists. The
chapter override contains only `monster-charge`, replacing the native monster's
two-skill list. Native stats remain HP 25600, attack 220 and defense 280.

Evidence: retained packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-duriel-aura-t8fmqaqn`,
`regression-red.stdout.log` and `regression-red.stderr.log` (two genuine failures
at the missing-aura assertion, before the production correction).

## Root cause and correction scope

Append existing `monster-frost-aura` after Charge in the Tomb's authored
`chapterBoss.skills`. `src/stores/combatHelpers.ts` correctly treats chapter
skills as an override; changing that shared behavior would affect other bosses.
Preserve all stats, skill payloads, rewards and other encounters. This is a later
correction to the override deliberately preserved by
`docs/plans/decisions/P15-boss-signature-family-v1.md`.

This bug does not establish continuous-aura cadence acceptance or solve BUG-731's
wider earned-power/balance concern. Diagnostic targets are not earned campaign
characters, and these checks add no formal balance acceptance.

## Verification

[Duriel evidence](../../docs/plans/evidence/p15-duriel-chapter-frost-aura.md)
records 9 passing focused tests, scoped strict types/lint and four passing
desktop/mobile × zh-CN/en Chromium checks. Original failures remain retained.
Regression: `src/stores/combatHelpers.duriel-aura.test.ts`; no commit created
while the umbrella implementation remains unfinished.

## Superseded active cadence

BUG-734 implements the specified passive Aura, verified in
[its evidence](../../docs/plans/evidence/p15-duriel-passive-frost-aura.md).
The chapter/native lists now retain Charge only; separate metadata schedules
15cold/5s/2sChill. This replaces the active-skill restoration above without
rewriting its historical observations or claiming encounter balance.
