# BUG-676 — Show the hero's actual attack interval near the combat log

- **Status:** Fixed locally; scheduler-backed indicator and affected/browser checks pass. Full v1 acceptance remains open.
- **Severity:** Medium; combat works, but required timing feedback is absent.
- **Owner / affected systems:** Root / engine observations, native hero composition, combat UI.
- **Build:** `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained source.
- **Environment:** WSL; Chromium desktop/mobile, en/zh-CN; deterministic engine seed7.

## Reproduction

1. Start a character and enter combat.
2. Read the area around the combat log, including while a speed effect changes.

**Expected:** Idle spec §5.3 requires an attack-interval indicator and equipment
speed contribution. Actual current engine cadence must respect clamps and active
effects; future recorded changes must remain hidden until playback reaches them.

**Actual:** CombatScreen renders battlefield, idle panel and log without timing
feedback. The scheduler computes effective periods privately; UI cannot read them.

## Evidence and scope

`src/features/combat/CombatScreen.tsx` log mount and
`src/engine/combat/combat.ts` effectiveActionPeriod/scheduleNextAction.
Original snapshots/plan retained at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p17-attack-cadence-v1`.
Expose silent authoritative observations without changing combat timing, RNG,
resources, rewards or persisted saves. Show bilingual accessible wrapping text;
no new timer. Retained campaign budgets and acceptance remain untouched.

## Local resolution

See [attack-cadence evidence](../../docs/plans/evidence/p17-attack-cadence.md)
for source behavior, original failures, final219affected/4browser passes,
local review and verified task cleanup. No umbrella completion claim.
