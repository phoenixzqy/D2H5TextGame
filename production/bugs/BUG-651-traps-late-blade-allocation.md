# BUG-651 — Continue Traps Blade investment after finite early targets

Status: Fixed / verified for allocation; earned Act IV remains incomplete.
Severity: Medium. Owner: root (campaign allocation policy).

## Reproduction

Native Node/WSL; browser, viewport and locale independent. Working HEAD
`b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, production tree
`2afb8a4d83a2b445f4cee5ed36b5e1f8c042232c87eec5967a44413340bdd83d`.
Retained prefix `p15-traps-earned-act4-v1` in external packet
`d2-counted-source-z3jj3xa1`; see the
[checkpoint](../../docs/balance/2026-11-03-traps-act4-checkpoint.md).

1. Continue canonical `assassin-traps-intended-v1` from earned Act III47/685.
2. Spend the existing29training admissions and three Plains attempts.
3. Inspect first Izual admission714, index4, run seed3335028484, and terminal
   native export49/717.

Actual: Lightning20/Blade8/CBS12/Web6/FireBlast5 saturate all profile targets;
five earned skill points remain held despite legal Blade purchases. All three
Izual attempts draw with the hero alive and mana available; Izual retains
3,448/1,598/4,221Life. No route clear or Act IV claim.

Expected: continue selected physical-field investment with available native
points after existing targets are met. Preserve prerequisites, prior target
order, both trap signatures, all earned ranks and finite retry budgets.

## Root cause and bounded correction

`growCampaignBuild` fills declared targets only. The profile's last Blade target
is8 despite native cap20 and continued skill-point income. Append Blade20 after
all existing targets, without changing production skill formulas or the native
allocator. BUG636's earlier target-order correction and earned route remain
historical; this changes the later target contract, not its earlier evidence.

Before adoption, focused RED/GREEN native allocation cases must verify
sequential/batched growth, conserved points, monotone ranks, unchanged XP,
reset counters and other save domains, idempotence and the existing early
physical/lightning delivery. Scoped strict types and explicit lint must pass.
An optional isolated diagnostic is limited to one retained first Izual control
and one candidate with natively paid ranks; no seed search, route replay,
reset, retry renewal, reward or population/pacing acceptance.

Affected systems: campaign growth config and its allocation regression tests.
Frozen acceptance/baselines: `p15-traps-late-blade-v1-plan.json` in the same
root-owned packet. No new agents, dependencies, commits, pushes or publication.

## Resolution — 2026-11-03

Append Blade20 after all earlier targets. Seven affected allocation/delivery/
identity cases pass;161unrelated cases filtered. Scoped strict types and
explicit lint pass. Exactly one unchanged retained Izual control matches every
event and final party field, then a candidate with five native purchases
(Blade8→13/points5→0) wins at46,477.800407331975ms. All other save fields and
battle inputs are conserved. No earned route/reward claim or retry renewal.
Original diagnostic type failures are retained and corrected before battle.
See [result](../../docs/balance/2026-11-03-traps-late-blade-allocation.md) and
`p15-traps-late-blade-v1-closure.json` in the retained root-owned packet.
All2,151production inputs unchanged; exactly two campaign inputs change;
all recorded processes/config/cache absent. Full v1/balance remain incomplete.

## Earned Act IV continuation — 2026-11-04

[Current native continuation](../../docs/plans/evidence/p15-traps-post-allocation-act4.md)
spends five existing points Blade8→13, then wins all18waves through Izual, River
and Diablo. Exact rewards/three claims and49/next720 save reconcile. Original
29training and714–716draws remain spent; no additional training/retry. This
validates earned continuation on current product inputs, without isolating this
allocation fix from every intervening change. ActV and broader balance remain open.

The [direct ActV continuation](../../docs/plans/evidence/p15-traps-direct-act5.md)
also wins all33waves on five first admissions720–724. Exact50/next725 successor,
all19ActV actions/five claims, Baal title and Nightmare unlock reconcile. No
training/retry. Intended Traps Normal path complete; broader balance remains open.
