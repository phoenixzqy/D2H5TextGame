# BUG-211 — Paid Cloak of Shadows never applies its declared Blind

- Status: reproduced; contract and repair open.
- Severity: High — the principal advertised control effect is missing.
- Environment: Node24.21.0, actual JSON/default registry/native L30 Assassin;
  ranks1/2/20 ×seeds7/19/41/97; synthetic held opponents/resources.
- Owner: root; independent design/QA and earned balance remain open.
- Affected systems: pure-debuff registration, combat control and skill display.

## Reproduction before repair

Learn actual Cloak and its real Psychic Hammer prerequisite; configure Cloak
alone through playerToCombatUnit. Give the caster100MP, hold it after its first
1700ms action, and provide one held2000HP enemy. Record all twelve cases,
immutable exact replay, action/payment and status events. The probe writes all
observations before intentionally failing its final Blind assertion.

Expected: the authored ordered cloak-of-shadows/Blind pair produces real Blind.
Both locales promise blinding enemies and a defensive benefit. The defense
coefficient, recipients and paid lifecycle require a controlling contract before
repair; the existing active skill also contains crit/dodge scaling metadata.

Actual: all twelve cases emit only cloak-of-shadows. Blind events are zero.
The registered effect is solely {kind:'debuff',statusId:'cloak-of-shadows'};
dataCatalog.ts discards the secondary Blind in its no-damage debuff branch.
The engine applies that marker, so the earlier inventory warning suggesting no
pure-debuff consumer is too broad. Native resting Defense is107 with and without
Cloak at each tested rank; this alone does not prove a paid temporary defense
comparison. Held opponents mean this probe does not establish causal hit-chance
or action-delay effects. No damage or healing occurs; one action and one MP
payment per case are preserved. Costs observed are13/13/11MP at ranks1/2/20.

See [reproduction evidence](../../docs/plans/evidence/d04-cloak-of-shadows-repro.md).
No runtime patch, skill credit, genuine campaign or remote action.
