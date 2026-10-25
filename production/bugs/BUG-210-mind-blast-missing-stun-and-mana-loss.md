# BUG-210 — Mind Blast drops Stun and Mana Burn never consumes mana

- Status: locally repaired and verified; independent design/QA and earned balance open.
- Severity: High — two advertised effects have no corresponding native result.
- Environment: Node24.21.0; actual default registry/native L30 Assassin,
  synthetic opponents/resources and fixed seeds; pure engine, no viewport.
- Owner: root; independent design/QA and earned balance remain open.
- Affected systems: authored skill adapter, shared Mana Burn combat settlement,
  recorded mana playback and skill presentation.

## Reproduction

1. Learn actual Mind Blast and its recursive prerequisites at ranks1/2/20;
   configure only Mind Blast via native playerToCombatUnit.
2. Give caster100MP and nine held2000HP/100MP enemies; hold the caster after
   its first accepted action. Run seeds7/19/41/97.
3. Retain all12 cases, checking immutable replay, one action/30MP payment,
   per-enemy direct HP and mana, actual status events and registered effects.

Expected: landed hits apply both Mana Burn and Stun. The skill table and both
locales explicitly promise them. combat-formulas.md §9.6 requires targets to
lose20% of damage dealt as mana; its zero-mana behavior also needs review.

Actual: the registered damage effect has only applyStatus:{id:'mana-burn'};
the secondary Stun is discarded. All12 cases emit Mana Burn markers and no
Mind Blast Stun event, while all nine enemies retain100MP. Seed7 ranks1/2/20
deal558/603/1413 total direct HP damage; caster mana100→70. The diagnostic
collects all cases before its intended exit1 on missing Stun. Held opponents
already have synthetic Stun; the evidence concerns emitted skill application
events and registration, not a claim about their action timing.

Root causes: dataCatalog.ts forwards only selected secondary statuses and
omits Mind Blast's Stun. Shared status.ts defines Mana Burn as a flag; there is
no mana debit. combo.ts provides a separate existing20% Arcane bonus against
the marker, which does not fulfill the mana-loss requirement. Do not claim
Mana Burn is entirely inert or fix it only by changing the description.

Before repair, record exact shared mana-debit/rounding/absorption/death/recording
semantics and resolve the distinct marker-combo versus zero-mana bonus rules.
Preserve current IDs, Arcane identity, learning authority, one30MP cost/CD3,
unlock24/cap20 and Cloak of Shadows prerequisite. No source patch or skill credit
is included in this reproduction.

See [evidence](../../docs/plans/evidence/d04-mind-blast-repro.md).

## Local repair and verification

Runtime/presentation/tests/contract commit a1b847f9 forwards ordered Mana Burn/
Stun and implements shared JSON-owned actual-HP mana loss, pre-hit zero-MP
Arcane amplification, restoration lifetime and affected monster skill lockout.
The separate existing combo and boss scaling remain. All98 new cases and the
225-case compatibility set pass; engine7705, full14875/666files/two existing
skips, types/lint/build and four production locale/viewport cases pass. Eight
exact five-domain Save-close-Continue pairs and20geometry checks are retained.
Synthetic fixtures earn no class/build/balance credit. See
[repair evidence](../../docs/plans/evidence/d04-mind-blast.md).
