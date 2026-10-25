# D04 — Actual Jab repeated attack attempts

Fixed and verified locally: runtime `9f7f6ef0`, presentation `e99ad3b3`.
Root sole writer and author reviewer; independent design/QA and earned balance
remain open. [BUG203](../../../production/bugs/BUG-203-jab-missing-repeated-attacks.md),
[original reproduction](d04-jab-repro.md) and
[contract](../decisions/D04-jab-v1.md) precede the implementation.

Actual JSON now authors `hitSequence:{strikes:3}` through the existing adapter
and shared bounded runtime. The closed schema admits only actual Jab and Fury,
and rejects contradictory Jab identity/status payloads. No combat-loop or
adapter change, weapon Attack scaling, saved field or version change. Preserve
Physical30–45/+3rank, single original enemy,5MP,1second cooldown,unlock1/cap20
and no prerequisite/equipment gate. Three attempts are provisional v1 tuning,
not earned or canonical balance evidence.

## Actual state and boundaries

The original12-case native reproducer now passes, with three attempts and one
5MP payment per cast. Seed7 produces rank1 `[30,38,33]`, rank2 `[33,41,36]`
and rank20 `[87,95,90]`; final target HP is1899/1890/1728 from2000. Seed41
produces miss/hit/miss, proving missed attempts are spent independently. Inputs
are immutable and both recorded and ordinary battles replay exactly.

The49new tests comprise23native,12schema/registration,6pure display and8UI.
They cover original-target retention, target death with another living enemy,
one death/corpse/orb settlement, lethal reflection, target and reflected shield
depletion between attempts, independent criticals, ordinary Defense/resistance,
existing Bleed combo, absence of weapon scaling, mana/cooldown refusal and exact
500/1500ms cooldown boundary. Native class/unlock/rank/legal-alias MAX authority
and captured allocation isolation are covered. Fury's five-attempt rotation is
unchanged. Impale's Jab control now requires all three hits to remain
Defense-sensitive and free of bypass/Bleed.

Initial native/schema RED:11failed/9passed. Display/native RED:14failed/
21passed, including one corrected fixture assumption: over-cap alias99 is
rejected, not clamped; valid rank20 resolves by MAX and the negative99 control
remains. Explicit event predicates corrected four strict-type errors; original
failures are retained. No assertion was skipped or weakened to pass.

Final focused49/4, compatibility/data948/23, engine7535/273, strict types,
full lint and changed-native-file lint pass. Production `VITE_E2E=false` build
passes; four JS chunks contain no test bridge and all756precache URLs exist.
Final full passes14443/644files with two existing skips,495.004s wrapper
(Vitest493.55s). No full run was interrupted.

## Public browser and persistence

Four final production cases pass: en/zh-CN×1280×800/360×640. Public creation,
import, rank1→2allocation, active configuration and actual one-cast/three-attempt
logs agree. Eight final Save-close-new-page-Continue pairs preserve player,
inventory,map,mercs,formation exactly, including both allocations. Twenty final
geometry samples cover360×640/412×915/640×360/1280×800/1920×1080: no horizontal
overflow and checked Allocate controls>=44px.

The first mobile log screenshots had scrolled past Jab. Two supplemental cases
scroll the paused log to the cast; no source change. All six runs remain in the
packet:12exact pairs,30geometry,30screenshots,10individually inspected. Final
mobile images show the real cast and three attempts. Existing icon fallback,
fixed bars and full accessibility/PWA/performance gates remain open.

Fixtures explicitly import a synthetic L30 Amazon and large-resource helmet;
combat Date.now is fixed at2026-10-25T12:30:00Z while timers remain ordinary.
No private store injection/test bridge. Native HP assertions establish causal
mechanics; browser logs alone do not establish balance or earned progression.

## Provenance and remaining work

All1376source/test/config, two controlling design and760build hashes plus
HEAD/genuine remain exact through full. Actual committed blobs and current disk
bytes match the tested snapshot at `e99ad3b3`.

Inventory preserves213IDs/order and credits only Jab:102bounded-functional,
109unverified, one engine-only and one review-needed. Amazon9/30plus one
engine-only is locally bounded, not earned build acceptance. Dragon Talon only
receives separate reproduction/contract links and remains unverified; other
211rows remain exact.

Genuine claimed Ancients/Rite remainsL33/XP149261/nextNormal402/Nightmare0,
Baal uncleared; decompressed SHA256 stays
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
C0/C1 keep their narrow exits; C2-C4/fullG0-G7, all-class earned builds,
30–50hour pacing/economy/endgame and independent acceptance remain unfinished.
No genuine campaign or remote action. Umbrella goal/branch/worktree/claim stay active.

[Raw archive](fixtures/jab/raw.tar.gz), [member manifest](fixtures/jab/packet.json),
[committed-blob audit](fixtures/jab/committed-source-audit.json) and
[cleanup receipt](fixtures/jab/cleanup.json) retain proof and original failures.

All213raw members/32terminal receipts are member-hash verified. Cleanup
removed973exact task-owned files after consumers finished; scratch and all
65recorded owned PIDs are absent,4490closed,remaining[]/failures[]. Older
retained roots/shared caches remain preserved. Umbrella worktree/claim stay active.
