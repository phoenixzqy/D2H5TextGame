# D04 — Paid Cloak of Shadows and actual Blind

2026-10-25; local author verification under
[contract](../decisions/D04-cloak-of-shadows-v1.md) and
[BUG211](../../../production/bugs/BUG-211-cloak-of-shadows-missing-blind.md).
Independent design/QA and earned balance remain open.

## Behavior

The adapter now emits a personal paid Cloak followed by Blind for all current
living hostile recipients. Preserve unlock12/cap20/Psychic Hammer prerequisite,
base13MP/CD3, existing cost/cooldown scaling and ordinary rounding. Casts at
ranks1/2/20 cost13/13/11MP. No damage, healing or interruption is added.

The validated row explicitly authors provisional8000ms duration for both
effects and3% personal Defense per rank. Preserve the existing0.5 percentage
points/rank critical chance and magical dodge as finite paid bonuses. These
are author tuning, not accepted historical values or earned balance. Blind
uses the shared20 percentage-point Physical/thorns hit penalty and5% floor;
it leaves magical attacks and cadence unchanged. Boss Blind also lasts8s.
Later spawns do not inherit the cast's Blind.

Fresh native class/level/rank/recursive prerequisites establish authority. An
exact runtime definition check rejects contradictory overrides before payment.
The immutable paid payload is separate from Burst. Malformed, foreign, future,
extended and expired carried payloads confer no bonus. Base stats are never
mutated; one valid paid snapshot contributes to actual damage inputs. Potency
survives respec and wave rebase for its residual lifetime without a refill or
refresh. Active Cloak cannot recast; normal selection resumes after expiry.
Nothing adds paid status or timers to persistence or changes the save version.

## Evidence

Five new files contain53 cases:19schema/adapter,10definition/display/carry,
13causal combat,3native lifecycle/save and8bilingual UI. Causal tests capture
actual paid state through staged status playback before rebasing into a next
wave. Forty paired seeds show fewer Physical hits under Blind. With rank20
Cloak and base Defense100, a landed300 Physical strike removes140HP versus
200without paid Defense. Arcane damage events match with/without Blind;
personal magical dodge independently reduces Arcane hits. Paid critical bonus
changes actual basic critical outcomes. Base stats stay identical. Enemy action
clocks are unchanged; trash/boss statuses expire9700ms after a1700ms cast.
Normal repeated cast clocks begin1700/10200/18700. Native allocation freezes
the current recording, next-wave payment works, residual potency survives
respec, current-wave replay matches and save/import restores no paid bonus.

Four production browser cases cover en/zh-CN ×360×640/1280×800 using public
create/export/import/allocation/priority/cast/Save/Continue controls. They verify
actual buff/Blind logs and visible MP use. Eight before/after pairs compare
player/inventory/map/mercs/formation exactly. Twenty geometry checks cover all
five required viewport sizes, no horizontal overflow and allocation targets≥44px.
Sixteen screenshots, four individually inspected, show readable description,
current/next paid bonuses and actual casts. The skill preview screenshot is not
a causal Defense measurement; the paired engine damage tests provide that proof.
No page errors or test bridge. Synthetic L30/resources/helmet and fixed Date.now
for combat are explicit; ordinary timers, no earned build/campaign credit.
Meta idle clocks advance on the first real reopen and are outside those five
exact domains; the supplemental audit initially selected meta instead of mercs,
then corrected its domain list to match the original passing browser assertion.

## Validation and retained corrections

Focused53/5files, engine7734/286files and full14928/671files/two existing
skips pass (575.79s Vitest;577.38s wrapper). Strict types, corrected lint and
production build pass. Four JS chunks are bridge-free and all756precache URLs
exist. Existing timing/bundle/PWA budgets remain open.

Native RED8failed/1passed, schema RED3failed/16passed and display RED13failed/
5passed precede repair. Corrected fixture assumptions include milliseconds for
cooldown, paired seeds rather than a guaranteed single-seed miss, and staged
status playback rather than unstaged folding. Type fixes preserve readonly
snapshots, typed catalog input, optional properties and narrowed event variants.
First lint flagged one non-null assertion and two any-valued matcher assignments;
explicit guards and typed actual-status lookup corrected them without weakened
assertions. The first browser expected bracketed buff copy; observed output is
“gains buff: Cloak of Shadows.” The assertion was corrected; actual cast/Blind
already worked. The bounded failed trace retains all action/network/stack
metadata, first4/final12 of1051 screencast frames and standalone failure image;
1035extra frames and14unrelated static response bodies are omitted with hashes.

Runtime source/build stayed frozen through final checks. The full suite began
before one lint-only UI test assertion restructuring; final focused53/5 covers
the final test text. Typecheck timing is recorded in the command receipts.
The author five-axis review found no required change. Independent review stays
open. Existing icon fallback, test/bundle/PWA budgets and full device/a11y/offline
acceptance remain open.

## Delivery and remaining scope

Runtime/presentation/tests/contract commit `f08311cb` matches all1164 frozen
source/contract files in actual committed blobs; all760build files also match.
Only Cloak changes in the inventory:213IDs/order retained,212other rows byte-
exact,109bounded-functional/102unverified/one engine-only/one review-needed.
Assassin12/30 is locally bounded; earned class/build acceptance remains open.

The archive contains163raw files and25terminal command receipts, SHA256
`8095ec1d318e6aadfc7553177eb1f472740751315e6d56e93295f96659aa15b9`.
All51 recorded PIDs are absent. Final typecheck on the final test bytes passes
in84.38s after the full suite; no runtime or build drift.

Cleanup removed925 exact task-owned files, including760build files; all51
recorded PIDs are absent, port4497 is closed and scratch is absent. No remaining
paths or cleanup failures. Shared caches and umbrella worktree/claim preserved.

The [raw archive](fixtures/cloak-of-shadows/raw.tar.gz),
[member manifest](fixtures/cloak-of-shadows/packet.json),
[source audit](fixtures/cloak-of-shadows/source-delivered.json),
[browser audit](fixtures/cloak-of-shadows/browser-audit.json) and
[cleanup receipt](fixtures/cloak-of-shadows/cleanup.json) retain the proof.
[Final validation](fixtures/cloak-of-shadows/final-validation.json) rechecks
archive members, actual inventory changes, validation receipts, source, links,
genuine save and cleanup.

Psychic Hammer is separately reproduced before any repair or credit; see
[next reproduction](d04-psychic-hammer-repro.md). Genuine Ancients/Rite remains
L33/XP149261/nextNormal402/Nightmare0/Baal uncleared, decompressed SHA256
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
C0/C1 retain narrow exits; C2–C4/fullG0–G7/all-class earned builds,30–50hour
pacing/economy/endgame/independent acceptance and full privatev1 remain open.
No genuine campaign or remote action. Umbrella branch/worktree/claim active.
