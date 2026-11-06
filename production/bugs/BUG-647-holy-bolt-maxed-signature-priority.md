# BUG-647 — Give the fully trained Holy Bolt signature priority over its bridge

Status: Locally resolved for earned five-act Normal progression; population balance and independent final acceptance remain open.
Severity: High (intended build progression); owner: root / game-designer.

## Correction — 2026-11-03

Latest earned follow-up, 2026-11-04:
[Holy Bolt completes Normal](../../docs/plans/evidence/p15-holy-bolt-merc-survival-normal-completion.md).
One owned Prayer helmet replacement and native lossless inventory staging precede
Ancients913/first Throne914:15/15victories, all Claims, Baal title and Nightmare
unlock. Separate raw save/journal/points/reward readback passes; actual53/next915.
The preceding physical damage agrees with existing rules; no engine tuning or
new order override is adopted. This supersedes the older partial Act V frontier
below; wider balance/full-v1 acceptance remains open.

Earned follow-up, 2026-11-04: [Act IV clear and partial Act V](../../docs/plans/evidence/p15-holy-bolt-act4-and-act5-checkpoint.md).
River906/Chaos907 clear and both rewards are claimed; all13 Act IV actions
complete. Act V's first three areas clear; Ancient's Way911 wave4 draws and
Throne remains unattempted. Exact save is level52/next912; retained readbacks
and closure pass. No training/retry or renewed historical allowance. The
healthy-hero draw establishes remaining dense-wave throughput risk, without
establishing a production engine defect or wider balance acceptance.

[Decision and evidence](../../docs/plans/decisions/P15-intended-holy-bolt-signature-priority-v1.md):
the sole frozen order candidate wins in 36.054 seconds with full hero life/mana;
the control reproduces the retained draw exactly. Intended Holy Bolt now opts
into target-rank signature promotion, retaining the early Hammer bridge.
The two genuine RED wrong-order cases pass after correction. All 23 selected
regressions, scoped strict types and explicit four-file lint pass.
Regression: `tests/campaign/intended-growth.regression.test.ts` (Holy Bolt
signature, early bridge and opt-out cases). No commit was made this turn.
No production skill/engine change, route replay or preparation renewal occurs.

## Reproduction

Working tree based on `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`.
Native Node campaign; browser/viewport/locale not applicable. From verified
Holy Bolt Act III level 47 / next 675, the unchanged Act IV run clears Izual at ordinal 705
and later draws in Plains training ordinal 736, runSeed 3214698541, wave 4.
Battle seed is `(runSeed ^ (5 * 0x9e3779b1)) >>> 0`.

1. Use the retained wave's exact initial parties, resources and learned ranks.
2. Resolve with Hammer > Holy Bolt > Sacrifice and the original battle seed.
3. Inspect the 60-second outcome and hero skill actions.

Expected: after Holy Bolt reaches its declared target 20, the intended primary
signature uses available turns before the earlier Hammer area bridge.
Actual: Hammer 20 casts and Bolt 19 casts; a healthy draw leaves Izual at 7,146 HP.
Hero life1049, final mana540, minimum mana 515; this is not mana starvation.
Holy Bolt 20 has base 2,520–2,540 versus Hammer 20 base 288–318 (all-enemy/MR bypass).
The legacy fallback then spends 169 Dark Wood admissions and exhausts River's
200-entry preparation limit. Hellforge/Diablo remain unattempted.

## Evidence and proposed diagnosis

[Verified checkpoint](../../docs/balance/2026-11-03-holy-bolt-act4-checkpoint.md).
Packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`,
prefix `p15-holy-bolt-earned-act4-v1`: native report/journal/export and passing
first frozen V1 save/accounting readback. The original native run establishes
reproduction; the next comparison must reproduce every event and final party.

Affected systems: intended campaign combo preparation and regression. No
production skill/engine defect is established. The declared Hammer-first order
continues after completion of primary-spell investment. Retain the early bridge
order below Holy Bolt's final target and all profiles without explicit opt-in.

The prospectively frozen comparison permits exactly one original control and one Holy Bolt > Hammer > Sacrifice
candidate on the retained input. Require exact control and living-hero candidate
victory before adoption. Plan SHA256:
`752693bf9962ed0e65c244e03129187d967e6fda0f28337ef22c62370362202a`.
No second candidate, seed search, route replay or renewal of exhausted allowances.
The genuine successor remains 52 / next 906, native-export SHA256
`8d29b835e070deb68604e1b20d16d684f7f8740172b0915117899275b5e0fcec`.
Dense-wave populations, earned continuation and formal balance remain open.

Security check: pass; local deterministic diagnostic/profile scope, no new
dependency, credential, network, CI, permission or save-format change.
Plan review: ready for this bounded diagnosis; a win alone is not population
acceptance. Native-growth boundary, actual casts/damage/mana and opt-out
regressions are required before any profile correction.

## Later offensive-aura frontier — 2026-11-04

[Current earned frontier](../../docs/plans/evidence/p15-holy-bolt-conviction-act5-frontier.md)
supersedes the52/next912checkpoint: one genuine late-aura skill reset and bounded
Ancients912admission wins four waves then draws on wave4. Exact terminal is
52/next913,1,059Life/549Mana; one15,585Life champion remains after38Bolt casts.
Prayer died in wave3. Throne remains unattempted. Separate raw save/reward/quest
readback passes. Signature-priority correction stays valid; dense Act V viability
and final acceptance remain open. No completed-act replay or renewed closed trial.

## Dense-wave order candidate rejected — 2026-11-04

[Exact retained comparison](../../docs/plans/evidence/p15-holy-bolt-dense-order-rejection.md)
runs one original control and one Hammer-first candidate at Ancients912 wave4.
Both draw at60seconds. Candidate leaves two champions/17,828combinedLife versus
one/15,585Life for the original. No order/profile override is adopted. The
original verifier-shape error was resolved by reading the retained complete
control, without replay. Separate raw readback passes; allowance is closed.
Earned52/next913 and counts14ActI/10Normal/formal0of210 remain unchanged.
Prayer's preceding-wave death motivates survival investigation; no production
defect, equipment correction or further gameplay is established here.
