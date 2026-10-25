# D04 — Dragon Claw paired strikes and local critical bonus

Fixed and verified locally: runtime/data `70efa356`, presentation `79d3311a`.
Root sole writer and author reviewer; independent design/QA and earned balance
remain open. [BUG208](../../../production/bugs/BUG-208-dragon-claw-missing-paired-strikes.md),
[original reproduction](d04-dragon-claw-repro.md) and
[contract](../decisions/D04-dragon-claw-v1.md) precede implementation.

## Restored behavior

Actual JSON authors two independent original-target attempts and a0.1 local
critical-chance bonus, ten percentage points per attempt. Preserve Physical
70–100/+7rank per attempt,20MP once,1s cooldown,unlock6/cap20/Talon prerequisite.
The exact bonus is provisional author tuning. Existing v1 eligibility has no
equipment gate; the two attempts represent the dual-claw flourish, without
claiming a general dual-wield system or earned/canonical balance.

The existing bounded sequence runtime settles hit/base/critical RNG, ordinary
Defense/resistance/combo, finite personal absorption, reflection and death per
attempt. Misses consume attempts. Stop on caster/original-target death, no
retargeting and no duplicate corpse/orb settlement. One action/payment/cooldown.
The bonus adds to native critical chance and eligible Heart of Wolverine only
in this damage effect's input. Existing critical overflow conversion remains:
half the chance above100% increases the critical multiplier. Basic/periodic/
reflected damage and other skills do not gain the bonus; attacker stats remain
unchanged. No weapon Attack scaling, new combat loop, dependency or save field/
version. Closed strict schema requires actual Physical/active/single-target
identity, exact pair and finite positive bonus; unrelated ownership is rejected.

## Native and automated evidence

All12 original native rank1/2/20 ×seed7/19/41/97 cases now make two attempts,
with one20MP payment/action, immutable exact replay and actual HP conservation.
Seed7 direct HP loss is157/171/423; final target HP1843/1829/1577, mana100→80.
Causal tests prove bonus-off extra critical HP loss, independent misses/criticals,
ordinary critical overflow, designated allied Heart interaction, both personal
shield directions, reflection/death stopping, resource/cooldown boundaries,
class/unlock/rank/MAX alias authority and captured allocation isolation. Party
interaction is a standalone engine projection, not earned multiclass play.

59new cases across4files:20schema/catalog,7display,24native causal,8bilingual UI.
Focused compatibility141/9files and final data/registry/Fury/new tests217/8 pass.
Engine7619/280 passes; strict types/lint/build pass. Final full14730/658files/
two existing skips, 531.839s wrapper; no full run interruption or restart.
Four production JS chunks are bridge-free; all756 precache URLs exist. Existing
whole-project build/test budgets remain exceeded; performance/PWA gates stay open.

## Production browser and saves

Four final public en/zh-CN ×360×640/1280×800 cases pass. They create/export/import,
preserve empty rank1 priority, allocate rank2 through Skills, select the active
skill, visibly cast two7/11HP attacks on the same original target, then Save,
close, open a new page and Continue. Eight exact before/after pairs preserve
player/inventory/map/mercs/formation, allocations and configured priority.
20geometry samples cover360×640,412×915,640×360,1280×800,1920×1080 with no
horizontal overflow and allocation targets at least44px.16final screenshots,
10individually inspected, show truthful description/Current/Next/count/bonus/
cost rows and mobile combat logs. Synthetic L30/resources/helmet and fixed
Date.now are explicit; ordinary timers and public controls remain. No private
store injection/test bridge or earned-play credit. Existing icon fallback and
full device/accessibility/PWA/performance acceptance remain open.

## Corrections and provenance

Retain initial22failed/27passed RED, first green8failed/41passed, UI RED8failed,
and three strict optional-field fixture errors. An independent raw PRNG/math
oracle corrects guessed inclusive second-roll/mitigation goldens; seed6 supplies
a real bonus-only critical control. Optional controls omit fields rather than
assign undefined. No mechanic assertion was removed or weakened.

Initial browser regex errors and two later server-loss Continue failures remain
with scripts, observations, screenshots, traces and terminal receipts. Actual
English uses attacks; Chinese matching must distinguish actor from target.
The first preview session was observed terminal143/PID absent/port closed before
restart; cause is unobserved. Final Chinese runs use the repository's owned
server/browser lifetime helper and both finish0 with servers stopped.

All1390source/test/config, three controlling design and760build hashes plus
historical HEAD3f73a53f and genuine digest remain exact through the final full.
Actual committed blobs/disk match `79d3311a`. Only Dragon Claw's inventory
row changes;212others and213IDs/order stay exact:106bounded-functional,
105unverified, one engine-only, one review-needed. Assassin9/30 locally bounded.
Independent/earned class, builds and balance acceptance remain open.

Separate [Blade Fury reproduction](d04-blade-fury-cone-repro.md) proves line-3
versus its cone promise in12native cases. Its intended exit1 grants no credit
and is separate from the passing required suite. The earlier borrowed cross
expectation failed before collection and remains identified as a harness error.

Genuine Ancients/Rite remainsL33/XP149261/nextNormal402/Nightmare0/Baal uncleared;
decompressed SHA256 remains
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
C0/C1 retain narrow exits; C2-C4/fullG0-G7/all-class earned builds/30–50hour
pacing/economy/endgame and independent acceptance remain unfinished. No genuine
campaign or remote action. Umbrella goal/branch/worktree/claim stay active.

[Raw archive](fixtures/dragon-claw/raw.tar.gz),
[member manifest](fixtures/dragon-claw/packet.json),
[committed audit](fixtures/dragon-claw/committed-source-audit.json) and
[cleanup receipt](fixtures/dragon-claw/cleanup.json) retain exact evidence.
Archive verified:237 raw members and25 terminal command receipts; SHA256
`b71e4609a3995c1d838c9e71a040ca64388de46b1e9a500b87e50a0ba11750d7`.
Cleanup removed997 exact task-owned files, including760 disposable build files;
all53 recorded owned PIDs are absent, port4494 is closed, and the scratch
directory is absent. Remaining paths/failures are both empty. The active
worktree/claim and shared caches are preserved.
Final validation (`fixtures/dragon-claw/final-validation.json`) checks the retained
archive, committed source, inventory, links, genuine save digest and cleanup.
