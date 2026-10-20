# P02b04 — Paired fresh-earned Den screen

2026-10-20; input head `e65af7cccbc2d165380d280394e02fd287ed3630`.
Both frozen recipes fail at the one historical seed. Frost6/Fire1 clears Den
waves1–2 and loses wave3; Frost5/Fire1/Warmth1 clears wave1 and loses wave2.
Each result repeats twice. This accepts bounded measurement evidence only;
Den, Andariel, campaign, pacing, C0–C4/G0–G7 and full private v1 remain open.

## Frozen execution

Producer, QA and design independently reviewed the plan, fixture bytes,
conditional expectations and process deadline before execution. Exactly two
reports ran sequentially, A then B, with two fresh repetitions each at seed
`2223645302` and epoch `1792497600000`. The historical seed was selected before
execution; there was no retry, additional seed, farm, fallback gear, refill,
imported save, allocator reset or subsequent gameplay attempt.

Both recipes hire Inner Sight, learn Fire Bolt1, use Fire Bolt during40 Blood
Moor W1 preparations, and settle each win exactly once. Each installed W2 is
retained unplayed, then abandoned through native flee without award or clear.
After farming, both spend15Vitality/10Energy, equip the first acquired original
hero glove-defense5 and boots-defense3, equip the owned merc glove-defense4,
select Frost Nova/Fire Bolt, and accept Den. A spends five additional Frost
ranks; B spends four and one Warmth. Target ordinal40/manual/pity0 is explicit.

The replayable [A fixture](fixtures/p02b04-earned-screen/frost6-fire1-same40.json)
and [B fixture](fixtures/p02b04-earned-screen/frost5-fire1-warmth1-same40.json)
retain their frozen bytes. File SHA-256 values are respectively
`503d8f9f5c06c1a5ae768d3171830a331034321816d279eaaa5cf42a26fd18d1` and
`edff646e4954ba2fc2c55ee8baab8ce7e94d2396e010d8537ff21fdabde43221`.
These file hashes differ from the canonical fixture fingerprints in reports.
The frozen source-backed expectations hash is
`71bf7ea007bd9680c14e3464b90c107b2884c80671d9779663b4724165c34c26`.

## Observed earned state and outcomes

All160 attempted preparation waves win. Including160 installed unplayed W2 and
10 target waves, production computes330 battles, within the frozen336 maximum.
Each attempt earns11080heroXP,
8310mercXP,344items and5157shards; no preparation earns a full-area clear.
Hero reaches L6/XP67/next8818, with25attribute points and five post-Fire skill
points spent through ordinary actions. Ready core stats are10/25/25/45;
HP120/190, MP102/137, attack32, defense43, speed125, magic resistance0.
Native current resources survive stats/equipment changes without refill.
Merc is L9/XP249/next4404, HP196, MP79, attack25, saved defense26 and projected
defense30. Journal indices2/3/0 supply the three equipped original items.
A has9MP/s and no fire bonus; B has9.36MP/s and +1% fire damage.

| Recipe | Den outcomes | Last opening hero / merc HP | Last final hero MP / merc HP | Remaining enemies |
| --- | --- | --- | --- | --- |
| A Frost6/Fire1 | W1 win, W2 win, W3 defeat | 99 / 129 | 120 / 0 | 6;2189HP |
| B Frost5/Fire1/Warmth1 | W1 win, W2 defeat | 134 / 196 | 136 / 73 | 4;136HP |

In A, W1 awards270heroXP/202mercXP/four items/133shards, then W2 awards
400heroXP/300mercXP/50items/826shards/two wishstones. W3 awards nothing.
W1 final HP/MP134/112 feeds W2; W2 final99/129 feeds W3. Merc196HP feeds W2,
then129 feeds W3. In B, W1 awards270heroXP/202mercXP/four items/133shards;
W2 awards nothing. Hero134HP/114MP and merc196HP carry into W2. All terminal
clear lists remain empty and both Den objectives remain false/inProgress.

Design's read-only source/log inspection finds A's merc dies at7700ms and hero
at16940ms in W3, with hero mana never below116 and recorded incoming physical
damage. B's hero dies at21840ms with136/137MP; Shaman lightning contributes191
hero damage, including the final44. Native defeat is sticky on hero death
(`combat.ts:956`, `combatHelpers.ts:524`), even with a living merc. No runtime
defect is established by these failures. Kill timing changes orb recovery and
later RNG consumption; this comparison cannot establish universal build merit.

## Provenance and repetition differences

Root verifies the complete490-entry source manifest against disk and recomputes
source/data fingerprints. Each report's six source states match on all seven
identity fields. Source SHA is the input head; source tree hash is
`22396e94ffb82d5f9f9600d7ebaef999757192e6fa5e5e0ddfd841c5698ad39a`;
data hash is `7766fb8b85756c788d23119b45afd3e2fba0d596cd288966e2be0ece01ab87bd`.
Node is v24.21.0 and Vitest1.6.1. All22 accepted source/test/package/README/lock
baseline hashes remain unchanged. No game, data, harness, config or dependency
changes occur in this slice.

For both recipes, source, attempted recordings, abandoned recordings and
semantic rewards compare equal. Raw rewards, domain observations and full raw
replay compare unequal; original item identity differs and reward coverage is
exercised on both sides. Full recursive diffs are retained losslessly:

| Recipe | Total differences | Item identity occurrences | Distinct awarded item pairs | Sequence offset |
| --- | --- | --- | --- | --- |
| A | 39087 | 39085 | 398 | +398 |
| B | 38517 | 38515 | 348 | +348 |

Item identity occurrences include three explicit equip-action `result.itemId`
references per recipe, as well as Items' `id` fields. All retain matching RNG
prefixes. Each offset equals that attempt's total actual item awards, consistent
with the process-global allocator in `rollItem.ts:17–18`. The only other two
differences are repetition and adapter wall time. No normalization or reset
hides those differences.

The first extraction script rejects strict Python/JavaScript timing equality:
for A,1384.868 versus1384.8680000000002 logical seconds, and2377.837 versus
2377.836999999982 UI-hint seconds. An intermediate check retains exact report
values and uses an absolute1e-9 tolerance for recomputed floating-point sums.
QA independently reproduces both native timing fields exactly using sequential
addition; final extraction uses that accumulation order and exact equality.
A second
extraction rejects the three `result.itemId` references because its initial
classifier only recognized `id`; the corrected classifier includes only those
known equip-action result paths. Original scripts, failures, complete diffs and
successful final extraction remain archived. No gameplay rerun or runtime
change follows either extraction failure.

## Timing, validation and disposition

| Recipe | Complete report bytes | Logical seconds / attempt | UI-hint seconds / attempt | Adapter wall seconds, reps1/2 | CLI wall seconds |
| --- | --- | --- | --- | --- | --- |
| A | 123270009 | 1384.8680000000002 | 2377.836999999982 | 1.776550705 / 1.3973447770000003 | 12.611 |
| B | 121497444 | 1367.268 | 2342.360999999982 | 1.764127282 / 1.3733116609999998 | 12.560 |

Logical/UI measures include only attempted waves; installed abandoned W2 is
excluded. Neither measure is active human play duration. The30second outer
execution deadline and separately recorded2second termination grace were never
used: both subprocess groups exit0 normally, with no signals. Each CLI test
report contains one actual pass. The cap is administrative, not a performance
acceptance target. Disk availability was recorded before A and after A.

Final full unit has3151 actual passes/157 result files and zero other statuses,
exit0 in52.281seconds, exceeding the unchanged15second budget. Typecheck exits0
in22.254seconds; lint exits0 in53.848seconds, including57 engine test files
passing the purity check.
U/T/L ran concurrently; these timings do not establish performance acceptance.
No new build/browser/coverage run is claimed for static fixtures and evidence;
the previous P02b03 production build remains historical evidence only.

The [packet](fixtures/p02b04-earned-screen/packet.json) and
[compressed diagnostics](fixtures/p02b04-earned-screen/diagnostics.tar.gz)
preserve complete lossless reports, every repeat difference, frozen contracts,
exact execution commands, validation, source snapshots and attributed reviews.
Independent outcome/packet reviews and exact task-owned cleanup are recorded in
the closing ledger. The worktree remains claimed for the active full-v1 goal.

Next: reconcile first-act route intent with actual unlock behavior and define
the remaining active manual/idle measurement contract. Act I access currently
does not require Den; production idle does require an earned full clear.
W1/flee preparation does not qualify. These facts need an explicit reviewed
next card, with no ad hoc seed/build search or final balance tuning.
No push, PR, merge or deployment.

Archive SHA-256:
`729d02864c51bac76ef20ab6499b731d96d43b0804c7344f72fbd42a9fcc12ff`.
Packet SHA-256:
`f6f8f66cd79ecda66f9a6fe36751eece85c334663454c6035359fcee83cd79c6`.
The archive contains96 regular records, including36 source snapshots; all
264103971 uncompressed bytes were independently checked against the index.
