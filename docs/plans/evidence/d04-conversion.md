# D04 — Conversion effective combat allegiance

2026-10-25. BUG200 is locally repaired and verified. Runtime/native commit
`2a37023d`; presentation/contract commit `f93a4e23`. Root is sole writer and
author reviewer; independent design/QA and earned class/build balance remain
open. This packet credits one mechanic, not earned whole-class acceptance.

[Contract](../decisions/D04-conversion-v1.md),
[original reproduction](d04-conversion-repro.md),
[bug](../../../production/bugs/BUG-200-conversion-inert-allegiance.md).

## Repair and controlling behavior

The original paid native rank1/20 casts left targeting unchanged: the converted
monster removed100HP from the hero at1860ms. The same native regressions now
prove actual former-ally HP loss100, heroHP2000 unchanged and25MP paid. Both
results replay exactly without mutating inputs. These resources/timings are
synthetic, not earned campaign proof.

Conversion keeps its authored Physical60–85/+5 per rank,25MP,3second cooldown,
unlock24/cap20 and complete Sacrifice→Zeal→Vengeance chain. JSON now explicitly
authors8seconds and ordinary trash/rare-minion eligibility. Those two choices
are provisional v1 tuning, replacing the accidental unknown-status1second
fallback; they do not establish canonical D2 or earned balance acceptance.

A landed paid hit removing positive HP converts a surviving eligible original
enemy monster. Misses/kills/nonpositive loss do not convert; elite/champion/
rare-elite/boss/chapter-boss targets still receive ordinary damage. Native class,
unlock, exact MAX aliases and transitive prerequisites establish fresh rank.
Only a living original hero and unchanged registered identity/effects/costs can
pay. Fabricated status markers and contradictory payloads grant no authority.

Actual paid hits create battle-local authenticated bindings. Effective allegiance
governs basic attacks, registered damage/debuff/healing skills, readiness, target
priority, hostile resistance/slow/pulses, reflection and hostile hit recovery.
Converted monsters retain real skills/resources/cooldowns/schedules. Existing
and newly spawned living enemy summons recursively follow a living converted
owner; cycles terminate. Expiry/source death or lost eligibility removes power.
Multiple targets coexist; converted allies cannot be retargeted/refreshed until
hostile again. The last converted enemy waits for expiry rather than clearing.

Immutable original side/ownership continues to govern victory, death, corpse,
orb/reward provenance, summon positioning and result teams. Existing beneficial
party-only auras keep their original-party scope. No stats, resource refill,
extra RNG, cleansing, movement or saved paid binding is introduced. Existing
DoTs/control still settle. Fresh battles start with empty binding maps; Save22
and migrations are unchanged. The converting hit captures hostility before
changing allegiance, preserving its own reflection and recovery settlement.

Source-death review found a real status-observation defect: lethal reflection
could empty the binding map before survivor status views were republished.
The retained regression first failed; capturing prior binding presence now
clears the visible status before sticky hero defeat. Both locales explain the
finite duration, eligibility and original enemy identity and display localized
Converted/已转化 chips/logs with ordinary current/next/MAX damage previews.

## Verification

| Check | Actual result |
| --- | --- |
| New focused coverage |63 passed in5files: definition/schema17, engine34, native causal2, bilingual UI8, localized logs2; final strict-fixture bytes. |
| Engine |7,491 passed /269files on final strict-fixture bytes;119.342s wrapper. |
| Full |14,289 passed /634files, two existing skips;588.283s final strict-fixture wrapper. |
| Typecheck/lint |Both final checks terminal0; engine purity269files passes. The retained strict-type fixture failure was corrected by omitting the missing rank, without weakening production types. |
| Production build |Explicit VITE_E2E=false terminal0; four chunks bridge-free, all756precache references exist. |
| Production browser |Final en/zh-CN×desktop/mobile4/4 plus two supplemental mobile cases terminal0. Public rank1→2 allocation/selection, descriptions, localized real status/log and save/reopen. |
| Persistence |Twelve separately audited exact player/inventory/map/mercs/formation Save-close-new-page-Continue pairs, including four supplemental mobile pairs. No conversionRank persisted. |
| Geometry/inspection |30five-size samples, allocation>=44px/no horizontal overflow;16screenshots retained,12 individually inspected. Supplemental mobile captures show the lower detail panel and converted enemy after ordinary scrolling. |

Browser fixtures explicitly import a constructed L30 Paladin and large HP/MP
equipment through public UI. They prove real conversion presentation, not parsed
monster→monster HP loss; native/engine causal tests prove actual allegiance.
The fully absorbed native case is not constructible with current enemy shields:
ordinary high mitigation retains minimum1damage. The nonpositive-loss guard is
source-inspected; no native fully-absorbed causal proof is claimed.

The first completed544.659second full run retains its own exact freeze audit.
Only `conversion.test.ts` then changes to omit a missing optional rank rather
than assigning undefined. Production source and all760build files stay exact.
The final strict-fixture audit freezes all1,366source/test/config files,760build
files, genuine digest and HEAD through the588.283second full run. After both
implementation commits, every actual committed source blob and disk hash matches
the tested bytes at `f93a4e23`; build/genuine hashes remain exact.

Original native/engine/UI REDs, schema compilation failure, lint errors, fixture
assumptions/corrections, Chinese dictionary misplacement and source-death RED
remain retained. The first full run was deliberately stopped using exact owned
descendants before lint/source-death corrections; it is terminal-15, not a pass.
The subsequent full pass predates the strict-type fixture correction. Initial
four browser passes use a superseded build and receive no final-build credit.
The four final and two supplemental cases use the final unchanged runtime bytes.

## Credit and remaining acceptance

The [inventory audit](fixtures/conversion/inventory-reconciliation.json) preserves
213IDs/order and credits only Conversion:99bounded-functional,112unverified,
one bounded-engine-functional and one review-needed. Paladin30/30 is locally
bounded functional; independent design/QA and earned Paladin build/balance
acceptance remain open. A second row records Freezing Arrow reproduction/risk
links while remaining unverified; it receives no mechanic credit.

[Raw archive](fixtures/conversion/raw.tar.gz),
[member manifest](fixtures/conversion/packet.json) and
[committed source audit](fixtures/conversion/committed-source-audit.json) retain
the exact diagnostics. The same packet separately retains the
[Freezing Arrow structural reproduction](d04-freezing-arrow-repro.md), including
its original incorrect all-seeds-hit assumption, corrected native hit/miss
observations and unchanged missing-effect RED. Its source hashes match the
committed frozen runtime. This is an open next repair, not Conversion credit.

Genuine claimed Ancients/Rite save remainsL33/XP149261/nextNormal402/Nightmare0,
Baal uncleared. Decompressed SHA256 remains
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
No genuine campaign action, remote operation or deployment. C0/C1 keep their
original narrow acceptance; C2–C4/fullG0–G7, all-class builds,30–50hour pacing,
economy/endgame and independent acceptance remain unfinished. Existing mobile
scrolling/fixed bars, icon fallback, bundle/test/device performance and full
accessibility/PWA gates remain open.

The raw archive retains244files/43terminal receipts, each member byte-verified.
[Cleanup](fixtures/conversion/cleanup.json) confirms915exact task-owned scratch
files removed, task root absent, previewPID675230 absent/4486closed, interrupted
initial descendants absent, remaining[]/failures[]. Archived command outputs
were removed only after hash verification; requested evidence and source remain.
Older retained roots and shared caches are preserved. Umbrella goal/claim/branch
remain active.
