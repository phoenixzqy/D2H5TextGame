# D02/D07 — Earned equipment preparation before Act I progression

GD-DESIGN-REVIEW: APPROVE. TD-CONTRACT-REVIEW: APPROVE.
Producer plan READY; security pass.2026-10-23.

BUG090: “already equipped” means the same persistent item ID. Distinct owned
instances remain comparable/equippable even when their current stats are equal.
Keep ownership, eligibility, capacity and weapon/offhand rules. The old
base/rarity/affix-count identity gate has no supporting product contract.

After source and ordinary UI/save verification, run one prepared production-
service route from the original earned L12 save SHA
`8c46c4f4026116360356a2d17dcde3d723310969a25664f85bc291a1886d2afc`.
Failed diagnostic exports fund nothing. No further farming or build respec.

Prepare once before combat using existing owned instances and ordinary store
equipment actions. Hero first: legal one-handed weapon maximizing displayed
Attack, then shield, head, chest, belt, gloves, boots maximizing displayed
Defense. The selected cold spells do not scale with weapon Attack; a shield
is the intentional caster choice. Then Rogue: maximize weapon Attack, then
Defense for head/chest/belt/gloves/boots. Keep offhand empty with a two-handed
weapon. Retain current gear on equal score, otherwise lowest persistent ID.
Freeze every selected ID and the prepared save before any combat. Normal
jewelry has no effective upgrade here; assume no unowned MR/resistance gear.

Available owned ceilings include skull-cap14DEF, leather chest23DEF,
boots/gloves5DEF, belt4DEF, kite16DEF and weapon18Attack. Score normal owned
items through the authoritative equipment projection; this chooses preparation
without combat previews or an outcome-driven gear search.

One route: Blood Moor→Cold Plains→Burial Grounds→Dark Wood→Catacombs, same
seed2223645302/ordinals102–106/clock1792497600000. Frost Nova2/Ice Blast8;
Inner Sight→Pierce→Basic priority. All startup resources and between-wave carry
come from production policy. No further selection, allocation, resource commands,
seed search, retries or tuning. Stop at first refusal/nonwin/integrity failure;
record genuine prior rewards, input/source hashes, resources and final state.

This is earned-checkpoint integration, not fresh acquisition or C1 acceptance.
Success qualifies the corresponding fresh browser route. Failure requires
measured diagnosis; it does not automatically authorize tuning or farming.
Native UI routes must use normal generated inputs, with a declared clock, and
must never inject a seed/ordinal through a production debug bridge.
