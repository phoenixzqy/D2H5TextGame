# P15 — Bounded native checkpoint measurement

2026-11-04. The v3 descriptor, native checkpoint adapter and explicit CLI are
implemented. They measure one selected area attempt from exact saved state,
preserving nonwins, actual rewards and partial wave journals. This provides
measurement plumbing; **14/14 intended Normal completions and formal balance
0/210 remain unchanged**. No production game source changed for this slice.

## Interface and boundaries

`tests/sim/production/checkpoint-fixture.ts` validates a closed v3 descriptor:
checkpoint kind (`retained-earned` or `constructed-control`), exact raw-save
SHA256 and acquisition evidence, intended build/class/exact level, canonical
area/act, difficulty, manual/idle, ordinal, idle pity, sample partition/seed and
clock. Unknown fields/IDs and seeds outside benchmark 1, screening 1–100,
tuning 1–1,000 or holdout 10,001–11,000 are rejected. An evidence string/hash
does not independently certify earned acquisition or intended build identity.

`runCheckpointAttempt(fixtureInput, sourceJsonBytes, onWave?)` rejects an active
caller, verifies raw bytes before fatal UTF-8/JSON decoding with production
`decodeSave`, requires matching class/level/difficulty and a nonretrograde clock,
then checks exact saved-domain hydration. Act unlock and idle clear eligibility
use saved production state. It travels to the declared canonical location and
uses `startEarnedRun`/`playEarnedWave`; it stops at the first native terminal.
Unreached waves are explicit. It changes no gear, points, priorities or resources.

Caller stores/hydration, clock, elite pity and Iron Golem selection are restored
on success and error. Callback observations are detached. Original/cleanup
errors remain together. Production's process-global item/run IDs stay monotonic;
this is intended for a dedicated quiescent diagnostic realm. Its exported save
is a diagnostic observation, never a new earned campaign successor.

Waves include actual enemy identities/levels/tiers, engine input, events,
outcome, damage/resource/duration metrics and reward deltas. RNG streams are
recorded: plan = runSeed; enemy/battle =
`(runSeed ^ ((waveIndex + 1) * 0x9e3779b1)) >>> 0`; reward =
`(runSeed ^ 0x9e3779b1 ^ waveIndex) >>> 0`; Find Item =
`(runSeed ^ 0x46494e44 ^ waveIndex) >>> 0`. Manual/idle tests use the same source.

## Explicit command

```sh
npm run sim:checkpoint -- \
  --fixture /absolute/fixture.json \
  --save /absolute/save.json \
  --output /absolute/new-report.json
```

There is no default sample, batch or retry. Output must be a new absolute leaf
outside the repository with an existing real parent. The command loads TS via
Vite's SSR module loader without project Vite config, watchers or HMR, using a
task-isolated cache. It captures the shared source/data manifest before gameplay
import, supplements it with the otherwise-excluded diagnostic contract files,
and rejects before/after source drift. An exclusive, fsynced `.journal.jsonl`
records preparation, every settled wave and native terminal before final report.
Reports use observation encoding v1, retain errors and report actual cleanup.

## Bounded verification

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-checkpoint-balance-l9jm0h4c`.
Root retains it through umbrella acceptance and owns eventual exact cleanup.

`control-plan.json` prospectively permits five constructed native attempts,
at most 15 settled waves, 45 process seconds and 16 MiB. Sources are fresh L1
Sorceress/Barbarian, with an explicitly artificial Blood Moor clear for idle.
No retained earned input is loaded. Actual: five starts, four returned attempts,
one injected consumer error and six settled waves. All nonwins remain.

| Control | Settled / planned waves | Outcomes | Combat ms |
| --- | --- | --- | --- |
| Sorceress manual | 1 / 3 | defeat | 13,920 |
| Sorceress idle | 1 / 3 | defeat | 5,220 |
| Barbarian manual | 2 / 3 | victory, defeat | 23,300 |
| Barbarian idle | 1 / 3 | defeat | 6,960 |
| Injected callback failure | 1 / 3 | defeat retained before throw | 13,920 |

The two explicit diagnostic files pass **28 tests** (23 descriptor, five adapter),
7.02 seconds including compilation, 648 ms in tests. Tests cover invalid source/
context, malformed save/idle clear, active caller, detached observations and
success/error restoration with nondefault pity/selection. Scoped strict types
and four-file lint pass (`typecheck-final.log`, `lint-final.log`); launcher syntax
passes `node --check`. Earlier setup/type failures remain in their original logs.

`command-plan.json` separately permits one additional constructed CLI attempt,
at most three waves/45 seconds/16 MiB. It settles the same Sorceress defeat in
13,920 combat ms, leaving two waves unreached; 0.109532 native seconds and
6.804399 total seconds. Separate retained-output readback proves identical
starting state, engine input, outcome and metrics to the prior control; actual
source/contract manifests stay stable and raw source bytes match SHA256.
An existing-output negative invocation exits before gameplay/journal creation.
The positive executed launcher is archived as `command-launcher.executed-v1.mjs`;
the final launcher differs only in the failure-message wording exercised by the
negative invocation.

BUG728 corrects the local cleanup reader: its original regex matched printed
source, not the actual error's cache path. `command-readback-v2.json` supersedes
the retained flawed V1 and validates both actual absolute task-owned paths.
The first V2 draft's outcome-shape assertion/failure is also preserved. No new
gameplay was used to correct either reader. Successful V2 reader SHA256:
`c83951416d37103ce04965fa18fc33fe69c9969c12f52ee025b695f22e215eb5`.

Native CLI PID 4182680 and exact caches `d2-checkpoint-measure-ga6IVl` and
`d2-checkpoint-measure-JETfTz` are absent. No compiler consumer remains;
`tsconfig.active.json` is archived as `tsconfig.executed.json`. Python cache is
absent. `cleanup-readback.json` records no cleanup failures. Security check passes
for local diagnostics/evidence; no network, credentials, CI or permission change.

## Remaining acceptance

These are constructed adapter controls, not frozen earned build/act fixtures,
210 encounter populations, campaign rates, loot distributions, balance signoff,
player hours or independent final QA. Actual encountered tiers are recorded;
an area containing a champion does not imply a separately sampled elite cell.
The subsequent [source reuse inventory](p15-checkpoint-source-reuse.md) qualifies
157 exact exports for all 70 build/act and 210 role candidates with the current
decoder. Next freeze their power/acquisition/adaptation, current contexts/carry
and manual/idle populations, then budget screening and disjoint holdouts. No
completed campaign replay, broad suite, build, new agent
or CI was needed. Wider economy/pacing/difficulty/endgame/app/soak acceptance and
full private v1 remain open; browser works and no user answer is pending.
