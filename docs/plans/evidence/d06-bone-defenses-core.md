# D06 — Bone Wall and Bone Prison integrated local verification

Code head `bdc747b83d8de15fa49724bb823b5ff6d1de68b5` implements the
provisional [contract](../decisions/D06-bone-defenses-v1.md). Both original
paid-effect failures are now repaired locally. Independent design/reviewer/QA,
earned-build balance and full-v1 acceptance remain open.

## Delivered behavior

Bone Wall pays for one source-bound 6000ms barrier with capacity
40 + 10 × (effective rank − 1). It absorbs hostile damage after mitigation,
Cyclone and Holy Shield, before Energy Shield and Bone Armor. Direct, composite,
reflection, Static and periodic settlement and lethal prediction use the same
remaining pool. Dodge/zero damage cannot consume it; expiry, exhaustion and wave
carry cannot replenish it. Paid Battle Command supports effective rank21 while
actual learned allocation and prerequisites remain necessary.

Bone Prison pays for an all-living-enemy 2000ms action trap, reduced to1000ms for
boss/chapter-boss. It interrupts channels at onset while already-launched
non-channel spells continue. Bare markers, malformed paid state and unlearned
combo slots grant neither defense nor control. Existing rounding is preserved:
rank1/20 Wall costs17/13MP, Prison27/23MP; both cooldowns4/3.0s. Native allocation,
next-wave authority, carry, unlocked/locked replay and save/import are covered.
Save version22 is unchanged; paid pools/traps remain transient.

Bilingual current/next/MAX previews describe actual capacity/duration and boss
control. Combat shows translated Prison and a beneficial blue Wall chip with
remaining capacity. Presentation and test-only fixes are recorded in BUG263–268.

## Observed evidence

Original native seed7 Wall/Prison failures remain retained. The corrected paid
Wall causal branch ends100000HP versus99975 without its paid pool and marker;
37damage was absorbed after an actual17MP cast. Removing only a marker is no
longer a valid counterfactual after paid pools were implemented. The paid Prison
branch permits0enemy actions versus1without its trap after an actual27MP cast.
These controlled synthetic comparisons prove causality, not earned balance.

New canonical coverage:119Wall engine cases,88Prison engine cases,21display
cases,24SkillsScreen cases,2CombatScreen cases and5native integration cases.
Final engine9382/352 PASS156.990s. At the frozen integrated code head, full
`npm test` PASS:18359tests/845files, two existing opt-in skips, wrapper848.172s
(Vitest846.53s), exit0. Strict types105.978s, lint182.939s, official production
build/bridge13.979s and756URLprecache0.216s also pass. Existing build warnings
remain; no test/config/timeout was weakened.

Production canonical combat4/4 PASS43.143s and additional visible-chip4/4
PASS48.601s cover en/zh-CN at360×640 and1280×800. Actual casts, Wall
capacity40→36→35→33, live Prison appearance/expiry, retained learned ranks after
Flee and absent transient paid state in export pass with zero console/page errors.
Public MP includes regeneration: exact costs come from native evidence, not its
net MP delta. The earlier unchanged skill-preview source has4/4 PASS89.516s:
keyboard allocation0→1→2, legal rank20,40geometry checks across five sizes,
eight exact seven-domain save pairs and four actual service-worker offline
Continues. That preview run was at `a1871ddd`; later combat-chip changes do not
alter its source. Broad PWA/performance/a11y acceptance is not implied.

All12canonical and16additional combat originals were individually viewed;
16preview originals were reviewed previously. Initial mobile combat screenshots
clip lower chips below the fold; additional scrolled active-card/viewport
captures show Wall35 and Prison. Mobile detail captures show descriptions and
current values but crop the heading/lower next rows. These limits are explicit;
DOM chip visibility alone does not establish action suppression.

The [integrated packet](fixtures/bone-defenses/integrated-checkpoint.json)
verifies31feature paths against committed blobs, all4893frozen tracked files,
762build files,115terminal log receipts and the protected earned save. The
[historical Prison-only packet](fixtures/bone-defenses/core-checkpoint.json)
is preserved unchanged. Original schema/oracle/typing/native replay/browser
fixture failures and the interrupted prior full run remain retained. The latter
has wrapper exit143 and no supervised npm terminal result; it is never counted
as passing. BUG268's malformed cap was corrected only with socketCapacity0;
the importer correctly rejected the original. One failed pre-full audit doubled
a dist prefix; its corrected audit passed before launch on unchanged inputs.

## Remaining work and retention

No new inventory credit yet:167bounded-functional/44unverified/one engine-only/
one review-needed; Necromancer25/32. Author tests/review cannot provide independent
acceptance. Earned builds/balance/feel, C2–C4, full G0–G7 and private v1 remain
unfinished. Genuine L33/nextNormal402/Ancients-Rite claimed/Baal uncleared and both
protected save hashes are unchanged. No genuine campaign/replay, remote action
or delegation occurred.

Root retains active raw task
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-bone-defenses-6z98386v`
and task-owned build
`/home/felixzhao/.zai/profiles/anonymous/worktrees/D2H5TextGame-human-worktree-2/dist`
for remaining summon browser/native consumers and final evidence retention.
The full-unit process is terminal exit0; these paths are still active, not
cleanup-complete. Root owns lossless archive/read-back and exact disposable
cleanup once all consumers finish, before inventory credit. The umbrella
worktree/claim and original full-v1 goal continue.
