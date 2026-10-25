# BUG-206 — Show all Phoenix components in the skill summary

- Status: reproduced during BUG205 production visual review; repair pending.
- Severity: Medium — accurate component rows exist below a misleading summary.
- Source: frozen1383source/test/config snapshot for the in-progress Assassin
  Fire verification; historical HEAD0e1eecd0 predates the uncommitted repair.
- Environment: production Chromium, en/zh-CN,360×640 and1280×800, Save22.
- Owner: root; independent acceptance and earned balance remain open.

## Reproduction

1. Create/import the disclosed synthetic L30 Assassin with the real Phoenix
   prerequisite chain, select Phoenix and allocate rank2 through the public UI.
2. Open its Skills detail panel in either locale.
3. Compare the leading description with the three actual damage rows and the
   real selected cast's Fire/Cold/Lightning events.

Expected: the summary identifies all three components, shared hit/critical
roll and component-specific effects; damage per element is44–64at rank2.

Observed: English says “Phoenix Strike:44 ~64Fire damage.” Chinese says
“凤凰攻击：造成44 ~64点火焰伤害。” The same panel correctly lists Fire, Cold
and Lightning44–64each, total132–192, and Fire-component-only Burn. Actual
native combat also produces all three components, so the leading summary
describes only one third of the advertised hit.

Root cause: `SkillsScreen.dynamicDescription` renders composite prose only for
Vengeance. Phoenix falls through to the generic first-damage-row summary.
The pure display model already exposes the required typed ranges and shared
roll/control metadata. Use that model for a general composite summary instead
of adding another class-specific exception. Preserve existing charge/build
acceptance requirements; this prose repair cannot credit Phoenix's whole skill.

Retained evidence will be in `docs/plans/evidence/fixtures/assassin-fire/`,
including the first24-case production matrix and screenshots:
`browser-en-mobile/en-360-phoenix-strike-description.png` and
`browser-zh-mobile/zh-CN-360-phoenix-strike-description.png` under `scratch/`.
The current full suite must terminate before editing its frozen source; do
not interrupt/restart that run. Add a failing bilingual summary assertion,
apply the UI fix, then validate the final source/build and repeat affected
production cases. No genuine campaign or remote action is authorized here.
