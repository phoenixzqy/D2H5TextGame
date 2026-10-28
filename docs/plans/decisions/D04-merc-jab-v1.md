# D04 — Native Act II mercenary Jab

Scoped mercenary-v1 contract reviewed by producer, 2026-10-28. Independent
earned balance, browser and feature acceptance remain open.

## Behavior and provenance

`docs/design/gacha-spec.md` §4.1 advertises three physical hits and +50% physical
damage. All six authored Act II mercenaries configure `mskill-jab`. The old
registry stub implements only flat 18–28 damage. This decision restores the
advertised sequence and explicitly chooses the previously unspecified Attack
baseline and stacking rule; those details are new mercenary-v1 reconciliations.

Each of three sequential ordinary attempts uses authored flat 18–28 plus 100%
of current combat Attack. JSON `mercJab.physicalDamagePct: 50` adds 50 percentage
points to the usual increased physical damage sum. Convert percentage points
to a fraction once in the immutable skill resolver. Apply combos, independent
hit/base/critical rolls, resistances, Defense and minimum damage normally.
For flat 20 and Attack 100, a landed noncritical attempt deals 180 before
mitigation. With another +30% physical increase it deals 216, not 234. With
zero Attack, flat 20 still becomes 30. The skill bonus never modifies Attack
or benefits another skill, basic attack, retaliation or periodic damage.

Reuse the existing bounded hit sequence against the one originally selected
enemy. Every attempt independently resolves ordinary hit/critical RNG. Stop
when that target dies; do not retarget a replacement. Attacker death, including
reflection, also ends the sequence. One action and cooldown commitment pays for
the whole sequence. Preserve authored cooldown 1s, zero MP cost, unlock 1/cap 20
and no rank growth. Higher skill rank does not invent an unadvertised scaling
curve. Signature-first priority and passive qualification remain unchanged.

## Implementation and limits

Use a validated exact-ID resolver and immutable copied damage/sequence/tag
metadata, a true active registry definition, closed JSON tuning and narrow
schema authorization for `mskill-jab`. Remove only its superseded alias stub.
An optional effect-level increase enters the shared damage input with a zero
default. Existing player Amazon Jab and other effects retain their behavior.
No additional combat loop, RNG stream, save state or transient unit stat is
needed. Recorded attempts use ordinary native damage events and playback.

Acceptance includes the actual loader → factory → projection → default registry
for all six mercenaries, literal arithmetic and additive stacking, zero MP,
actual cooldown opportunities inside and at the boundary, misses/criticals,
mitigation, early death/reflection, unchanged sibling skills/basic attacks,
immutable deterministic replay and public playback convergence. Exact numeric
oracles must include Holy Freeze's existing Chill/physical combo when present.

This contract grants no acquisition, browser, earned campaign, pacing, economy,
build-matrix or full-v1 acceptance. H3 and protected-content/closed-policy limits
remain unchanged; no browser retry or replacement gameplay experiment follows.
