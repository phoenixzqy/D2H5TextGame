# BUG-311 — Show compact summons' actual remaining mana

Status: Locally resolved — source13967ef9; integrated d9447414. Independent and whole-app acceptance remain open.
Severity: Medium — skilled shadows exhaust their own finite MP without visible combat resource feedback.
Build: 478b91d4a2f1c1f06b8f4ca5c7db4d33b7d726dc.
Environment: Vitest jsdom/RTL compact CombatScreen; en/zh-CN. Browser360×640/desktop verification pending. No engine RNG dependency; no fixed seed needed for this rendering defect.

## Reproduction

1. Render a compact player-side summon with actual mana63.5/max100 and stale stats.mana999.
2. Observe its named compact unit group and query localized MP/法力 progressbar.
3. Compare with the full card's existing mana support and the shadow contract's own100/150MP pool.

Expected: a summon with its own mana capacity exposes truthful localized current/max MP and live exhaustion alongside HP, allowing a player to understand fallback to basic attacks.
Actual: compact cards render only HP; both locale tests fail at the absent MP bar. This is a product visibility gap, not missing engine MP settlement.
Evidence: root-owned `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-shadow-combined-z66v6e4e/summon-mana-red.json` and `.log`; two failures8.768s,2550repository/one external input/HEAD unchanged. Reproducer: `src/features/combat/CombatScreen.summon-mana.test.tsx`.
Affected systems: frontend-dev/ux-designer/accessibility-specialist/qa-engineer; root sole executor.
Root cause: CombatScreen compact UnitCard branch has only its HP bar, while the full GameCard branch already derives MP from unit.mana/stats.manaMax.
Workaround: previews explain maximum mana but cannot show actual current pool. Do not add a test-only bridge or infer current MP from capacity.

## Planned correction

Render the actual localized numeric MP/current capacity and blue progressbar for
compact summoned units with positive manaMax. Keep hero's existing battlefield
MP and mana-free units. Verify fractional values, updates, exhaustion and death
in both locales, then actual paid shadow combat and responsive captures. No
resource, balance, persistence, dependency or engine change is required.

## Resolution — 2026-10-27

13967ef9 renders actual compact summon MP/current capacity in both locales;
two original REDs become passing fractional/update/exhaustion/death regressions.
Related40/4PASS with scoped strict types/lint. The full d9447414 gate passes
19,927tests/939files (two existing opt-in skips), typecheck and lint.

The corrected production shadow matrix8/8PASS has16rank proofs and actual
numeric summon MP deductions. All16mobile originals were individually viewed:
localized MP is readable in scrolled summon captures; separate enemy captures
show damaged HP. Whole-app clipping/glyph/a11y limits remain. See
[combined evidence](../../docs/plans/evidence/d06-assassin-shadow-combined.md)
and its packet for exact commands, hashes, visual scope and retention. The
original RED logs now live inside the retained archive, not the removed raw root.
