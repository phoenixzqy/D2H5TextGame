# BUG-288 — Restore Amazon javelin secondary mechanics

- Severity: High — four advertised active skill identities are incomplete.
- Status: Fixed locally in `9ffd64cd`/`df0a3c5b`/`72d4988a`/`d4f40c1a`; integrated checkpoint passes; independent and earned acceptance open.
- Build: runtime/UI `dceffcf4`,test-only public `4a80c03a`,diagnosis HEAD `b9e0ed21`.
- Environment: Linux,Vitest1.6.1/jsdom,native projection;no browser viewport claim.
- Locale: en/zh-CN advertised copy checked;native simulation is locale-independent.
- Seed:7,rank1 and20.
- Owner: root (engine/content/schema/UI/native/public);independent acceptance open.
- Evidence: [exact diagnostic packet](../../docs/plans/evidence/fixtures/amazon-volley/javelin-diagnostic.json);
  raw `amazon-javelin-identities-diagnostic-final.log`/`.json` and test under
  the retained volley archive documented in [volley evidence](../../docs/plans/evidence/d04-amazon-volley.md); diagnostic copies also remain in the current javelin task.

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

## Implementation checkpoint — 2026-10-26

`9ffd64cd` adds bounded nonrecursive impact bolts after full primary settlement;
`df0a3c5b` activates exact schema/JSON tuning and native contracts; `72d4988a`
adds source-backed bilingual previews. The subsequent test increment adds
18 lifecycle cases and public production browser acceptance.

Current repository checks: 124 native/schema/Vengeance cases pass (8.065s),
40 bilingual UI cases pass (12.628s),18 lifecycle cases pass (9.219s).
Focused UI types/lint and public types/explicit browser lint pass. The original
Vengeance failure was a wrong registry-order literal; the closed inventory
assertion now follows existing stable registration order without reordering
production. Focused tsconfig omissions and default tests lint exclusions were
corrected in external command configuration, with original receipts retained.

The old volley task is terminal and removed after verified retention. Root now
owns `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-amazon-javelin-dhkq0oqy`
through fresh current engine/full/static/build/browser checks and exact cleanup.
No new skill credit,independent approval,earned balance or campaign action.

## Terminal checkpoint

Frozen `9f04c8a8`:18901tests/870files/two existing opt-in skips PASS945.572s,
engine9652/364,full types/lint/build/bridge/precache PASS. Production public4/4
PASS168.310s,en/zh desktop/mobile,16 selected typed hits,eight exact seven-domain
pairs,four actual offline Continues,80 geometry checks. All2445 inputs/HEAD exact.
All354 archive members read-back verified,1118 exact files/37 directories removed,
remaining[]/failures[],762 build hashes/both genuine hashes exact. Sixteen mobile
originals inspected with explicit scroll/crop/header/nav/emoji limits. Exact four
bounded credits;independent/earned builds and balance/full privatev1 remain open.
Current receipts,retention/cleanup and limitations: [javelin evidence](../../docs/plans/evidence/d04-amazon-javelin.md).
