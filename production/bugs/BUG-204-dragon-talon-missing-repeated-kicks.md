# BUG-204 — Dragon Talon promises repeated kicks but attempts one hit

- Status: reproduced and contracted; implementation and functionality credit open.
- Severity: High — both locales advertise a series of attacks absent from runtime.
- Environment: Node24.21.0, actual native Assassin/default registry via Vite Node.
  Synthetic L30/resources/holds/opponent; no genuine campaign action.
- Seeds7/19/41/97, native ranks1/2/20, one1700ms action and4MP payment.
- Owners: root acting as content/engine/design/QA; independent acceptance open.

## Reproduction

1. Project an L30 Assassin with only actual Dragon Talon selected and allocated
   at rank1,2 or20 through `playerToCombatUnit`.
2. Use synthetic HP2000/MP100, zero regeneration/Defense/resistance/dodge/crit,
   one living held target and a hero hold beginning1701ms after one action.
3. Record actual action/payment/damage/final HP; require immutable inputs and
   exact replay, then require more than one attack attempt per accepted cast.

Expected: the existing English “A series of rapid kicks” and Chinese
“一系列快速踢击” have multiple real independent attempts. The descriptions do
not specify an exact count; that belongs to the explicit design contract.

Actual: all12casts make exactly one attempt and pay4MP once. Rank1 damage for
seeds7/19/41/97 is41/46/0miss/44; rank2 is45/50/0miss/48; rank20 is117/122/
0miss/120. Final target HP is2000 minus the sole attempt; hero MP96. No
`hitSequence` exists in the registered damage effect.

Root cause: the actual JSON authors one ordinary Physical damage effect and no
sequence metadata; the schema confines sequence ownership to Fury and Jab.
Localized prose cannot add a combat attempt. No runtime fix has been applied.

Evidence: [native reproduction](../../docs/plans/evidence/d04-dragon-talon-repro.md)
and [contract](../../docs/plans/decisions/D04-dragon-talon-v1.md). The reproduction
uses the frozen Jab verification source; this is a separate failing diagnostic,
not a failure of the required unit suite or a new functionality credit.
