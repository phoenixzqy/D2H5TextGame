# D04 — Actual Dragon Talon repeated kick attempts

Fixed and verified locally: runtime `5f9a2f8f`, presentation `2e132186`.
Root sole writer
and author reviewer; independent design/QA and earned balance remain open.
[BUG204](../../../production/bugs/BUG-204-dragon-talon-missing-repeated-kicks.md),
[original reproduction](d04-dragon-talon-repro.md) and
[contract](../decisions/D04-dragon-talon-v1.md) precede implementation.

Actual Dragon Talon JSON now authors `hitSequence:{strikes:3}` through the
existing catalog and shared bounded runtime. The schema admits sequence
ownership only for Fury, Jab and Dragon Talon and requires consistent native
single-target Physical identity for the latter two. No combat-loop/adapter,
weapon Attack scaling, save field or save-version change. Preserve Physical
40–60/+4rank,4MP,1second cooldown,unlock1/cap20 and no prerequisite/equipment
gate. Three attempts are explicit provisional v1 tuning; earned balance is open.

## Actual combat and regression boundaries

The original12-case native reproducer now passes with three independent
attempts and one4MP payment per cast. Seed7 produces rank1 `[41,50,45]`,
rank2 `[45,54,49]` and rank20 `[117,126,121]`; actual final target HP from2000
is1864/1852/1636. Misses spend attempts independently. Original target death
stops the sequence even when another enemy lives; lethal reflection stops the
caster. One death/corpse/orb closure is preserved.

The49new tests comprise23native,12schema/registration,6pure display and8UI.
They cover immutable exact replay and ordinary/recorded parity, native
class/unlock/rank/alias/MAX authority and captured allocation isolation,
original-target retention, misses, independent criticals, mitigation, personal
shield depletion on either side, reflection, existing Bleed combo and no
weapon Attack scaling. Mana3 cannot pay the whole4MP cast; cooldown refusal
and exact500/1500ms boundary prove one payment/cooldown per accepted sequence.
Fury's five-attempt rotation and Jab's three attempts remain compatible.

Initial actual-source RED:31failed/18passed. First green attempt retained
7failed/115passed: an incorrectly extrapolated third-kick golden44 was corrected
to45 for this inclusive40–60range. Associated final HP expectations changed by
one; count, target, payment, stop and resource assertions were not weakened.
No runtime code changed to satisfy that fixture. `fixture-correction.json`
retains the explanation alongside both original failed terminal receipts.

Final focused compatibility148/12, data/registration815/14, engine7553/275,
strict typecheck and full lint pass. Production `VITE_E2E=false` build passes;
four JS chunks contain no forbidden test bridge and all756precache URLs exist.
Final full passes14492/648files with two existing skips,495.830s wrapper
(Vitest494.50s). No run was interrupted or restarted. Suite/type/lint durations
exceed repository budgets; this slice does not close those performance gates.

## Public browser and persistence

Four production cases pass: en/zh-CN×1280×800/360×640. Public creation/import,
rank1→2allocation, active configuration and actual one-cast/three-attempt logs
agree. The synthetic import starts with empty priority. Rank1 Continue preserves
that empty priority; the public Active Skills selector then changes it to
Dragon Talon, and rank2 Continue preserves the selected priority. Eight exact
Save-close-new-page-Continue pairs preserve player,inventory,map,mercs,formation.

Twenty geometry samples cover360×640/412×915/640×360/1280×800/1920×1080: no
horizontal overflow, checked Allocate controls>=44px. Twenty screenshots are
retained; eight were individually inspected, including the paused combat log
scrolled to the actual cast/attempts at both primary sizes and locales.
Existing icon fallback/fixed bars and full accessibility/PWA/performance gates
remain open.

Fixtures explicitly import a synthetic L30 Assassin and large-resource helmet.
Combat Date.now is fixed at2026-10-25T12:30:00Z; timers remain ordinary. No
private store injection or test bridge. Native final-HP assertions establish
causal mechanics; browser logs alone do not establish balance or earned play.

## Provenance, accounting and remaining scope

All1380source/test/config, two controlling design and760build hashes,
historical HEAD19773fc5 and genuine-save digest remain exact through full.
Actual committed blobs and current disk match the tested snapshot at
`2e132186`; historical HEAD19773fc5 is not claimed to contain the tested patch.

Inventory preserves213IDs/order and credits only Dragon Talon:103bounded-
functional,108unverified, one engine-only and one review-needed. Assassin6/30
is locally bounded; earned class/build acceptance remains open. The seven separate
[Assassin Burn reproductions](d04-assassin-burn-repro.md) grant no credit and
do not waive their charge/trap/corpse/composite requirements. Those seven rows
gain reproduction/risk links only; the other205rows remain exact.

Genuine claimed Ancients/Rite remainsL33/XP149261/nextNormal402/Nightmare0,
Baal uncleared; decompressed SHA256 stays
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
C0/C1 keep narrow exits; C2-C4/fullG0-G7, all-class earned builds,
30–50hour pacing/economy/endgame and independent acceptance remain unfinished.
No genuine campaign or remote action. Umbrella goal/branch/worktree/claim stay active.

[Raw archive](fixtures/dragon-talon/raw.tar.gz),
[member manifest](fixtures/dragon-talon/packet.json),
[committed-blob audit](fixtures/dragon-talon/committed-source-audit.json) and
[cleanup receipt](fixtures/dragon-talon/cleanup.json) retain proof and original
failures. Final archive counts and cleanup result are recorded below.

All143raw members/16terminal receipts are member-hash verified. Cleanup removed
903exact task-owned files after consumers finished; scratch and all33recorded
owned PIDs are absent,4491closed,remaining[]/failures[]. Older retained roots,
shared caches and the active umbrella worktree/claim remain preserved.
