# BUG-190 — Give the five Druid fire spells actual Burn damage

Severity: High — declared damage-over-time feature has no runtime potency.
Status: Locally fixed and verified; independent QA/design and earned balance open.
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

## Local fix and verification

Runtime `67cdf76` explicitly authors 0.1 final-hit/second potency on only these
five JSON rows and adds strict schema/native/actual-HP regressions. Existing
Burn/Ignite identity and periodic runtime remain unchanged. Presentation `435ceba`
shows authored rate/duration/stack/floor rules in both locales without claiming
fixed final DPS. The 10% reference is provisional local tuning.

Final focused 535/14, engine 6813/237, full 13198/571 plus two existing skips;
types/lint/production build/four-chunk bridge scan pass. Production browser 4/4,
20 actual spell entries, eight exact five-domain Continue pairs, 20 geometry
samples and 16 individually inspected screenshots. Browser high-level/resource
fixtures are synthetic and earn no campaign credit. All1293 source/config/test
and760 build hashes, HEAD/Git/genuine digest stay exact through the496.436s full
run; committed source blobs match. Original failures and fixture corrections
remain retained. [Evidence and limitations](../../docs/plans/evidence/d04-druid-fire.md).

Only these five inventory rows gain bounded local functional credit. Independent
QA/design, earned class/build balance, Baal, C2–C4/fullG0–G7 remain open. No new
test skips or weakened assertions/timeouts; no campaign or remote actions.
