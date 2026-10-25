# D04 — Fury repeats real attacks; Druid wind/control verification

Runtime `f17fd2b` repairs BUG194; presentation `b0c8ee5` adds
truthful bilingual per-strike/count/grid/control details. Exactly Fury, Arctic
Blast, Tornado, Hurricane, Twister and Shock Wave receive bounded local functional
credit. Five wind/control attacks retain their existing runtime data. Independent
design/QA and earned class/build balance remain open.

## Behavior and contract

[Contract](../decisions/D04-druid-fury-wind-v1.md) adds explicit provisional
JSON `hitSequence.strikes=5`, integer technical bound2–8. This is new v1 tuning,
not canonical D2 or earned balance. Existing Fury95–135/+8rank,11MP,1s cooldown,
unlock30/cap20 and full Rabies prerequisites stay unchanged. One cast pays and
starts cooldown once; each attempt uses a fresh ordinary roll and the existing
damage/status/absorption/death/orb/reflection settlement. All share the scheduled
simulation timestamp. No new enemy turn, RNG algorithm or save field is added.

Select the existing first-two pool once; rotate among living original members,
skip dead targets, allow the survivor to take the remaining attempts, and stop
when the actor or pool dies. A miss spends an attempt. Never acquire a third
target or attack a corpse. No-sequence damage remains unchanged. Fury works in
human, paid wolf or paid bear form after the learned prerequisites; it neither
transforms nor requires a separately paid transformation. The strict schema
limits metadata to exact Fury and forbids contradictory shape/status overrides.

Arctic Blast remains best-cross Cold/Chill; Tornado best horizontal line3
Physical/no control; Hurricane one all-enemy Cold/Chill pulse; Twister first-two
Physical/Stun; Shock Wave all-enemy Physical/Stun in any existing paid form.
Copy now reflects these actual rules. Twister no longer promises knockback;
Hurricane does not promise a sustained aura. Shared Chill2s/Stun1s/bossStun0.5s
are displayed from authoritative defaults. All five retain authored damage,
growth, cost, cooldown, unlocks, rank caps and prerequisites.

## Causal evidence and corrections

Original native rank1/20 RED at seed7 legally pays11MP for one action but resolves
one hit, removing97/249HP. Original script/results/log/terminal1 receipt remain.
The same assertions pass via a green-output variant that preserves the RED result.
Five new test files add88 cases:19combat,19schema,4display,38native causal and8UI.
Literal five-strike damage at rank1 is97,116,104,105,116 (538HP); rank2 totals578,
rank20 totals1298. Mitigated strikes38,48,42,42,48 remove218HP. Tests assert
actual HP/payment/action/cooldown, original-pool order/stops, missed attempts,
reflection death, unchanged no-sequence controls and immutable exact replay.
A finite240-point shield absorbs successive reflections97,116,27 before later
reflections remove77,105,116HP; no pool reset or stale actor write occurs.

Native rank1/2/20 cases cover actual hit HP, all six target sets, exact class/
unlock/prerequisite/cap/MAX-alias authority, real Stun interruption and boss
expiry, actual paired Chill delay, and paid wolf/bear preservation. Pure display
and bilingual Skills checks cover current/next/MAX/unlearned bounds and count.

Original failures/sources are retained. A schema editor's unanchored substring
assertion failed before writes. Initial native form fixtures omitted selecting
the paid form; corrected fixtures preserve the actual runtime. Control fixtures
assumed2500ms although the ordinary scheduler caps the period at2000ms. Seed7
then missed after an earlier enemy consumed RNG; disclosed seed1 plus an actual
landed-hit assertion provides the paired Chill check. Initial display/UI,
pre-metadata, type and lint failures remain; explicit typed status extraction
retains all original status identity/source/clock assertions without suppression.
A pre-browser scratch inspection misread regex escaping and failed before any
driver edit; the prepared driver was already correct. Root source/test/visual
review is author self-review, not independent acceptance.

## Production browser evidence and limits

Four terminal0 cases use one explicit-false production build, en/zh-CN ×
1280×800/360×640. Public controls create/export/import, Save-close-new-page-
Continue, allocate all six rank1→2, select each attack, enter real Catacombs,
Pause/Flee and Continue again. Separate attachment auditing confirms24 actual
attack entries, first Fury sequences2–5 resolved attempts, actual damaged living
enemies, eight exact player/inventory/map/mercs/formation Continue pairs, six
spent points per case and final selected Shock Wave. No page errors or test bridge.
Twenty geometry samples cover360×640,412×915,640×360,1280×800,1920×1080 with no
horizontal overflow and allocation targets at least44×44. Forty-eight screenshots
remain; eight selected captures were individually inspected.

Fixtures are synthetic L30/full learned prerequisites/50000-life-and-mana gear,
defense100/attackSpeed−80, with no extra critical gear. They establish actual
public allocation/combat/persistence, not earned campaign or balance. Existing
mobile nested scrolling/fixed header/nav occlusion and icon/font fallback remain;
mobile combat enemies can lie below the captured fold. Complete mobile/a11y/PWA
acceptance is open. Existing bundle/precache/Browserslist and test/runtime budget
issues remain. Exact owned preview PID423178 is absent and port4480 is closed.

## Final validation and scope

Final standard full: **13607 tests /596 files**, **two existing skips**,
443.058s wrapper wall. Engine: **7069/249**,80.664s. Focused:104/6,9.095s
(88new plus16existing sustain UI cases). Typecheck47.311s, full lint109.673s
plus changed-test lint9.983s, production build11.942s pass. Four JS chunks contain
no forbidden test-bridge tokens; all756 precache references exist. Original
warnings remain. No new skips, threshold/timeout relaxations or dependencies.

All1321 source/test/config hashes,760 build hashes, HEAD/Git status and genuine
save digest stay exact through the final full run. Actual committed HEAD blobs
are compared against every tested source hash and disk after both local commits.
No source changes follow. Retained build hashes represent disposable output.

Exactly six rows gain credit; all213 IDs/order remain: **129unverified /
82bounded-functional /one engine-only /one review-needed**. These differing proof
scopes are not an overall completion percentage. Genuine Ancients401 retains
SHA256 `c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`:
L33/XP149261/23682gear/nextNormal402/Nightmare0, Ancients/Rite claimed,
**Baal uncleared**. No genuine campaign or remote action. C0/C1 retain narrow
historical acceptance; C2-C4/fullG0-G7, earned all-class builds/pacing/economy/
endgame and independent acceptance remain open. Root is sole writer; umbrella
goal/branch/worktree remain active.

## Retention and cleanup

[Manifest](fixtures/druid-fury-wind/manifest.json),
[raw packet](fixtures/druid-fury-wind/raw.tar.gz),
[retention audit](fixtures/druid-fury-wind/retention-audit.json) and
[cleanup receipt](fixtures/druid-fury-wind/cleanup.json) preserve original RED/
failures, source variants, scripts/logs/terminal receipts, browser exports/
screenshots, build/freeze maps, source blob audit and author reviews. Every raw
member is byte-compared against its original before exact task-owned disposal.
Shared caches, umbrella worktree and older required campaign evidence stay under
their existing ownership. Cleanup verification follows.

All **260 raw files**, including **37 terminal command receipts**, were
byte-verified as260 archive members. Exact cleanup removed **1020 task-owned
disposable files**; scratch absent, owned preview PID423178 absent, port4480
closed, remaining paths `[]`, cleanup failures `[]`.
