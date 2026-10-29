# BUG-374 — Replace seven mercenary damage placeholders

- **Status:** Open — native repair verified; browser/earned feature acceptance pending.
- **Severity:** High — advertised mercenary damage/recipient paths are incorrect.
- **Build:** `217552eb288bd137e390d3f0d9787847220b3a2d` plus frozen primary test.
- **Environment:** Node/Vitest ordinary UI project; no browser or viewport.
- **Locale:** Locale-independent engine behavior; zh-CN/en copy reconciled, rendering unverified.
- **Seed:** `5`.
- **Owners:** engine-dev / content-designer; root implementation, producer review.

## Reproduction

1. Load each of the seven real definitions using `loadMercPool()`.
2. Use `createMercFromDef()` and `mercToCombatUnit()` unchanged, preserving actual
   secondary skills and Fire Mastery. Construct surviving resources and zero
   mitigation/dodge to isolate mechanics; hold other actors without replacing skills.
3. Run `npm test -- src/stores/merc-direct.test.ts` through the retained safe runner.
4. Inspect the first mercenary action at 1700ms.

| Actual loadout | Expected first-cast damage | Actual placeholder damage |
| --- | --- | --- |
| Act III Iron Wolf Fire | `[91,85]`, first two targets, real Fire Mastery | `[63,58]` |
| Act III Iron Wolf Cold | `[56]`, one target | `[46,42]`, two targets |
| Act III Iron Wolf Lightning | `[12,12,12,12,12]`, rotating original pool | `[37]`, one target |
| Act IV Paladin Initiate | `[32]`, 25% landed stun | `[37]`, placeholder 20% stun |
| Act III Militia Swordsman | `[48]`, effect-only +25 percentage points crit | `[32]`, no bonus |
| Act III Militia Pikeman | `[30,21]`, two distinct targets | `[37]`, one target |
| Act V Barbarian Recruit | `[28]` | `[26]` |

## Expected

Execute the seven contracts reconciled from `docs/design/gacha-spec.md` §4.1–4.3
and existing authored status payloads. Fire Ball is flat fire50–80/CD4/firsttwo;
Glacial Spike cold40–60/CD5/single/30% landed canonical Chill; Charged Bolt has
five independent flat12 lightning attempts/CD4 with authored Paralyze retained;
Smite physical22–35/CD2/25% landed canonical Stun; Chop physical16–26/CD1/+25
percentage points effect-only crit; Pierce Thrust physical20–32/CD2/firsttwo;
Basic Swing physical18–30/CD1/single. All cost zero MP, with no rank growth or
Attack contribution. Preserve ordinary mitigation, party effects and status rules.

## Actual and root cause

`MERC_STUB_SKILLS` in `src/engine/skills/aliases.ts` registers independent hardcoded
placeholder values, recipients, effects and cooldowns. Default registry therefore
does not execute the JSON/design contracts. Several JSON values also predate the
gacha spec; copying only the current JSON would retain part of the defect.

## Evidence

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-direct-3u9ht7ur`.
`primary-freeze.json` binds the actual-loadout regression; `red.json`, `red.log`,
`red-before.json`, `red-after.json` and `red-result.json` retain seven causal
failures, exit1/11.310009s, unchanged2081-input map
`f900374737388a1193f1fc15ae88c99284352c783388d075f1fbc5759fb9cfca`.

No production changes preceded this report. Native mechanics evidence does not
prove earned recruitment, campaign pacing, balance or browser acceptance. H3
remains terminal failed-no-app; no app/browser retry or replacement gameplay run.
Root retains this exact packet through unfinished acceptance and owns cleanup.

## Native validation failure — fixture typing

Final focused330 and scoped zero-warning lint pass on unchanged2085-input map
`b2b855060a656f3b592e62893304c78b9baa263a508ee1b2753fc140b0f6db34`.
Project types exit2/130.719451s on that same map: the array before `.map()` in
`src/engine/combat/merc-direct.test.ts:102` widens the summoned target's `kind`
literal to `string` (TS2322). Actual `types.log`, native terminal receipt and
exact failed source `combat-before-kind-type.ts` remain retained in the packet.
Independent producer approves a single erased `as const` annotation on that
fixture literal; runtime values, assertions, primary and production stay intact.
This finding was recorded before applying the correction. The approved single
`as const` annotation emits byte-identical ES2022 JS under esbuild0.21.5; its
actual successor sources and native receipts remain retained.

## Native repair verification

The immutable exact-seven JSON catalog replaces only these stubs, with narrow
schema closures and reconciled bilingual descriptions. Existing runtime settles
all targeting, damage, RNG, statuses and cooldowns. Final source2085 map
`e3495bca891687447282cda5a91ba49270b641e9f7b28684b9d3c1dd34e8e7c4`
passes focused330/11files, engine11345/422, ordinary21201/997 (zero failed,
pending or todo), project types, scoped/full zero-warning lint, dependency
audit997tests/1581modules and external production build. Each native receipt
records unchanged inputs. The frozen seven-case primary remains unchanged.

Failed schema collection, Burn-observation, lint and type attempts are retained
with exact sources/receipts in the packet; the [native evidence](../../docs/plans/evidence/merc-direct.md)
records their causal lineage and final scope. Disposable build762files/
42291221bytes/10directories is verified removed; all42 recorded check PID/driver
observations are absent. No timeout-cause, speedup, earned recruitment, balance,
pacing or browser acceptance follows. Independent native source/gate approvals
and final evidence/blob/tree/parent reviews govern the local checkpoint.
