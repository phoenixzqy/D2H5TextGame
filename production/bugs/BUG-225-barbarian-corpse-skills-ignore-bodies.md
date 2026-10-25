# BUG-225 — Require real bodies before corpse searches or Grim Ward

- Status: reproduced; corpse/outcome and no-potion adaptation contracts open.
- Severity: High — three advertised corpse skills pay without any body to use.
- Owner: root, engine/data/UI; independent design/QA and earned balance open.
- Build: `98ad7970` plus frozen warcry-control implementation; these three
  skill definitions and their generic self-buff/debuff routes are unchanged.
- Environment: Node24 native combat, seeds7/19/41/97, legal native L30Barbarian
  ranks1/2/20; no browser viewport. Both locales advertise corpse searches or
  a corpse-created ward. The game invariant prohibits red/blue potion items.
- Affected systems: Find Potion, Find Item, Grim Ward, shared corpse supply,
  recovery/material outcomes, finite fear and truthful descriptions.

## Reproduction

1. Allocate each skill and its full native prerequisite chain, then prioritize it.
2. Declare synthetic million-HP/100MP pools,200Attack/100Defense, hero100Attack
   Speed and enemy50Attack Speed. Hold the hero only after2701ms.
3. Run each rank/seed case. The first hero action is1700ms and the first enemy
   action is2000ms. No unit dies at any time, so no eligible corpse can exist.
4. Verify unchanged inputs/exact replay. Retain all36observations before the
   deliberately failing final assertion. No state is treated as earned.

Expected: a corpse-dependent skill cannot cast, debit MP, start cooldown or
produce an effect with no eligible body. A successful future implementation
must consume the shared body exactly once and yield its explicitly defined
recovery/material/ward consequence. Find Potion needs a no-potion adaptation
before implementation; its name does not authorize adding prohibited items.

Actual: all36cases cast at1700ms and debit MP despite zero deaths/bodies. Find
Potion/Find Item produce self markers; Grim Ward produces an enemy marker,
with no spawned ward and ordinary enemy actions still occurring at2000ms.
No corpse consumer exists for these generic effects. This reproduction proves
the missing body gate; it does not establish earned economy or outcome tuning.

Evidence: `next-corpse-skills-probe.ts`, `next-corpse-skills-observations.json`
and its intentional failed terminal receipt in the retained
[warcry-control packet](../../docs/plans/evidence/fixtures/barbarian-warcry-control/packet.json).
No repair, skill credit, genuine campaign action or remote action.
