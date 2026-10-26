# D06 — Blood Golem life-leech aura

2026-10-26, baseline`de803c76`, BUG250. Provisional root-author interpretation;
independent design/review/QA and earned balance remain open. Delivered locally
in`aeb19477`/`aa33b6b7`, with exactly one bounded credit after completed proof,
lossless retention and verified cleanup. [Original native RED](../evidence/d06-blood-golem.md).

## Controlling sources and intended complete behavior

The old skills-spec§3.2 names a legacy `necromancer.corpse_attracter` row Blood
Golem, with an always-on10% life-leech aura. Both current Blood Golem locale
literals promise10% of damage dealt returned as life. Current authored
`skills-necromancer-blood-golem`/`necromancer.blood_golem` is a native paid summon;
accepted D06 preparation defines selected legal learned startup,25MP once per
wave,cap1,L18/Golem Mastery prerequisite,rank1–20,4s resulting cooldown and no
replacement/refund. That contract expressly leaves other summon effects open.
Do not create a phantom213th-plus skill or grant free unslotted power from the
legacy row/name; implement the advertised aura through the actual paid body.

Implemented provisional v1 interpretation: while an authoritative paid Blood Golem
and its original owner live, original friendly hero/merc/summon damage sources
restore their own life equal to10% of actual hostile HP removed, rounded down,
capped by missing life. The body is an aura source, not the sole beneficiary.
The10% comes from existing promises; party scope/rounding/settlement details are
explicit provisional author choices, not recovered independent design authority.

Cover direct basic/skill/component damage, actual periodic damage with a living
original source, and ordinary reflected/reaction damage. Do not silently narrow
"damage dealt" to one body attack or one element. Converted original enemies do
not gain original-party aura benefits. No benefit on misses, absorption without
HP loss,overkill beyond actual lost HP,friendly/self tradeoffs,resource debits,
healing itself or fabricated damage. Heal only a living actual source, after
ordinary damage/death/orb/reflection settlement; never resurrect or overwrite a
later resource snapshot. Floor below1 gives zero; no invented minimum-one leech.
Multiple qualified bodies do not stack the10% aura. It adds no timer/action/RNG/
MP payment/CD beyond existing startup and ordinary damage/healing consumers.

## Authority, data and lifecycle

Reuse the accepted native class/unlock/prerequisite/selection boundary and fresh
rank projection. Exact original registered source/living original player hero/
integral matching native rank must qualify new paid body bindings. Revalidate
living original owner/body/template/source on benefit. Borrowed/malformed bodies,
unpaid imports/preloads,bare names/statuses,changed generic source and invalid
rank/owner identities grant no new aura. Keep generic synthetic preparation and
all unrelated recovery paths intact; eligibility is not inferred from a heal log.

Move the existing complete Blood Golem base stats to immutable validated JSON
unchanged, alongside authored10% leech. Preserve rank growth14life/2Attack/1Defense,
mastery/resistance composition,identity/positions/seeded hit/crit/cadence and
existing death/orphan/refund rules. No save-version/selected-item/corpse debit.
Fresh waves reconstruct eligible authority/current rank from native configuration,
carry actual absolute resources without refilling, and preserve current recordings.
Import reconstructs from legitimate saved skills/order, not transient bonus fields.

## Root-fix plan and counterexamples

Initial plan review:revise. A spawn-only proof, a generic positive heal assertion,
or adding a fixed heal to a body action would not implement the full aura. The
original five-case RED is diagnosis only; it must be strengthened by literal
source/beneficiary/percentage/damage-kind/lifecycle controls before skill credit.

Revised order:

1. Preserve original RED and file BUG250 before production edits.
2. Define immutable JSON-owned unchanged stats and10% coefficient; qualify actual
   paid body/native owner authority using existing patterns, without a new generic
   summon/status framework.
3. Feed actual hostile HP loss from existing direct/periodic/reflection settlement
   into one bounded leech consumer and existing positive capped healing publication.
   Avoid rolled-damage estimates, duplicated independent recovery engines or RNG.
4. Prove literal100HP removed→10HP recovered,cap/rounding/overkill/absorption,
   hero/merc/body/other friendly summon,all supported damage sources,unpaid/full/
   poor/dead/orphan/changed-source/owner/rank refusals and no recursive healing.
   Preserve actual seeded input immutability/recorded/unrecorded/A-A/A-B-A agreement.
5. Prove native allocation/current recording/next-wave rank+absolute pools/import;
   render truthful bilingual unlearned/current/next/MAX aura and body rows, with
   metadata-owned values and explicit recipient/living-source/payment rules.
6. Run focused/engine/full/types/lint/official build/bridge/precache and actual
   en/zh-CN desktop/mobile public heal/body/save/ordinary+SWoffline Continue proof.
   Inspect screenshots, freeze actual source/build,retain failures/results losslessly,
   verify exact task-owned cleanup, then credit exactly Blood Golem.

Plan review:ready for this complete scoped repair under the stated provisional
interpretation. Root author review is not independent approval. Security check:
first-party local diagnostic/code/data only; no new dependency/credential/permission/
CI/network/save authority. No imported transient power, genuine campaign/replay,
remote publication or worktree reset/release. Full C2-C4/G0-G7/privatev1 stays open.

## Settlement review before implementation

Author plan review:revise→ready. Static Field bypasses ordinary direct settlement
and must feed its actual HP loss into the same recovery consumer. Aggregated DoT
has no source on its existing playback event: keep its HP-ms integral, total HP
loss and event shape unchanged. For recovery only, divide actual HP removed among
contributing status sources in proportion to each source's DPS×overlap during the
settled interval; assign indivisible HP by largest remainder, breaking ties in
original source order. Unknown/dead/hostile sources retain their share but cannot
heal; never redirect it to eligible sources. This allocation/rounding is an explicit
provisional author interpretation. The consumer re-reads living units after all
ordinary deaths/orbs/reflection/self-debits, preventing resurrection/stale pools.
Multiple paid sources are a boolean aura, never an additive multiplier.


Paid Battle Command carry counterexample: original learned Blood Golem1/20 can
prepare an effective rank2/21 body. Binding checks the learned native rank after
subtracting the actual private paid +1, and keeps that learned authority after
Command expiry; body growth remains the existing paid effective potency. Bare
bonus markers still grant nothing. This is required by the existing temporary
rank contract, not a new permanent rank cap or bonus-source fallback.


## Local delivery

The linked evidence retains all original REDs/corrections and final97new tests,
engine8875/333, full17749/812/two existing skips, types/lint/official build/bridge/
precache and four production desktop/mobile locale cases. Eight exact six-domain
save pairs/four actual offlineContinues/20geometry/16individual PNG inspections
include explicit visual limits. Local functionality is verified; root author review
is not independent approval. Earned balance, remaining summons and full v1 stay open.
