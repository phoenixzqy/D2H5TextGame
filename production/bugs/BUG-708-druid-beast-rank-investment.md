# BUG-708 — Restore meaningful invested beast Attack growth

Status: Locally resolved for intended five-act Normal progression; broader balance and independent acceptance remain open.
Severity: High (intended Summon Druid progression).
Owners: game-designer/content-designer; root implements locally.

## Reproduction

HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus inherited human2 edits.
Native production-store engine recording; browser viewport/locale not applicable.
Retained reproduced failures: `d2-counted-source-z3jj3xa1/`
`p15-summon-druid-earned-act4-v1.{json,journal.jsonl.gz,native-export.json}`
under `/home/felixzhao/.zai/profiles/anonymous/zai-temp/`.

1. Inspect original earned admissions714–716, without rerunning them.
2. Owner49 has Spirit Wolf10, Dire Wolf10, Grizzly20 and Heart1.
3. Izual has363 Defense and50% Physical resistance in all three failures.
4. Spirit Wolves land110/116/123 ordinary noncritical hits for220/232/246damage.
   Hero survives; each fight draws at60s. Actual successor is49/next717.

Expected: allocating additional ranks to the main beasts materially improves
their authored Attack contribution while retaining rank1 and paid batch rules.
Actual: nine Spirit Wolf ranks add18Attack; owner-level growth contributes672.
Spirit/Dire/Grizzly base Attack is710/907/1302 and ordinary hits2/104/307.
This is a numerical design gap, not an engine failure to honor existing data.

## Proposed correction and evidence

[Decision](../../docs/plans/decisions/P15-druid-beast-investment-growth-v1.md)
changes only three per-rank Attack coefficients to their existing per-owner-level
growth:14/18/25. Costs, caps, owner growth, utility summons and saves stay exact.
The focused constructed reproduction uses seed7 and permanent fixture stuns to
isolate newly paid native pets; it grants no earned progress or balance approval.

Required packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-druid-beast-ranks-uq48qqum`.
`retained-attribution.json` pins the original records and summarizes all three
boss fights; `plan.json` freezes the correction before edits. No closed attempt,
ordering, gear, training or diagnostic budget is renewed.

## Local implementation result

Only the three planned production fields change. New regression first fails
on invested710/907/1302Attack; six rank1/armor controls pass. After the edit,
36selected native-hit, paid-batch, owner-growth and preview checks pass, including
actual58/178/522ordinary damage. Three edited rows pass actual Ajv validation.
Scoped strict types and explicit four-test-file lint pass. The initial rejected
deprecated cache CLI flag is retained separately from the valid RED run.
During the numeric correction, no native admission occurred; earned49/next717
and8/14Normal stayed unchanged.
No commit is created; see [verification](../../docs/plans/evidence/p15-druid-beast-investment.md).

## Earned Act IV continuation — 2026-11-04

[Prospective fixed continuation](../../docs/plans/evidence/p15-druid-post-beast-act4.md)
uses actual49/next717, original Oak8/Heart1, Prayer and canonical earned growth/
equipment. Plains717, first River718 and first Chaos719 all clear:18/18waves,
three Claims, actual consumed Soulstone/hammer, and Act V unlock. Izual's boss
wave takes41.940s; Diablo's takes11.800s. No training, retry, respec, gear trial
or replay of original714–716. Independent final balance acceptance stays open.

Retained-output reader V2 verifies custody/economy/points/party/quests/time/seeds/
ordinals without replay after V1's wrong-domain optional-field error. Earned
successor is49/next720;8/14Normal remains unchanged pending Act V. Both errors
and successful checks are retained, and required evidence stays root-owned at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-druid-post-beast-30t57dif`.


## Earned Act V continuation — 2026-11-04

[Fixed route and retained closure](../../docs/plans/evidence/p15-druid-fixed-act5.md)
records720–723:24wins/one Ancients60s draw, three Claims and resistance scroll
Read. Actual50/next724; Throne not entered. Oak10/Heart1 source is exact.
Grizzly ordinary431→291under Shout,9293direct damage; Dire83→1 and Spirit1
match authored mitigation. Hero ends full1245life/643mana. No new selector/engine
defect or additional tuning is established. Correction remains provisional;
Normal completion and independent balance acceptance are still open. Required
packet `d2-druid-act5-b99gu3d4` is root-retained; exact cleanup passes.


## Earned Normal completion — 2026-11-04

[Native reset, Ancients and Throne evidence](../../docs/plans/evidence/p15-druid-heart-normal-completion.md)
records the actual free reset at level50/next724:61ranks refunded/reallocated,
skill allowance3→2, stat allowance3 unchanged, zero currency. Heart20/Oak1 replaces
Heart1/Oak10. Ancients724 wins7/7waves and first Throne725 wins8/8; both native
Claims, all five Act V main Claims, Baal title and Nightmare unlock reconcile.
Successor is level50/next726;852,382heroXP and151items earned. Separate raw-journal/
save/reward arithmetic readback passes. Prayer31→32→33 also advances naturally;
this route does not isolate Heart's causal contribution. The legacy-threshold
canonical XP projection artifact is explicitly reconciled in the evidence.
BUG708 is locally resolved for this intended Normal route; formal balance0/210,
population viability, pacing and independent acceptance remain open. Required
packet d2-druid-earned-heart-6kb0j4ix and human2 remain root-owned through unfinished
umbrella review. Eight recorded PIDs/four caches absent; no completed-act replay.
