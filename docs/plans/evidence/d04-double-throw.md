# D04 — Double Throw's actual bounded pair

2026-10-25; [contract](../decisions/D04-double-throw-v1.md),
[BUG215](../../../production/bugs/BUG-215-double-throw-single-attempt.md).
Source/tests/contract `25ae9b20`. Author verification only; independent design/QA
and earned class/build acceptance remain open.

## Behavior

Two total independently resolved throws rotate within the same original up-to-two
living-enemy pool. Existing selection prioritizes enemy summons, then battle
insertion order. Singleton can receive both; dead originals are skipped and
surviving originals can receive remaining attempts. No outside replacement;
caster/pool death ends the cast. Misses consume attempts. One12MP/CD1 commitment.
Preserve Physical50–75/+5rank, unlock12/cap20, Double Swing prerequisite/Bash ancestor
and existing equipment eligibility. No new weapon-stat contribution, save/version,
dependency or global target-policy change. JSON opts into the existing shared
sequence runtime without changing it; closed schema rejects contradictory modes.

The up-to-two pool/default rotation is an explicit author resolution of the old
two-weapon promise. Double Swing retains two passes per target and Fury retains
five total attempts. Both locales now show damage per attempt, two total attempts,
pool/miss/death/payment rules and current/next/MAX correctly.

## Mechanical and integration proof

40new cases/four files:10schema/registration/pure display,20native causal/playback,
2native allocation/wave/save and8actual bilingual UI.36rank/seed/layout scenarios
cover ranks1/2/20 ×seeds7/19/41/97 ×one/two/four enemies. Actual HP/MP deltas,
immutable exact replay and ordinary runBattle equality pass. Full HP/MP/living
active-status playback matches the authoritative result.

Seed41 consumes a first miss and still resolves the second throw. Independent
critical outcomes, ordinary Defense/50%Physical resistance, personal Bone Armor
absorption across reflected hits and lethal-reflection stop are covered. First
original death creates one death/corpse/two boss orbs, second throw remains on
the other original, outside enemies remain unchanged. A killed singleton ends
after one attempt. Enemy-summon priority is verified. Shield/corpse contexts are
explicit synthetic shared-consumer state, not earned Barbarian access.

At500ms action cadence, casts at500/1500ms each pay once;1000ms uses an ordinary
attack before cooldown expiry. Insufficient MP/CD prevents the entire skill.
Native class/unlock/prerequisite/rank/MAX/alias checks, allocation during a frozen
recording, next-wave use and resource-preserving save/import pass. No saved
combat teams/status or pool refill is introduced.

## Browser and build proof

Four production cases:en/zh-CN ×360×640/1280×800. Public create/export/import,
allocation1→2, priority configuration, actual cast and Save-close-new-page-Continue.
All four first casts produce exactly two positive1HP attacks, on Bone WarriorsA/B,
after actual enemy mitigation. This is mechanical proof, not damage viability.
Synthetic L30/pools/imported helmet/fixed combat Date.now are declared; no test
bridge or earned campaign action. Eight pairs preserve player/inventory/map/
mercs/formation exactly; meta idle clocks may advance on real reopen.
20geometry checks cover360×640/412×915/640×360/1280×800/1920×1080, no horizontal
overflow and allocation≥44px.16screenshots/four individually inspected show
bilingual descriptions, current/next per-attempt numbers and real logs.
Existing missing navigation glyphs/full a11y/device/offline acceptance stay open.
Four bridge-free chunks,756present precache URLs. Existing main-bundle/generated
manifest precache warnings and performance/test budgets remain open.

## Validation and limits

Native/schema/display RED15failed/17passed and UI RED8failed are retained.
Focused-final40/4, engine7798/290, compatibility84/7 (including actual shared
loader1/1), types-final/lint/corrected-test lint/build/browser PASS.
Full15103/687/two existing skips PASS:Vitest555.62s,
wrapper557.012s. No new skip, weakened assertion or disabled test was introduced.

Initial typecheck failedTS2379 because a negative display fixture assigned
optional hitSequence:undefined under exactOptionalPropertyTypes. It now omits
the property, preserving the same missing-sequence expectation. The full run
began before this equivalent test-only correction; final focused/typecheck and
surgical lint verify final test bytes. Gameplay source/build stayed frozen;
no full restart or cancellation. The pre-correction fixture/freeze and failed
receipt remain retained. All1185delivered source/config/contracts and760build
hashes/genuine save are audited, including actual committed Git blobs.
Author five-axis/security review has no required finding; independent review
and earned balance remain open.

## Delivery

Only Double Throw gains inventory credit:113bounded-functional/98unverified/
one engine-only/one review-needed; Barbarian15/30. All213IDs/order and212other
rows remain byte-exact. [Frenzy](d04-frenzy-repro.md) separately reproduces inert
speed from repeated paid landed hits, without patch or credit.

Raw 121 archive members/14 terminal receipts are byte-verified.
Cleanup removed 881 exact task-owned files, including 760 disposable build
files. All 29 recorded PIDs are absent, port4501 is closed and scratch is
absent, with remaining/failures empty. Shared caches and the umbrella
worktree/branch/claim are preserved; independent acceptance remains open.

[Raw archive](fixtures/double-throw/raw.tar.gz),
[member manifest](fixtures/double-throw/packet.json),
[source audit](fixtures/double-throw/source-delivered.json),
[browser audit](fixtures/double-throw/browser-audit.json),
[cleanup receipt](fixtures/double-throw/cleanup.json).
Genuine Ancients/Rite staysL33/XP149261/nextNormal402/Nightmare0/Baal uncleared,
decompressed SHA256
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
C0/C1 retain narrow exits; C2–C4/fullG0–G7/seven classes/two earned builds each/
30–50hour pacing/economy/endgame/independent acceptance and full privatev1 remain
unfinished. No genuine campaign or remote action. Root sole writer/reviewer;
umbrella goal/branch/worktree/claim active.
