# D04 — Sorceress direct lightning attacks

2026-10-25; root sole writer/reviewer. Source/tests/contract `c8510388`.
Four skills receive bounded functional verification. Independent design/QA,
earned builds and balance remain open. [Contract](../decisions/D04-sorceress-direct-lightning-v1.md).

## Actual behavior

Charged Bolt independently attempts the first two prioritized living enemies;
Lightning attempts one; Nova attempts every living hostile. Chain Lightning
now starts at target priority and bounces to the nearest unvisited enemy by
Manhattan grid distance, preserving priority on ties and unknown-position
fallback. It reaches up to five distinct targets, including sparse/overflow
rosters, and continues after misses or lethal hits without replacement/revisits.
The example design's Cone label is explicitly adapted to the promised actual
chain; independent design acceptance remains open. This is not a fixed footprint.

Existing Lightning damage/growth and MP/cooldown are unchanged: Charged Bolt
25–40/+3,8MP/1s; Lightning45–80/+6,15MP/1s; Nova40–60/+4,18MP/2s;
Chain50–70/+5,25MP/2s. Pay once per cast. Lightning resistance then flat MR
mitigate hits; Defense does not. Native Lightning Mastery, crits and global
Chill synergy compose through the existing damage pipeline. Only Chain has
authored Paralyze among these four.

Fresh landed Chain hits apply existing1s Paralyze, including bosses, and a5s
residual marker. Repeat application during that marker retains50% acceptance.
BUG232's rejected application previously emitted successful-affliction feedback.
The pure status API now exposes unit/applied while preserving its old unit-only
wrapper; damage and debuff emitters report actual acceptance with unchanged RNG,
state and payment. No log-renderer exception or duration tuning is introduced.

Only Chain's geometry/cap changes in production skill JSON; the other29object
spans are byte-exact. Strict identity-specific schema, shared cap selection and
illustrative legacy registration align. Both locales show actual recipients,
damage/payment and Chain control at unlearned/current/next/MAX. Thunder Storm's
periodic identity and other remaining skills are separate and uncredited.

## Verification

192new tests: grid9, registration/schema/display36, explicit status results12,
native causal combat95, allocation/wave/import8 and bilingual React32. Rank1/2/20
and fixed seeds7/19/41/97 use an independent numeric oracle for exact recipients,
HP/MP, misses, mitigation, mastery, crits, Chill, control and status feedback.
Empty/small/duplicate/tie/missing-position pools, dead/friendly/lethal boundaries,
native class/unlock/prerequisites/ranks/aliases, resource/cooldown refusal,
immutable input, replay, runBattle and playback parity are covered.

Corrected compatibility343/4 includes all292actual loader cases. Broad engine
passes8018/300 before two test-only lint-typing corrections; the affected119/2
then pass, preserving assertions. Final types/full lint/build/bridge-free static
scan and actual-output Workbox precache checks pass. Existing large-bundle and
generated-art manifest cache warnings remain; required application assets cache.

Final quiet full:15935passed/721files/two existing skips, wrapper615.843s.
Other task processes stop first, with4513closed. Frozen1459source/config/test/
contract files and761build files stay exact; every frozen source Git blob matches
the delivered commit. Save22 and genuine Ancients401 remain unchanged.

## Public browser and persistence

Four final groups pass: en/zh-CN ×360×640/1280×800 ×four spells=16cases.
Public creation/export/import uses declared syntheticL30, legal prerequisite
ranks, a resource helmet and fixed Date.now. Each skill allocates1→2, selects
ordinary priority and visibly casts Lightning damage with an MP decrease;
Chain also requires localized Paralyze feedback and a visible enemy status chip.
No browser store bridge is present. Diagnostic resources prove mechanics and
public flows, not earned balance, campaign pacing or build viability.

32ordinary exact five-domain Save-close-fresh-page-Continue pairs and16actual
network-disabled fresh-page Continues pass.80five-size geometry checks show
zero horizontal overflow and allocation buttons≥44px.48screenshots remain;
four final views were individually inspected: English mobile Charged Bolt,
English desktop Lightning, Chinese mobile Chain details and Chinese desktop
Nova combat. Mobile lower rows scroll; existing missing navigation glyphs remain.
Full accessibility acceptance is open.

## Failures, evidence and limits

Original targeting/grid/schema/UI/status REDs and actual exit receipts remain.
A guessed nonexistent combo effect field was corrected to assert authored Chill
synergy metadata, with real global combo behavior independently tested. The
first timing fixture incorrectly required a tied enemy to wait before a status
that landed later; its recording proves the enemy acted first and changed hit
RNG. The corrected400ms cast interrupts the900ms action, expires1400ms and allows
1800ms action for all three tiers. The initial1000ms period arithmetic error also
remains as a failure. No scheduler, timeout, tuning or assertion is weakened.

The first broad engine run retains8009passed/ninefailed: stale unit-only API
spies and old three-target Chain expectations. Poison Mastery now asserts actual
two-stack potency/source/expiry, Lightning Mastery preserves exact RNG/status/
identity through the explicit result, and the item-grant fixture reaches all
four available enemies. Existing complete neutral Thunder Storm recording stays
unchanged. Lint failures and typed matcher corrections remain. One browser pilot
failed only because its harness expected uppercase Lightning in the lowercased
damage log; the exact failed harness, report/screenshot/full trace are retained.
An intermediate typecheck wrapper terminated143 without a child receipt; its
cause remains unproven and it is not a pass. The final current-source typecheck
exits0; both the observation and the final receipt remain separate.

[Packet](fixtures/sorceress-direct-lightning/packet.json),
[terminal checks](fixtures/sorceress-direct-lightning/terminal-results.json),
[browser audit](fixtures/sorceress-direct-lightning/browser-audit.json),
[save pairs](fixtures/sorceress-direct-lightning/save-pairs-audit.json),
[source delivery](fixtures/sorceress-direct-lightning/source-delivered.json),
[inventory](fixtures/sorceress-direct-lightning/inventory-audit.json) and
[cleanup](fixtures/sorceress-direct-lightning/cleanup.json) retain proof.
Only these four skills gain credit;209other CSV rows and213IDs/order stay exact.
Totals135bounded/76unverified/one engine-only/one review-needed; Sorceress19/30.

Genuine campaign remainsL33/XP149261/nextNormal402/Nightmare0, Ancients/Rite
claimed, Baal uncleared; decompressed SHA256 remains
c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577.
C0/C1 retain original exits. C2–C4/fullG0–G7/213skills/two earned builds per class/
30–50active-hour pacing/economy/endgame/complete privatev1 remain unfinished.
No genuine campaign or remote action; umbrella goal/worktree/branch/claim active.

Sorceress direct-lightning retention/cleanup terminal: 378 raw archive members and 37 terminal command receipts retained and verified; one interrupted wrapper observation remains separate. Cleanup removed 1139 exact task files, including 761 build assets. All 113 recorded PIDs and 6 browser profiles are absent; port4513 closed, scratch absent, remaining[]/failures[]. Source/history, retained evidence, shared caches/tools and umbrella worktree/branch/claim remain. Independent/earned/full-private-v1 acceptance stays open.
