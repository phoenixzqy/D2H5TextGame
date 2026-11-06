# Mercenary XP policy — polynomial late progression

Date: 2026-11-04. Type: Tuning. Owner: root.
Status: selected for local implementation; earned pacing and balance remain open.
References: [hero/reward policy](kill-xp-policy.md), [progression](progression-curve.md),
F08/P15 in `docs/plans/playable-target.md`; BUG-709.

## Problem and decision

The current `floor(60*L*1.3^(L-1))` mercenary cost assumes exponentially growing
monster rewards. Actual later rewards and hero costs grow as level^2.5. At
mercenary31 the old next-level cost is4,873,191XP; at82 it is8,344,045,038,748XP.
The mismatch progressively stops earned mercenary advancement. It is not proof
that any particular stalled hero route needs stronger mercenary stats.

Retain exact costs through18, the existing kill-reward growth anchor. Above18,
use the same2.5 exponent as the hero/reward curves, anchored to the old18 cost.
This preserves introductory pacing and removes exponential divergence with one
shared correction, rather than increasing rewards or buffing individual mercs.
It serves Competence and party progression; recruitment/economy effects still
need earned evidence. No conflicting mercenary cost spec was found; the old
canonical rationale is in `mercStore.ts`.

| Knob | Before | Selected | Category |
| --- | ---: | ---: | --- |
| basePerLevel |60|60|early feel|
| earlyGrowthBase |1.3|1.3|early curve|
| growthStartLevel |none|18|curve anchor|
| growthExponent |exponential everywhere|2.5 above18|late curve|

## Exact rules and compatibility

Author these four knobs and identity in `src/data/progression/merc-xp.json`.
For `L=max(1,level)`, `a=18`, and `early(x)=floor(60*x*1.3^(x-1))`:

```text
mercXpForLevel(L) = early(L)                      when L <= a
mercXpForLevel(L) = floor(early(a)*(L/a)^2.5)      when L > a
```

Preserve fractional-input behavior, integer rounding, the75% XP share, existing
growth/stat rules, recruitment and supported99-level arithmetic. Do not introduce
a hero-level mercenary cap. Invalid input behavior is outside this correction.
Schema ranges: base integer1–100, early base1–1.3, anchor integer1–90, exponent1–3;
all fields required, no unknown fields. These bounds keep supported1–99 costs safe.
Register the schema with existing browser precompilation and load it with actual
Ajv validation and an immutable policy, following the kill-XP loader.

Existing explicit saved thresholds stay authoritative until consumed. Add/read,
non-leveling awards and manual upgrades do not rewrite legacy/custom thresholds.
After crossing one, calculate the next threshold with the new curve, carrying
excess XP normally. Missing progress uses the owned mercenary's current level.
No saved XP, levels, histories or version are rewritten; no migration is needed.

## Evidence and bounded acceptance

Independent arithmetic in external packet `d2-merc-xp-policy-n89no0k9` gives
new costs19=106945,31=363648,50=1201440,82=4138203,99=6627735.
A hypothetical merc receiving75% of cumulative heroXP from1 reaches37 under
the old curve at hero82, versus84 under the selected curve. This is arithmetic,
not an earned campaign result, pacing proof, or entitlement to backfilled XP.

Before edits, record BUG-709 and obtain a real failing native-store regression.
Then validate exact early/late anchors, monotonic/safe costs through99, late
fielded sharing and spillover, inactive exclusion, and old-threshold preservation
through add/read/manual-upgrade/crossing. Use real registered Ajv for positive,
missing/unknown/invalid data cases. Run only these affected store/data tests,
scoped strict types and explicit lint. No campaign, retry, training, browser UI
replay, broad suite/build, install, agent, commit, push or publication.

Plan review: ready. Legacy thresholds can delay benefits but preserve the save
contract; tests must cover that rather than silently normalizing them. Numeric
success does not satisfy six unfinished routes or formal balance0/210.
Security check: pass. Authorized local JSON/TS/docs/tests only; no secrets,
network, dependencies, permissions, CI or historical save mutation.
