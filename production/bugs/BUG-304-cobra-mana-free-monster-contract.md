# BUG-304 — Resolve Cobra recovery against mana-free monsters

Status: Open — conflicting design contracts; user decision pending. No label/status applied to any forge item.
Severity: High — positive public Cobra MP transfer is unreachable with ordinary PvE monsters.
Build: fc915ddd3834b0927affa5843365620ff0bcef71; source unchanged by test-only7bcaaefd.
Environment: native actual allocation/equipment/Catacombs probes; production Chromium desktop1280×800/en Tiger control. No Cobra browser-mana acceptance yet.

## Reproduction

1. At fixed2026-10-27T12:00:00Z create the documented constructed level30 Assassin.
2. Use real allocation/priority/equipment and start areas/act1-catacombs.
3. Inspect native enemy resources: every factory monster has mana0/manaMax0.
4. A Cobra release can heal actual missing HP but cannot debit positive enemy MP.

Expected: D05-assassin-martial-charges-v1 requires positive public actual victim MP debit and equal caster credit; no fabricated reward.
Actual: combat-formulas.md §11 explicitly requires mana-free monsters, and monster-factory.ts sets both capacities/current MP to0. Ordinary monster JSON/type/schema have no mana pool. D04 Mind Blast supports affected0MP monsters and does not change construction.
Evidence: charge-public-native-probe/cadence/waves logs and12-case final receipt in /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-assassin-charges-zt17emhc; src/engine/combat/monster-factory.ts mana fields; docs/design/combat-formulas.md resource-pool policy; docs/plans/decisions/D05-assassin-martial-charges-v1.md and D04-mind-blast-mana-burn-v1.md.
Affected systems: game-designer/technical-director/content/engine/QA; root sole executor.
Root cause: acceptance requires a victim resource that the explicit PvE contract omits. This is not a debit/credit primitive defect: native constructed positive/zero/partial transfer cases pass.

## Decision and next steps

An asynchronous user question offers JSON-defined spellcaster mana pools (recommended) or a deliberate redesign of Cobra recovery while keeping monsters mana-free. The first changes monster data/schema/construction and potential AI/resource interactions; the second changes the reviewed transfer contract and copy. No answer is inferred, positive MP requirement is not dropped, and enemy resources are not injected into browser state.

Continue independent charge/public/trap work. After the decision, document the selected contract before implementation, reproduce the selected unmet behavior, keep zero-MP controls and exact bounded transfer arithmetic, and run native plus production browser validation. No skill/campaign/balance/private-v1 acceptance is claimed here.
