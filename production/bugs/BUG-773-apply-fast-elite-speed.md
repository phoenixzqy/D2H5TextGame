# BUG-773 — Apply Fast elite attack speed

Status: fixed locally and verified; uncommitted.
Severity: Medium — labeled elite modifier lacks its advertised speed effect;
combat is still playable and other affixes remain available.
Owner: root, acting as engine-dev/content-designer; solo per owner instruction.

## Reproduction

- Base HEAD: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, branch
  `feat/playable-foundations`, inherited dirty worktree, 2026-11-05.
- Environment: Linux/WSL, Vitest 1.6.1 UI/jsdom native store consumer;
  engine-only observation, browser/viewport/locale not causal. Both localized
  labels identify the same authored affix. Browser verification follows.
- Fixed construction and battle seed: 7.

1. Select the actual `elite-affix/fast` from `src/data/elite/elite-config.json`.
2. Pass a level-7 champion Fallen spawn with that affix to
   `buildEnemiesForWave`; compare the otherwise identical unaffixed spawn.
3. Execute each native unit in `runBattleRecorded` against the same inactive,
   durable constructed target and inspect its first three action timestamps.

Expected: monster-spec §9's +50% attack speed changes native 95 to142.5.
The existing scheduler floors speed at calculation, yielding1364ms cadence and
actions1364/2728/4092ms. Charge remains appended. Every other stat, identity,
RNG draw and input remains unchanged.

Actual: speed stays95; actions1740/3480/5220ms match the unaffixed control.
Two causal tests fail for those exact outcomes before runtime changes.

## Evidence and cause

Regression: `src/stores/combatHelpers.elite-speed.test.ts`.
RED log/report and source preimages:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-elite-fast-qe1q81mq`.
Root retains this packet through full-v1 acceptance, then removes it after all
consumers finish. This is a constructed mechanic reproduction, not earned
campaign, challenge-population or pacing evidence.

The affix shape/schema only permit identity/name/skill; wave construction passes
only the extra skill. Factory always uses the archetype speed. Charge adds damage
and no speed effect, so it cannot implement Fast's documented stat modifier.
No player workaround is necessary to continue play; affix challenge is weaker.

No campaign/screening/sample/retry allowance is renewed. Full-v1 remains open.

## Resolution

See [Fast elite evidence](../../docs/plans/evidence/p15-fast-elite-speed.md).
Affected checks, scoped types/lint and four native Chromium cases pass.
The initial100/101run and corrected one-case rerun remain separate evidence.
No campaign/balance/pacing credit or full-v1 completion is claimed.
