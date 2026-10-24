# D08 — Finite Nightmare affix envelope

BUG153 follows the equipment eligibility repair: actual Nightmare rewards reach
item level102, while all16 authored affixes stop at99. Magic/rare items then
have no bonuses, and caster-amulet preflight refuses an otherwise legal source.

Extend only the last tier's `ilvlMax` from99 to102 in each of the eight prefix
and eight suffix definitions. Keep all IDs, tier indices, minima, rolled-value
ranges, applicability and rarity weights unchanged. There is no new power tier.
The supported envelope remains finite;103 has no legal affix tier. Future
difficulty/content beyond102 requires its own reviewed contract.

Do not clamp source levels, add roller fallbacks or mutate historical items.
Existing item instances retain their saved affix payloads; no migration or
retroactive repair is involved. Crafting retains the same item identity/source
level and pays its normal costs through the existing receipt boundary.

Validation: causal RED before data edits; continuous1–102 tier eligibility for
every authored affix; production magic/rare rolls over every affixable base at
99–102 with legal kind/count/value checks; real caster recipe at99–102 with
cost/identity/replay/immutability checks; finite103 exclusion; actual Ajv2020
schema validation; parsed exact16-field diff and lower-level before/after
materialization comparison. Run focused/engine/full units, strict types, lint
and production build. This establishes affix eligibility, not acquisition
rates, useful upgrade frequency or full G4/build/economy acceptance.

Plan review: ready. The finite bound comes from the existing campaign/replay
planners; both item generation and crafting consume this same authored pool.
Security check: pass; local content/regression changes, no dependencies,
credentials, network, permissions, CI or publication. Root self-review only;
independent acceptance remains open.
