# BUG-368 — Apply Rogue Pierce's party critical bonuses

Status: Open — native repair and automated checks verified; browser/earned/feature acceptance pending.
Severity: High — a recruitable mercenary's advertised party support is absent.
Build: `1c65738f3dae90b3d8cf65b61fac9da1f9f28d8a` plus the new primary regression only.
Environment: Node24.21.0/npm11.19.0, Vitest1.6.1 UI/jsdom.
Browser/viewport: not applicable to native reproduction. Locales: en and zh-CN.
Owners: engine-dev/content-designer/writer; root implements, producer reviews.

## Reproduction

1. Use real loadMercPool/createMercFromDef/mercToCombatUnit/default registry for
   `mercs/act1-rogue-pierce`; hold the source and opponent from acting.
2. Use constructed surviving stats, a fixed100Fire hero attack, zero target
   resistance/mitigation/dodge and ordinary critical multiplier2. This is native
   constructed support evidence, not earned recruitment.
3. Compare against the same source without configured passive-critical. Seeds
   and production PRNG draw evidence were frozen before the native test:
   seed0/basechance0 tests chance; seed7/basechance.95 tests multiplier;
   seed7/basechance1 separately tests existing excess-chance conversion.

Expected: gacha-spec.md:122 promises party +5 percentage points critical chance
and +20 percentage points critical damage. First native hits are220/220/222
versus control100/200/200. The passive never casts or pays resources.

Actual: all three numeric comparisons fail while control assertions pass.
The raw log shows100/noncritical for the chance case and200 versus222 for the
overflow case; Vitest groups the two220 failures. The registry reports unknown
passive-critical. The sole native RED exits1 in11.145327seconds; all2,050inputs
remain unchanged at
`1c132d693d8fd247843a4955a82da1340cb6f424a9f7c40cbe17e07c03757fcf`.

Primary: `src/stores/merc-critical.test.ts`, frozen SHA256
`f849a36617b0b2cf6e4d51a1614a7d9ed87186cbee93a1bef12ae8f8c0f27f8d`.
Raw RED log/JSON/receipt/maps, unchanged primary copy, seed evidence and independent
ready/security-pass plan review are retained by root at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-critical-mh4rugyk`.

Root cause: the existing row has no authored party potency, immutable native
resolver/registration, canonical source projection or shared critical additions.
Repair those boundaries, retaining the existing scalar/weighted critical roll,
overflow conversion, periodic/reflection eligibility and saved/base stats.
Duplicates must not stack; source death/removal withdraws living presence.

Browser/earned/feature and full-v1 gates remain pending. No new acquisition/
lineage experiment, browser/app, protected fixture or closed policy is involved.

## Native repair and verification — 2026-10-28

Closed JSON potency, immutable true-passive registration, canonical fresh
qualification and live original-party eligibility now supply the authored
+5 percentage points crit chance and +20 points crit damage. Duplicates do not
stack; death/removal withdraws support. Existing critical rolls, overflow,
mitigation, impact-time life, Burn snapshots, periodic/reflection rules and
saved/base stats remain intact. Both locale descriptions state the bonuses.

The unchanged three-case primary passes after the actual RED. Four new test
files contribute67passing cases; focused425/21, engine11,081/413 and full21,658/
1,014 plus2unchanged skips pass. Original engine/full runs retain their actual
c4e42e53 input map. Type-only combat-test lint corrections emit identical JS;
final exact lint, focused, typecheck, full lint/purity and external build pass
on final aa6d77f9 inputs. Original focused/lint failures remain preserved.
No engine/full rerun on corrected source or timeout cause/fix is claimed.

[Native evidence](../../docs/plans/evidence/merc-critical.md) records exact
results, review/source bindings, correction history, cleanup and limits.
Independent final source/evidence/security and local-checkpoint receipts are
retained in the packet above. This bug remains Open for actual browser/earned/
feature acceptance; no campaign/build/pacing/full-v1 acceptance follows.
