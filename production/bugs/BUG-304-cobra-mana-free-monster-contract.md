# BUG-304 — Resolve Cobra recovery against mana-free monsters

Status: Open — native implementation and public-store recovery/playback/save lifecycle verified; browser durability/UX and earned acceptance pending. No label/status applied to any forge item.
Severity: High — the original transfer contract prevented MP recovery against ordinary PvE monsters.
Build: fc915ddd3834b0927affa5843365620ff0bcef71; source unchanged by test-only7bcaaefd.
Environment: native actual allocation/equipment/Catacombs probes; production Chromium desktop1280×800/en Tiger control. No Cobra browser-mana acceptance yet.

## Reproduction

1. At fixed2026-10-27T12:00:00Z create the documented constructed level30 Assassin.
2. Use real allocation/priority/equipment and start areas/act1-catacombs.
3. Inspect native enemy resources: every factory monster has mana0/manaMax0.
4. A Cobra release can heal actual missing HP but cannot debit positive enemy MP.

Expected under the original contract: D05-assassin-martial-charges-v1 requires positive public actual victim MP debit and equal caster credit; no fabricated reward.
Original observation: combat-formulas.md §11 explicitly requires mana-free monsters, and monster-factory.ts sets both capacities/current MP to0. Ordinary monster JSON/type/schema have no mana pool. D04 Mind Blast supports affected0MP monsters and does not change construction.
Evidence: charge-public-native-probe/cadence/waves logs and12-case final receipt in /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-assassin-charges-zt17emhc; src/engine/combat/monster-factory.ts mana fields; docs/design/combat-formulas.md resource-pool policy; docs/plans/decisions/D05-assassin-martial-charges-v1.md and D04-mind-blast-mana-burn-v1.md.
Affected systems: game-designer/technical-director/content/engine/QA; root sole executor.
Root cause: acceptance requires a victim resource that the explicit PvE contract omits. This is not a debit/credit primitive defect: native constructed positive/zero/partial transfer cases pass.

## Decision and next steps
The user answered **“choose cheaper solution”**. Source comparison selected
keeping monsters mana-free and generating bounded Cobra caster recovery. Adding
spellcaster pools would require new monster schema/data/factory/resource policy;
the local redesign reuses the existing0.1-perstack coefficients and actual
triggering hostile HP-loss basis. No further preference question is pending.

The appended [D05 amendment](../../docs/plans/decisions/D05-assassin-martial-charges-v1.md#cobra-recovery-amendment--2026-10-27)
explicitly supersedes victim MP transfer. A living actual caster recovers floored
HP/MP from the triggering actual hostile HP removed, capped by fresh missing
capacity, for the existing1–3paid stacks. Victim death qualifies; reflected
caster death does not. Victim MP is neither inspected nor debited. Costs,
cooldowns, finite lifetime, once-only consumption and paid-copy ownership remain.

Independent design/plan review APPROVE is retained in root's H2 scratch as
`cobra-cheaper-policy-review.json`, SHA256
`3bb81bf508f3711787b81935f5977595062a8262fbb4607b9b3202f8240d04c1`.
The native fix now generates caster-only recovery from actual hostile HP removed;
no enemy pools were added. The unchanged authored-zero-MP regression reached
its intended policy RED, then passed after implementation. Focused
282/13files, engine
10,736/401files, full
21,187 passed, 2 skipped/989files, strict types and lint pass with unchanged final
inputs. The prior production build passes on identical production bytes with
only the two reviewed test typing fixes afterward.

[Native checkpoint evidence](../../docs/plans/evidence/cobra-mana-recovery.md)
retains exact snapshots, failures, reviews and limits. The subsequent
[native public-store lifecycle checkpoint](../../docs/plans/evidence/cobra-public-lifecycle.md)
proves real learned rank1/20 zero-enemy-MP recovery and nonterminal playback,
plus full persistent-domain equality through export/flush/load/Continue/import.
Only Dexie constructor/table I/O is mocked. Live combat HP/MP and charges remain
transient; restored runs earn paid Cobra again. Real browser durability/UX and
earned acceptance are still required. Original transfer failures and zero-MP
observations remain historical. Do not inject enemy resources. Cobra remains
unverified in the functional inventory: 212bounded plus one unverified.
Earned sustain/balance/pacing, campaign and full-v1 acceptance remain open.
No further preference question is pending.
