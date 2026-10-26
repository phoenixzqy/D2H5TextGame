# BUG-244 — Apply paid Decrepify to attack cadence and outgoing damage

- Status: locally fixed and verified; independent design/QA and earned balance remain open.
- Severity: High — an advertised active skill pays but grants neither promised effect.
- Owner: root, engine/content/frontend; independent design/QA and earned balance open.
- Base:30e2e9a2; Node24.21.0, Vitest1.6.1, actual native player adapter/registry/recorded engine.
- Browser/viewport: engine reproduction, no browser claim; locale-independent numerical rules.
- Seed:1; real native learned ranks1 and20 with actual transitive prerequisites.

## Reproduction

1. Run src/stores/necromancer-decrepify.causal.test.ts.
2. Native L30 Necromancer acts once400ms with exact20MP/rank1 or14MP/rank20.
3. A fixed100-Attack enemy withAS250 acts until4500ms; no mitigation/critical/other attacks.
4. Compare paid curse to matched caster-held control, preserving seeded rolls and pools.

Expected: advertised50% AttackSpeed and33% direct damage reductions change actual scheduler and HP. The explicit provisional [contract](../../docs/plans/decisions/D04-decrepify-v1.md) adds authored3000ms duration; its phase-preserving expected attacks are700/2200/3500/4000/4500, damage67/67/miss/100/100, total334HP. This duration is a new author choice, not recovered source authority.

Actual: paid action and debit occur, but enemy still attacks500ms increments through4500 with ordinary100damage on each hit, total700HP, exactly matching the uncursed control. Status is a bare marker400–1400ms with no potency. Ranks1/20 both fail time/damage/HP/payload assertions; five ownership/resource/cooldown/uncursed controls pass.

## Evidence and root cause

Terminal decrepify-red-fixed:2failed/5passed,7.198s,exit1. Raw decrepify-red-fixed.log/.json are retained in /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-decrepify-ncbcsyhx-retained.tar.xz; the original scratch directory was removed after verification. Root owns retention/removal through BUG244/full-v1 consumers; exact cleanup and sibling records are linked in the evidence below. LogSHA2565ce50f82ced85c7d2765ea46ff6778db6bdd43b8dc5b0c0b1c9cc0c5ae96e1c3.
Initial test-only alias expectation was corrected: native priority retains authored ID until engine action lookup canonicalizes. Original decrepify-red log/receipt remains; gameplay expectations/seed were not weakened.

JSON has only appliesStatus:decrepify and no authored duration/modifiers. dataCatalog emits only the generic marker, unknown status defaults1s, and neither effectiveActionPeriod nor outgoing-damage projection consumes Decrepify. Repair the complete authored payload and existing shared scheduler/damage consumers; do not fake a buff by mutating base stats or editing test expectations.

Workaround: another implemented control skill may help, but does not make Decrepify functional. No genuine campaign/replay, dependency, save22 or remote change. Full C2-C4/G0-G7/privatev1 and independent/earned acceptance remain open.

## Local resolution

The complete strict authored metadata now grants a copied finite paid packet.
Existing cadence and direct-damage consumers use it without mutating base stats
or changing unrelated skill definitions. Refresh, expiry, Cleansing and native
authority/resource guards retain their ordinary semantics. Both locales expose
actual duration, reductions, mana/CD and current/next/MAX rules.

93new regressions pass, including original causal ranks1/20. Final full17283
tests/783files/two existing skips, engine8553/320, types/lint/build/precache/bridge
and four final production-browser cases pass. Browser proof covers actual
casts/chips, victory and exact Save/ordinary+offlineContinue; numerical damage
and cadence are asserted by native/engine tests. Screenshot clipping, runtime
budgets and independent/earned acceptance remain open.
[Evidence, raw retention and cleanup](../../docs/plans/evidence/d04-decrepify.md).
