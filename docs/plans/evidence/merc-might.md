# Native mercenary Might

Date: 2026-10-28 UTC. Base: `cfaa90251e4519ca3118cdef8b6ab509ccecc612`.
Scope: BUG-362, the recruitable `mercs/act2-might` signature aura.
Implementation: `b74c8f8f6acd5afd1cb5c6c6abdb23be9a7826c6`.
BUG-362 is fixed for the bounded native factory/combat defect.

## Repair

The [existing GDD](../../design/gacha-spec.md) specifies +30% party physical
damage. Previously `aura-might` resolved to an inert casted self-buff, and both
recruitment descriptions advertised 50%. The real mercenary factory regression
observed a fixed physical hit of 100 where the GDD requires 130.

Closed, validated skill JSON now authors 30 percentage points. An immutable
resolver converts this to an additive .30 fraction. The default registry uses a
passive with no cast effects. Fresh native mercenary projection supplies the
transient source marker only for the canonical identity, valid level and loadout.
Battle-local source IDs are checked for a living eligible player-side mercenary
on each direct physical hit. Living party members, the mercenary itself and
newly spawned summons receive the bonus. Multiple sources do not amplify it;
selected Paladin Might contributes separately to the same increased-damage sum.
Source death/removal withdraws the effect. The passive presence adds no action,
payment or RNG draw; existing scheduling/RNG algorithms and save format are
unchanged. Removing the old fake aura cast allows the active signature to act
instead, so the pre-repair action/RNG sequence is not preserved. Base stats,
other damage types and opponents receive no aura bonus. Both recruitment
locales now describe 30% and the living-source/summon scope.

## Regression evidence

The unchanged three-test primary regression uses the real loader, recruitment
factory, mercenary projection, default registry and bounded seed-7 combat. Before
the repair all three fail: hit 100, absent native source marker and false locale
potency. Afterward all three pass, including the exact hit of 130.

The new tests comprise 18 authored/schema checks, 30 combat checks and three
factory/locale checks. Controls cover additive damage before crit/mitigation,
Paladin stacking, duplicate sources, actual source death (130 at 1700ms, 100 at
3400ms), fresh-wave withdrawal, stunned/frozen sources, invalid source identities,
all six nonphysical types, enemies, actual newly spawned minions, complete
action/crit/dodge/timing sequences, recorded/unrecorded parity, deterministic
replay, immutable inputs and alternate authored tuning. Generic skill/buff IDs
do not grant source authority.

Focused validation passes 85 tests across six files. Earlier failures are retained:
strict Ajv first rejected a missing local property reference in the new conditional;
the schema was corrected without weakening validation. Two death-control attempts
hit ordinary accuracy misses; the final fixed-damage fixture explicitly always
hits while preserving exact damage/death/timing assertions. Ordinary accuracy and
RNG sequence parity remain separate controls.

The first full engine run reports 10,781 passed and three failed. Each failure
requires the intentionally removed placeholder: a Might buff cast, an undefined
trigger or permissive native Might metadata. Three test files now assert the
native passive contract, continued active Jab, no hero-granted aura and the real
distinct mercenary schema. Prayer retains its undefined-trigger control; an
unrelated identity retains the generic schema boundary. These corrections pass
326 tests across four files, including the unchanged primary three regressions.

## Final validation

Node 24.21.0 / npm 11.19.0. Checks run sequentially through the external native
driver, which records command, PID, native exit and before/after input hashes.

| Check | Result | Wall time |
| --- | --- | ---: |
| Compatibility controls (session71645) | 326 passed / four files; native 0 | 7.172s |
| Engine (session32280) | 10,785 passed / 403 files; native 0 | 190.782s |
| Unfiltered full unit (session80748) | 21,345 passed, two existing skips / 998 files; native 0 | 927.577s |
| Typecheck (session95408) | No errors; native 0 | 108.550s |
| Lint (session85723) | Zero warnings; engine purity passes; native 0 | 199.979s |
| Production build (session46454) | Build and service-worker generation succeed; native 0 | 13.129s |

All six final checks preserve the same 2,033 executable,
data, configuration and test inputs, SHA256
`020d2f99f4e56ac62cb9615f5975b609aa401a52e72b672592c763f1b44e7c9f`.

Full counts above use the terminal summary and individual assertion statuses;
this reporter's aggregate `numPassedTests` includes the two skipped assertions.
The unchanged skips are `fresh-campaign-continuation.test.ts` ("runs one declared
authentic saved-domain Rocky Waste continuation and restores its caller") and
`fresh-campaign-economy.test.ts` ("runs one bounded authenticated earned farming
policy and restores its caller"). Each raw full name has a leading suite-space.
No `.once.ts` entry is discovered.

Build warnings report large chunks, stale Browserslist data and the 2.57 MB art
manifest excluded from precache. The output directory is intentionally external.
No limits or configuration are weakened. This successful build does not prove
runtime performance or offline acceptance.

Independent implementation review approves/security pass/findings[], receipt
SHA256 `99d43f6cc5ac8a596a1b28c31d4ebd2dc06c230277359bf082d7193646ed9dc4`.
The separately reviewed compatibility corrections approve/security pass/findings[],
receipt SHA256 `2c82849604c5280e9c05fd0724a3eb1eb666eaedd8749624507476924b1894cc`.
Final evidence review approves/security pass, with adequate bounded evidence,
no findings or blockers and readers released. Receipt SHA256
`023b3e7afaa540d787da19fb492af989846cded0060795923f2a9e01ec1e2891`.

## Limits and retained evidence

This establishes a bounded native factory/combat repair. Browser recruitment,
earned builds, balance and campaign acceptance remain pending, as do the other
open bugs and full-v1 gates. The 212 bounded/one unverified player-skill inventory
is unchanged. No browser or app is launched, no spent native experiment is
retried, and no protected fixture or closed acquisition policy is read/replayed.
H3 remains terminal failed-no-app. No publication, merge or deployment occurs.

Root retains raw failing/passing logs, reports, input maps and independent reviews
under `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-might-3expqn1p`
through unfinished goal/review consumers and owns eventual verified cleanup.
The exact disposable `build` child (762 files, 42,259,816 bytes) has been removed
and its absence verified. All final driver/command PIDs and the initial engine
run's recorded PIDs are absent; `cleanup.json` records no cleanup failures.
Raw evidence stays retained for the unfinished goal. The umbrella goal and
claimed worktree stay active.
