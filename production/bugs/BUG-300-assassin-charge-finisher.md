# BUG-300 — Implement real Assassin charge-up and finisher combat

Status: Reproduced; prospective runtime/compatibility passes, branch integration and public/whole-feature acceptance pending.
Severity: High — advertised charge mechanics have no functional path.
Build: adc8528b9f144cf4387cee8a91cc336dcae03ff4.
Environment: Vitest/jsdom native player projection, both locale-independent runtime paths; seed7. Constructed resources/target/stun bounds; no earned progression claim.

1. Project a legal level30 Assassin with rank1 or20 Tiger Strike and Dragon Talon.
2. Select Tiger then Talon. Give100MP,100Attack Speed and zero recovery; hold the target and stop owner actions after6800ms.
3. Run actual immutable recorded battle and compare same-seed replay/plain battle.

Expected: three successful charge-building attacks reach a finite cap, then allow the configured finisher to release useful stored charge power; preserve the existing three independent Talon attempts and one cast payment.
Actual: four Tiger actions at1700/3400/5100/6800ms; zero Talon actions and no charge state or payoff. MP88 instead of87. Rank1/20 both fail; uncharged Talon control passes12attempts/fouractions/16MP. Exact inputs and HEAD unchanged.
Evidence: charge-native-baseline.{json,log}, assassin-charge-native.test.ts in this task. Source: src/data/skills/assassin.json scalar charge rows; src/engine/combat/combat.ts chooseSkillForState/canUseSkillForState/applyEffect; en/zh skill descriptions promise charges; docs/plans/design-decisions.md D05 requires actual advertised behavior.
Affected systems: engine-dev, content-designer, frontend-dev/writer previews and qa-engineer. Root sole executor under umbrella authorization.
Root cause: no paid finite martial charge state, cap-aware readiness, finisher discharge or real Cobra recovery. Scalar hits and inert status names cannot establish the promise.
Workaround: select Talon first for ordinary uncharged kicks; charge-up fantasy remains unavailable.

Prospective implementation passes17state/authority+22native+172existing compatibility=211cases outside the repository. Original failures and all external corrections retained; full branch/preview/lifecycle/public proof remains required.
