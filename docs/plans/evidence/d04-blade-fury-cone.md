# D04 — Blade Fury Physical cone repair

2026-10-25. Local author verification under
[D04](../decisions/D04-blade-fury-cone-v1.md) and
[BUG209](../../../production/bugs/BUG-209-blade-fury-line-instead-of-cone.md).
Independent design/QA and earned balance remain open; full v1 is unfinished.

## Change and native result

Actual JSON and the legacy builder now select the existing cone-2 preset:
one apex cell, then three adjacent cells in the next formation row. Preserve
shared densest placement, row/column tie order, clipping, overflow/default
coordinates and duplicate occupants. The geometry is explicitly provisional.
Closed schema ownership admits actual Physical Blade Fury separately from
Fire Blast's Fire/Burn identity. One ordinary independent hit per eligible
enemy; no added repeated attempts, critical bonus, DoT or weapon Attack scaling.

Preserve Physical40–60/+4rank,15MP once,CD1,unlock18/cap20 and Blade Sentinel
prerequisite. The existing combat resolver preserves mitigation, dodge,
absorption/reflection/death, native authority and immutable exact replay.
No new engine loop, dependency or saved field/version.

The original12 native cases at ranks1/2/20 ×seeds7/19/41/97 now select target
IDs1,3,4,5 instead of the horizontal0,1,2. One paid action, mana100→85, exact
replay and actual final-HP conservation in every case. Seed7 direct losses
are181/197/485HP; periodic damage is zero. The controls cover defaults,
duplicate occupants, Physical resistance, lethal reflection stops, single
death settlement, paid misses and ineligible native learning/resources.

## Presentation and browser

The pure rank model exposes the shared cone. The component routes description
by actual skill identity so Blade Fury cannot inherit Fire Blast's Fire/Burn
prose. Both locales show Physical damage per enemy, independent rolls,
placement, one payment and the cone at unlearned/current/next/MAX ranks.

Production en/zh-CN ×360×640/1280×800: four public cases pass. Create/export/
import, Save-close-new-page-Continue at rank1, public allocation to rank2 and
Active Skills selection, visible four-enemy Physical cast, then another exact
Continue pair. Eight five-domain pairs preserve player/inventory/map/mercs/
formation, points and priority. Twenty geometry checks at the five required
sizes show no overflow and allocation controls≥44px. Sixteen screenshots,
four individually inspected, show readable bilingual descriptions/rank rows
and actual combat. Synthetic L30/resources/helmet/fixed Date.now are explicit;
ordinary timers/public controls, no private store injection/test bridge and
no earned class/build/balance credit. Existing icon fallback, full a11y/device,
PWA/offline and performance acceptance remain open.

## Validation and corrections

47new cases:18schema/catalog/display,21native causal,8bilingual actual UI.
Focused compatibility148/7files, final47/3 and engine7637/281 pass. Strict
types and production build pass. Four production JS chunks are bridge-free;
all756 precache URLs exist. Final lint and full14777/661files/two existing skips pass (569.738s wrapper).
Existing build/test budgets are exceeded; no performance gate is closed.

Retained failures: initial33failed/6passed RED, first green5failed/71passed,
UI RED8failed, one strict discriminated-event narrowing error and two test
lint errors. Borrowed Fire Blast goldens were wrong because Burn consumes
extra RNG. Independent raw mulberry32 draws give Physical bases41/50/45/45
and50% resistance20/25/22/22. The ordinary5% hit floor makes seed7's first
attack land; seed2's first four draws all exceed.05 and prove paid misses.
Misses emit zero-damage events. No production rule was altered to repair
these fixtures. Strict filtering now narrows the event union; lint corrections
remove an unnecessary optional chain and compare concrete event fields rather
than returning any-typed asymmetric matchers. Final47/3 rechecks all final files.
The two test-only lint corrections occurred during the full run; production
bytes stayed unchanged. Before/after snapshots preserve that distinction.

## Delivery and remaining scope

Runtime/presentation/tests/contract commit `feb5c6f8` matches the tested source.
Inventory reconciliation preserves213IDs/order and212 other rows exactly; only
Blade Fury changes:107bounded-functional/104unverified/one engine-only/one
review-needed. Assassin10/30 locally bounded. Archive retains115 raw members and17 terminal command receipts, all byte-hash
verified. Cleanup removed875 exact task-owned files, including760 disposable
build files; all24 recorded PIDs and scratch are absent, port4495 is closed,
remaining[]/failures[]. The worktree/claim and shared caches are preserved. Mind Blast is a separate reproduced defect without
a patch or credit.
See [next reproduction](d04-mind-blast-repro.md).

Genuine retained Ancients/Rite remainsL33/XP149261/nextNormal402/Nightmare0,
Baal uncleared; decompressed SHA256 remains
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
C0/C1 retain narrow exits; C2–C4/fullG0–G7/all-class earned builds,30–50hour
pacing/economy/endgame and independent acceptance remain unfinished. No genuine
campaign or remote action. The umbrella branch/worktree/claim remain active.

[Raw archive](fixtures/blade-fury-cone/raw.tar.gz),
[member manifest](fixtures/blade-fury-cone/packet.json),
[committed audit](fixtures/blade-fury-cone/committed-source-audit.json) and
[cleanup receipt](fixtures/blade-fury-cone/cleanup.json) retain the evidence.
Archive SHA256:
`3dd25fe4f086ad6bac09bb4f4eb6c040a4dafaaeb7d0f6f099b6c0d2273fa2a4`.
Final validation is recorded in `fixtures/blade-fury-cone/final-validation.json`.
