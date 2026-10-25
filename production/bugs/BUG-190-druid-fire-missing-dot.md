# BUG-190 — Give the five Druid fire spells actual Burn damage

Severity: High — declared damage-over-time feature has no runtime potency.
Status: Reproduced; local fix in progress.
Owners: content-designer / engine-dev / frontend-dev; root sole writer.

## Reproduction

- Input commit: `ccf9762852af073dd72cedfb6db97564e94883ea`.
- Environment: local Vitest engine project, Node; browser/viewport/locale are
  inapplicable to this pure engine reproduction. Later presentation checks
  must cover en/zh-CN and desktop/mobile production browser.
- Seed: 7 (miss control seed 1). All stats/ranks/holds are synthetic fixtures.
1. Load actual JSON-registered Firestorm, Molten Boulder, Fissure, Volcano or
   Armageddon at rank 1, 2 or 20 with exactly its mana cost.
2. Allow one real cast at 1700 ms; hold subsequent actions to isolate its Burn.
3. Keep the target living through the full 4700 ms status expiry.
4. Sum periodic HP loss and compare final target HP with hit plus Burn.

Expected: explicit authored potency establishes real finite Burn damage after
the landed hit; the local contract selects the existing Fire Bolt 10%/s reference.
Actual: every skill/rank hits, creates a Burn marker and spends mana but causes
zero periodic HP loss. All 15 positive tests fail; 10 mana/miss controls pass.

Root cause: each JSON row lacks `statusEffect.dotPctOfDamage`. Catalog and shared
Burn/Ignite runtime already support it; the old inventory alias warning is stale.
Workaround: none for these declared DoT effects.

Evidence: `src/engine/combat/druid-fire.test.ts`; original `causal-red.log/json`
will be retained in `docs/plans/evidence/fixtures/druid-fire/`.
Contract: [D04 Druid fire](../../docs/plans/decisions/D04-druid-fire-dot-v1.md).
Independent design/QA and earned balance remain open.
