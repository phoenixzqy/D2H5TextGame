# BUG-288 — Restore Amazon javelin secondary mechanics

- Severity: High — four advertised active skill identities are incomplete.
- Status: Reproduced; runtime correction pending original volley full-unit freeze.
- Build: runtime/UI `dceffcf4`,test-only public `4a80c03a`,diagnosis HEAD `b9e0ed21`.
- Environment: Linux,Vitest1.6.1/jsdom,native projection;no browser viewport claim.
- Locale: en/zh-CN advertised copy checked;native simulation is locale-independent.
- Seed:7,rank1 and20.
- Owner: root (engine/content/schema/UI/native/public);independent acceptance open.
- Evidence: [exact diagnostic packet](../../docs/plans/evidence/fixtures/amazon-volley/javelin-diagnostic.json);
  raw `amazon-javelin-identities-diagnostic-final.log`/`.json` and test under
  `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-amazon-volley-l7m0tvg6`.

## Reproduction

1. Create a native level30 Amazon with each selected skill and all authored
   prerequisites;equip a canonical training bow through the inventory store.
   The four current skills have no authored equipment gate;this diagnoses
   their actual eligible public projection,without inventing a new gate.
2. Project using `playerToCombatUnit`,isolate one paid action at1700ms with
   Attack1,zero mitigation/dodge/crit and2000HP/100MP diagnostic pools.
3. For Power Strike count lightning events against two original enemies.
   For Charged Strike/Poison Javelin place target at(0,0),nearby at(0,1),outside
   at(9,9). For Lightning Strike place three at(0,0),(2,2),(4,4).
4. Check actual recorded actions,payment,damage/statuses and final hostile HP,
   deterministic replay,input immutability and runBattle parity.

## Expected

Power Strike releases plural bolts on impact;Charged Strike releases lightning
to nearby enemies;Poison Javelin creates a Poison cloud;Lightning Strike chains
between enemies using the established chain semantics. Each cast pays once.
Exact bolt counts,potency/impact coupling,cloud footprint/lifetime and chain cap
require an explicit bounded author contract before implementation. This RED
diagnoses minimum advertised identities,not final balance or design approval.

## Actual

| Skill | Rank1/rank20 actual | Missing behavior |
| --- | --- | --- |
| Power Strike | one Lightning event41/117;targetHP1959/1883,reserve2000;10MP | no multiple bolts |
| Charged Strike | one Lightning event71/185;targetHP1929/1815,nearby/outside2000;20MP | no nearby bolt/HP loss |
| Poison Javelin | only primary Poison;final targetHP1975/1908,nearby/outside2000;10MP | no cloud Poison or HP loss on nearby enemy |
| Lightning Strike | only first two damage81/92 or214/225;third remains2000;25MP | no chain through third enemy |

All eight rank feature assertions fail after one real paid action. Ordinary
Lightning Bolt control passes:one51Lightning hit,targetHP1949,reserve2000,15MP.
Final diagnostic8failed/1controlPASS8.918s,all2438repository inputs unchanged.
The original draft also expected10MP for the ordinary Bolt incorrectly;its
authored15MP control is corrected,with original source/log preserved. No
feature assertion,threshold,skip or repository runtime was weakened/changed.

## Root causes and repair boundaries

Power/Charged/Poison JSON has only scalar single-enemy settlement;there is no
secondary bolt/cloud packet. Lightning Strike omits `aoeShape`,so the shared
legacy fallback takes the first two rather than chaining. Reuse shared
damage/status/chain primitives with explicit JSON tuning;do not delete copy
promises or add a parallel combat resolver. Preserve existing primary damage/
growth,MP/CD,eligibility and genuine saves unless a recorded design decision
explicitly requires a change. Ordinary Lightning Bolt remains a single target.

No player workaround restores these mechanics. Security check:pass;first-party
local gameplay/diagnostic content only,no credentials,dependencies,CI,remote or
genuine campaign/replay action. No delegation or independent self-approval.

Root owns the active shared task and evidence through the original volley full
consumer,then its retention/read-back/exact cleanup. These failures are outside
repository test discovery;they do not alter the active full-suite inputs or
credit any skill. Full privatev1 remains unfinished.
