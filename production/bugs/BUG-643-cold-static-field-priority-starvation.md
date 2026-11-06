# BUG-643 — Resolve Cold progression timeout with competing skill priorities

Status: Locally resolved for intended Normal progression by invested Blizzard growth; wider balance/independent acceptance remains open. Retained order and owned-weapon comparisons stay rejected.
Severity: High (intended build progression); owner: root / game-designer.

## Reproduction

Working tree based on`b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, production
hash`12ce40578164070e187a017daa00c91d15a209bacbd258f17817bfea94e1a88d`.
Native Node campaign; browser/viewport/locale not applicable. From verified
Cold Act IV61/896 continue unchanged intended growth through Act V preparation.
At level73, farm Crystalline Passage, ordinal1060, runSeed2387820806, wave3;
wave seed is runSeed XOR`4*0x9e3779b1`, converted to uint32.

1. Use the retained wave's exact initial parties, resources and skill order.
2. Resolve the seeded60s battle with the production combat engine.
3. Inspect hero actions and surviving enemies. Native reproduction is retained.

Expected: Blizzard/Frost Nova remain the Cold build's finishing attacks; Static
Field supplies support without monopolizing slowed turns.
Actual:60s draw;18 enemies survive with294–723HP. Hero1104→767HP, mana770
at entry/end; actions Static Field16, Blizzard1, Frost Nova1. Prayer had died
earlier in this admission and is correctly absent, not a continuity defect.

## Evidence and suspected cause

[Verified checkpoint](../../docs/balance/2026-11-03-cold-act5-checkpoint.md).
Packet`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`,
prefix`p15-cold-earned-act5-v1`: native report/journal/export and passingV3reader.
Original costs, draw and exhausted200-admission preparation limit stay owned.

`tests/campaign/intended-growth-v1.json` puts Static Field before Blizzard and
Frost Nova. `chooseSkillForState` uses first eligible priority; under slow/chill
the short Static cooldown can be ready on every turn. Static Field scales from
current health and cannot finish a target. The intended identity requires
Blizzard/Frost Nova as later signatures, with Static Field as boss support.
Affected systems: intended campaign profile and native combo regression.
No production coefficient or selection-engine defect established.

Candidate: retain Frozen Armor first, then Blizzard, Frost Nova, Static Field,
Ice Blast and Ice Bolt. Compare once against the exact failed input, changing
hero order only; require exact original events/final parties and a living-hero
candidate victory before adoption. No seed search or renewed earned allowance.


## Diagnostic outcomes — 2026-11-03

The original control reproduces exact events and final parties. Candidate one
(Frozen Armor, Blizzard, Frost Nova, Static Field, Ice Blast, Ice Bolt) still
draws at60s with12survivors; hero940HP/770MP. Blizzard11/Nova8/Static1 loses
necessary percentage-health support. One documented causal refinement places
Static between Blizzard and Nova; it also draws at60s, with2frozen terrors
remaining at1121and75HP, hero1207HP/763MP, Blizzard11/Static9/Nova5.

Both candidates fail the declared living-hero victory condition and are rejected.
Three diagnostic battles total, including the exact control; no earned admission,
source change, renewed preparation allowance or balance acceptance. Retained
packet prefixes`p15-cold-finishing-order-v1` and
`p15-cold-supported-blizzard-v1` include the amended plans and failed results.
No further order tuning on this snapshot. These results establish a rotation
tradeoff, not a sufficient fix or a production damage/selection-engine defect.

## First actual Ancients attempt — 2026-11-04

[Direct suffix evidence](../../docs/plans/evidence/p15-cold-direct-act5-suffix.md)
continues the earned73/1224save without training, retry or order change. Four
waves win; wave5draws at60s, runSeed46170775/index4. Hero1326→1125HP and
750→770MP;12enemies remain. Hero casts22Static Fields,4Blizzards and2Frost
Novas. Prayer dies in the preceding wave and is correctly absent in this one.
The terminal earned successor is73/next1225, with16inherited actions and no new
claim. Exact retained-output accounting passes after an independently recorded
reader-only optional-field correction; no combat replay. Throne remains
unattempted. This adds an actual route failure; it does not adopt a fix or
renew the original200training allowance or rejected diagnostic variants.

## Actual Ancients input diagnostic — 2026-11-04

[Two-battle diagnostic](../../docs/plans/evidence/p15-cold-ancients-order-diagnostic.md)
reproduces all 3174 original control events and full final parties. Moving
Blizzard immediately before Static increases Blizzard casts 4→12 and reduces
survivors 12→3, but still draws at 60 seconds. Remaining elite Frozen Terrors
have 522/765/859 HP; hero 1222 HP / 767 MP. Candidate rejected; no order adopted.
Original raw/grid-position preflight failure occurs before combat and is
retained alongside the corrected native projection. Both diagnostic battles
are consumed and closed; no further tuning on this snapshot. No native
admission, preparation renewal, source behavior change or balance credit.

## Owned-weapon diagnostic — 2026-11-04

[Owned audit and single retained-wave comparison](../../docs/plans/evidence/p15-cold-owned-weapon-diagnostic.md)
compares140eligible weapons without combat, then evaluates the highest-ranked
Rogue's Bow once. Native gear projection raises speed125→155 with documented
defensive/mana tradeoffs. Original priority/enemies/seed are preserved; previous
exact control is authenticated rather than rerun. Candidate still draws60s,
with three Frozen Terrors at292/213/424HP; hero1289HP/746MP, Static16/Blizzard9/
Nova7. Rejected; no policy adopted or native admission. Both packets are closed,
costs/failure retained and cleanup verified. No further tuning/replay or renewed
original200-training allowance. No production damage/selection defect established.

## Prospective invested-Blizzard tuning — 2026-11-04

[New numeric decision](../../docs/plans/decisions/P15-blizzard-investment-growth-v1.md)
addresses the scalar finisher's rank growth: Blizzard8→80 damage per rank,
referenced to Meteor's existing80 at the same unlock/coverage/cooldown. This is
new authoring, not a reclassification of the historical engine/selection findings.
Rank1, MP35, cooldown4s, Chill and all other JSON fields stay exact. Focused paid
native regression must go RED before the edit and pass afterward. No retained
encounter replay or campaign admission belongs to this tuning slice. The genuine
Cold successor remains73/next1225; all closed preparation/diagnostic budgets
remain spent. Status stays Open pending legal native progression and wider balance.

[Local result](../../docs/balance/2026-11-04-blizzard-investment-growth.md): applied
only8→80; corrected paid-hit RED then84unique affected passes, scoped strict types
and explicit lint. Original discovery/penetration-estimate errors retained.
Campaign successor/closed budgets unchanged; no native completion credit.

## Legal native progression result — 2026-11-04

[Post-growth evidence](../../docs/plans/evidence/p15-cold-post-blizzard-act5.md)
continues actual73/next1225 with original priority and earned gear. Corrective
Ancients1225 and first Throne1226 win all15waves; observed74/next1227 completes
Normal, all main quest claims, Baal title and Nightmare unlock. Separate route
and merc-domain readback/accounting pass; exact temporary cleanup is verified.
No farming/training, extra retries or reopened ordering/equipment comparisons.
The one numeric authoring change resolves this retained intended progression
failure locally. This does not establish an old selection-engine defect or
population/holdout/fairness/pacing acceptance. Historical failures stay recorded.
