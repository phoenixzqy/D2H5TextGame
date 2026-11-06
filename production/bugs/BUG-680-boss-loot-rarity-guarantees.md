# BUG-680 — Honor boss and treasure rarity guarantees

- **Status:** Resolved locally: equipment guarantees, exact boss material/ordinary/jewelry counts, optional uniques and first-kill rewards verified. Umbrella acceptance remains open.
- **Severity:** High; boss rewards can miss their documented equipment guarantees.
- **Owner / affected systems:** Root / loot engine, authored reward policy, content QA.
- **Build:** `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus current retained source including BUG678.
- **Environment:** WSL, deterministic reward-only Node sample; browser/viewport/locale independent.
- **Seed:** `hashSeed("MF-v1|loot/act1-boss|<killIndex>")`, killIndex 0–999.

## Reproduction

1. Run the explicit production diagnostic `tests/sim/production/magic-find-sample.test.ts`.
2. Inspect current Act I boss, monster level14, MF0, multiplier1.
3. Across1000 calls, materialized rarities are1816 normal,537 magic,576 rare,80 set,187 unique.

**Expected:** `docs/design/drop-tables.md` §5.1 requires at least one forced rare-or-better reward per Andariel kill, in addition to the ordinary MF rolls. Other acts specify increasing rare and set/unique guarantees; §4.9 requires at least one rare for treasure goblins. These guarantees must survive materialization.

**Actual:** Only843 rare-or-better items exist across1000 Andariel kills, proving at least157 calls cannot have their required minimum. `rollDrops` only rolls the tier's default picks; neither the authored table nor award materialization adds a guarantee. BUG678 restores ordinary rarity but does not implement these separately required rewards. The missing guarantee must not be hidden by restoring fixed rarity on all ordinary choices.

## Evidence and scope

Retained packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p17-real-mf-v1/loot-sample.json`, Act I boss row, current variant0. The sample is synthetic reward-only evidence, not an earned boss kill or campaign acceptance.

The current sample proves the Act I defect. Other boss/goblin requirements are identified from the specification and common source path; they need their own focused regression evidence. Implement an authored, bounded guarantee policy that retains normal MF rolls, correct base/level eligibility, actual rare/set/unique materialization and direct material rewards. Full boss bundle counts, first-kill rewards, balance and pacing require separate verification against the complete specification.

## Local implementation, 2026-11-04

[D09](../../docs/plans/decisions/D09-kill-equipment-guarantees-v1.md) implements
all five boss rarity groups, the goblin rare+ and each act mini's 50% rare+.
[Focused evidence](../../docs/plans/evidence/p17-equipment-guarantees.md) records
the original 15 failing cases, production materialization, planned level gates,
quest-cache isolation and real victory-to-inventory publication/refusal checks.
Ordinary rewards are preserved per individually seeded call; later shared-stream
rewards can change. No earned campaign/economy acceptance is inferred.

Still open under this bug: full ordinary/jewelry counts,
optional unique attempts and first-kill reward rules in §5.
The newer §9 wishstone policy supersedes the older unconditional kill wishes.

## Material quantities, 2026-11-04

[Exact material-bundle evidence](../../docs/plans/evidence/p17-boss-material-bundles.md)
verifies all five chapter bosses across three difficulties, forced quantity and
identity endpoints, stack totals, cap/schema/semantic refusal, quest isolation
and native Diablo inventory publication.199affected loot and19settlement tests,
scoped types/lint and isolated production/precache checks pass. No campaign
replay, pacing/balance credit or save migration is claimed. Remaining ordinary,
jewelry, optional-unique and first-kill requirements keep this bug open.

## Ordinary-group reproduction and implementation plan, 2026-11-04

All15 new real-pool boss/difficulty cases fail before implementation: ordinary
counts are at most five mixed picks instead of4+2/5+3/6+3/7+3/8+4. The retained
`p17-boss-equipment-groups-v1/original-failure.log` records seed0 failures. D09's
chapter-boss equipment decision specifies bounded source groups and finite
terminal-band extensions; raw treasure classes and historical evidence remain.

The initial affected run after implementation has117passes/two test failures.
The material-isolation fixture replaces every TC with one scripted rune row but
inherits the new production equipment policy, whose source references no longer
exist. Explicitly omitting this separate equipment policy restores that test's
declared material-only scope; its concrete material/cache/other-tier assertions
remain. The new MF test's unit0.35 lies below the MF300 boss white threshold
(about0.358); unit0.55 independently crosses white→magic→rare under MF0/300/
300×1.5. Correct the scripted variate, preserving every rarity assertion.

## Ordinary groups verified, 2026-11-04

[Equipment-group evidence](../../docs/plans/evidence/p17-boss-equipment-groups.md)
verifies all five exact ordinary/jewelry counts and bounded source eligibility,
actual planned levels, MF and quest isolation.27focused and20native settlement
cases pass. BUG683 explains and corrects the14historical/oracle failures in the
broader affected run;164cases in those two files pass, with30selected final
test-only adjustments rechecked. Scoped strict types/lint, isolated production
build, ten-chunk bridge scan and precache pass. Exact disposable output/config
removed after14source/766build hashes verified. Optional unique attempts and
first-kill reward rules remain unfinished; no earned/balance credit is claimed.

## Optional-unique reproduction, 2026-11-04

The current award path ends after ordinary groups and rarity guarantees; no
optional unique policy or extra roll exists. The new constructed reproduction
forces all positive chance gates and the high end of rarity entropy, then
expects one additional materialized unique for each boss/difficulty at live
levels14/27/42/57/78 plus replay offsets. Prior source returns only the ordinary
6/8/9/10/12 items when rarity guarantees are explicitly isolated. D09 records
the exact optional semantics before implementation; original red output will be
retained in `p17-boss-optional-uniques-v1/original-failure.log`.

## Optional uniques verified, 2026-11-04

[Optional-unique evidence](../../docs/plans/evidence/p17-boss-optional-uniques.md)
verifies all five authored gates, Andariel's distinct5×rarity attempt, weighted
eligible unique materialization, unchanged preceding rewards, cache/tier
isolation and native atomic publication/refusal.341affected loot and22native
settlement cases pass; scoped types/lint/build/precache/ten-chunk bridge checks
pass. Source/build hashes verified and disposable output/config removed.
First-kill reward rules remain unfinished; BUG680 stays partially open.


## First-kill native authority reproduction, 2026-11-04

The first native implementation reused the direct helper's options object for
its private first-kill boss ID. TypeScript hides that field from the public
signature, but a structurally compatible caller object can still contain it at
runtime. A real-pool direct Act I level14/seed7 reproduction then receives an
extra Shadowfang unique without native settlement. The exact failing output is
retained in `p17-boss-first-kills-v1/native-authority-red.log`; no clear flag was
consumed. Move this native-only identity to a separate private function argument
that the public helper never supplies, rather than relying on excess-property
type checks. This finding concerns local reward authority, with no network,
credentials or dependency change.

## First kills verified and local closure, 2026-11-04

[First-kill evidence](../../docs/plans/evidence/p17-boss-first-kills.md) verifies
all five bosses across three difficulties, exact named probabilities and random
restrictions, native first/repeat/save/reload/frozen-difficulty/defeat/rollback
behavior and refusal before XP/inventory. The direct-helper authority defect
above is fixed with a private second argument and full-reward equality regression.
247affected loot cases and89final selected cases pass (overlapping counts),
along with scoped strict types, explicit lint and isolated production build,
actual precache and ten-chunk bridge checks.12source/766build hashes match;
exact disposable output/config removed and verified absent. No migration,
retroactive grant, campaign replay or earned/balance/pacing acceptance.

All implementation requirements tracked by BUG680 are now resolved locally.
Historical reproduction and partial-status entries above remain as an audit
trail. Full P17, the wider loot specification and private v1 are not accepted
by this bug's closure; their independent requirements remain active.
