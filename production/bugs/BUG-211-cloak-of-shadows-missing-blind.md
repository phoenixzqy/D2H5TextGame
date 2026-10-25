# BUG-211 — Paid Cloak of Shadows never applies its declared Blind

- Status: fixed locally in `f08311cb`; independent design/QA and earned balance open.
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
The original reproduction preceded repair and skill credit; its observations
remain unchanged. No genuine campaign or remote action.

## Local repair and verification

[Author contract](../../docs/plans/decisions/D04-cloak-of-shadows-v1.md) explicitly
defines provisional8s personal Cloak/all-current-hostile Blind,3% Defense/rank
and preserves the paid critical/dodge metadata. Runtime/presentation/tests are
committed in `f08311cb`. The adapter emits the self buff and actual Blind;
immutable finite potency survives wave carry/respec without changing base stats
or persistent saves. Native rank/resource/registry and carry validation apply.

Regression files: `src/engine/skills/cloak-of-shadows-schema.test.ts`,
`src/engine/skills/cloak-of-shadows.test.ts`,
`src/stores/cloak-of-shadows.causal.test.ts`,
`src/stores/cloak-of-shadows-native.test.ts`, and
`src/features/skills/SkillsScreen.cloak-of-shadows.test.tsx`.
All53 new cases pass; engine7734/286 and full14928/671/two existing skips pass.
Types/lint/build and four bilingual production mobile/desktop cases pass.
Causal tests prove actual hit/mitigation/critical/dodge outcomes, not resting
Defense alone. [Delivery evidence](../../docs/plans/evidence/d04-cloak-of-shadows.md)
records the exact proof, failures, limitations and cleanup. Local skill credit
does not establish earned balance or independent acceptance.
