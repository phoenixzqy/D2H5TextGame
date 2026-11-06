# BUG-380 — Mercenary Blessed Aim grants no weapon accuracy

- Severity: High — the recruitable mercenary's advertised party aura is inert.
- Status: Open — native repair verified; broader acceptance pending.
- Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus retained native delivery, Frozen Armor and verified Pilfer changes; current claimed worktree.
- Environment: native Vitest/Linux; no app/browser involved.
- Locale: mechanical reproduction is presentation-independent; zh-CN/en skill and recruitment copy and the gacha design row now describe30% relative weapon miss reduction.
- Seed: 7.
- Owner: engine-dev; content/writer for authored tuning and zh-CN/en descriptions.

## Reproduction

1. Load actual mercs/act2-blessed-aim from the mercenary pool, create it through createMercFromDef and project with mercToCombatUnit.
2. Project a separate real hero with verified empty equipment (native melee basic), hold the merc and target, use imported survivor pools and zero crit. The hero alone acts; this is constructed native evidence, not earned play.
3. Run recorded battles at literal ranks1/20 and defender dodge0/.2. Observe and delegate the real seeded RNG chance calls, comparing source absent/present while preserving hero action timing.

Expected under the user's selected cheaper mechanic: 30% relative weapon miss reduction: hit probability .85 becomes .895; .65 becomes .755. No full Attack Rating system.

Actual before repair: all four tests fail the intended accuracy assertions (.85 remains .85; .65 remains .65). No collection/setup failure or timeout. Accuracy assertions precede passive-marker checks, so removal of the inert aura cast cannot explain the RED.

Root cause: aura-blessed-aim registers a generic self-buff placeholder with no accuracy output or native party presence.

## Native repair checkpoint

Native passive presence now supplies the selected30% relative weapon miss
reduction to authenticated living allied weapon recipients, with strict source,
original-allegiance, current registry/delivery and projectile-impact authority.
It consumes no cast and does not change the separate Paladin Attack aura.

Frozen primary4/4 and the final ordinary unit suite21819/1029 pass, zero failed/
pending/todo, with unchanged2125-input map
b6d7ad8ead29e527a96e7273fc4dabdd87465d54c2f37900a66a1d3ffb4d6073.
Actual engine11882/441, final lint zero warnings, predecessor types/boundary/
external build and independently reviewed exact test-only deltas support this
bounded checkpoint. Initial obsolete-stub assertions, supplemental fixture/
typing corrections, lint heap exhaustion and intentional-method-capture lint
failure remain recorded; no predecessor is discarded.

[Native evidence](../../docs/plans/evidence/merc-blessed-aim.md) contains exact
reports/maps, environment, independent reviews and limitations. All captured
check processes are absent and the disposable build has been removed. This
verifies the native repair only; earned play and broader acceptance remain
pending, so this bug is not closed.

## Evidence and retained boundary

Frozen primary: src/stores/merc-blessed-aim-primary.test.ts, SHA256 430746c44390b50451591937345f739c7e243686fa6cf8a6e9a90fe3b4cbecb2.
The aim-primary-red report/log/terminal receipt preserve unchanged2119-input map 060b58bfe0ed60a2e60b85035e0376c87d5c35dc12568854d126f1ab7331b020.
Driver3658210 and npm3658224 are absent. Required packet: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-blessed-aim-mhfj125a. Root retains it through unfinished acceptance and owns eventual exact-path cleanup.

[D04 contract](../../docs/plans/decisions/D04-merc-blessed-aim-v1.md) records the user decision, bounded implementation defaults and supplemental obligations. Separate selected Paladin Blessed Aim remains distinct. H3 remains terminal failed-no-app; all protected/closed-fixture, diagnostics, lineage, browser and remote restrictions remain. BUG180/366 timeout recurrence stops source continuation. No earned, balance, campaign or full-v1 acceptance is established.
