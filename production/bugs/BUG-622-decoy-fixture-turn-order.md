# BUG-622 — Preserve the decoy fixture's enemy-created first corpse

Status: Fixed in working tree (uncommitted; no fixed commit SHA). Severity: Low. Owner: root (campaign regression fixture).

## Verified resolution — 2026-11-03

Constructed enemies now have speed 200: their first action at 900 ms follows
paid Attract at 400 ms and Confuse at 800 ms, preceding the native hero's first
fallback at 1200 ms. Native hero projection, fixed seed 17171 and all original
assertions remain. Additional checks require both curse payments before the
first death and no earlier hero hit. Production combat is unchanged.

All four affected decoy cases and three early-signature cases pass, alongside
scoped strict TypeScript and explicit ESLint. Retained baseline and rejected
speed-125 evidence explain why this is a stale constructed-fixture correction.
See the [acquisition report](../../docs/balance/2026-11-03-intended-act1-acquisition.md)
and `p15-early-signatures-v3-{tests,types,lint}.{log,json}` in the packet below.

## Reproduction

Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`. Node/Vitest;
browser, viewport and locale do not apply. Fixed seed: 17171.

1. Run `tests/campaign/intended-growth.regression.test.ts`, selecting
   `creates its first corpse through an enemy attack`.
2. Repeat with the retained pre-BUG-621 test and growth JSON, loaded by the
   external `p15-decoy-baseline-v1.workspace.mjs` without changing repository bytes.

Expected: this constructed fixture tests paid target curses causing an enemy
to kill a comrade, then a paid Corpse Explosion consuming the resulting corpse.

Actual: both versions fail the unchanged enemy-source assertion. Native level-80
hero speed is 296: Attract at 400 ms, Confuse at 800 ms, basic attack at 1200 ms.
That 266-point attack kills the 120-Life bait before speed-40 enemies can act.

## Cause and evidence

The fixture assumed the older slow hero profile. Canonical staged Dexterity
growth now accelerates the hero; production target redirection is not implicated
by this failure. This predates the Fire/Barbarian policy edits.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/`.
Retain `p15-early-signatures-v1-green.log` and
`p15-decoy-baseline-v1.{workspace.mjs,log,json}`. The baseline trace records native
hero projection, paid curses and the actual killing hit; no gameplay acquisition
or balance claim follows from this supplied-XP, constructed-enemy fixture.

## Planned correction and verification

Set only constructed enemies' speed to 200 so their first action at 900 ms
falls after both paid curses and before the hero's first fallback. Preserve
native hero projection, seed and all existing assertions; explicitly check paid
curse ordering and no earlier hero hit. Run only the decoy cases and repaired
level-six cases, then scoped strict types and explicit lint.

The initial speed-125 candidate was rejected: the actual period formula is
`clamp(2500 - floor(speed) * 8, 400, 2000)`, giving 1500 ms, not the incorrectly
assumed 1000 ms. Its failed trace and exact candidate source remain in
`p15-decoy-candidate-v1.*` and `p15-decoy-speed125-rejected.test.ts`.
