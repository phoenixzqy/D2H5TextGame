# Native defeat, preparation and retry evidence

Status: transport and conditional exploration verified; **0/210 balance cells
accepted**. The private v1 goal remains active. This report does not certify
recommended power, first-clear acquisition, manual/idle equivalence or pacing.

## Source eligibility and measurement

The retained `p15-boss-intended-power-identity-audit-v1.json` audits the union of
all 70 earned build/act sources. All 70 have distinct signature investments and
pre-clear quest contexts; seven require a whole-area start. This is identity
and source-state evidence only, with no new combat or recommended-power sign-off.

`tests/campaign/retry-measurement.ts` measures one contiguous native Normal area
sequence: at most three attempts, stopping at a complete living-hero victory.
It retains every wave and failed attempt, native Return/admission, actual earned
points and owned gear, native challenge counters/seeds and quest settlements.
No restore, selected seed, free gear, refill or ordinal override occurs between
attempts. Logical time advances by the ceiling of every played wave's actual
duration, including losses. Menu/decision time is uncalibrated.

The helper's three regression cases pass in `native-retry-green-v4.json`.
Helper/tests/workspace scoped lint passes in `p15-native-boss-retry-lint-v3.log`;
strict types for the helper and diagnostic drivers/readers pass in
`p15-native-boss-retry-types-v5.log` and the final exploration types-v2 log.
No unrelated act suite or completed combat cohort was replayed for readback.

## Earned source sequences

All three independent native-save/journal readbacks passed:

| Source | Attempts | Waves won / played | XP | Items | Combat seconds |
| --- | ---: | ---: | ---: | ---: | ---: |
| Necromancer corpse/curses, Act IV | 1 | 7 / 7 | 37,410 | 57 | 166.380 |
| Necromancer corpse/curses, Act V | 1 | 8 / 8 | 80,380 | 98 | 279.543 |
| Amazon bow, Act II Tomb | 3 | 10 / 12 | 34,610 | 87 | 168.992 |

The Amazon sequence is an actual loss/loss/win. Its initial level-26 source has
20 STR / 125 DEX / 45 VIT / 15 ENE, Multiple Shot 20, Magic Arrow 1, Critical
Strike 2, Dodge 1 and Penetrate 7, with zero unspent skill/stat points. The
training bow supplies 18 Attack; hero Attack is 140. After the first loss,
native equip selects a newly earned owned composite bow with 45 Attack,
raising hero Attack to 167. After the second loss, another owned bow raises
hero Attack to 170. No points appeared or were spent. The Duriel objective
remained false after both losses and became true only after full victory;
the quest reward was not claimed. Failed waves earned zero income and earlier
winning waves retained their income.

## Frozen 100-stream exploration

`P15-amazon-act2-native-retry-exploration-v1.json` freezes the same source and
adaptation. Each independent stream restores the source once, starts at its
original timestamp plus stream-number days, then carries all attempts natively.
Those clock offsets partition test RNG; they are not earned or offline hours.
Streams 1–100 ran exactly once in five bounded shards. The independent reader
verified all 100 reports, journals, source/adaptation states and native exports.

| Measure | Observed result |
| --- | --- |
| First-attempt full-area victories | 2/100; 95% Wilson interval 0.55–7.00% |
| Full-area victories within three attempts | 61/100; interval 51.20–69.98% |
| Failed all three attempts | 39/100 |
| Total attempts / played waves | 269 / 1,252 |
| Winning waves / deaths / draws | 1,044 / 154 / 54 |
| Victorious full-area duration p50 / p95 | 92.127 / 109.817 seconds; n=61 |
| Failed-attempt duration p50 / p95 | 60.849 / 130.309 seconds; n=208 |
| Total combat / sequence execution time | 20,090.721 seconds / 107.464 seconds |
| XP / items | 3,903,870 / 10,159 |
| Item rarity | 10,007 normal, 133 rare, 19 unique |

These are whole-area durations, including preceding trash/elites, rather than
the boss encounter's TTK. A fast defeat cannot lower the victorious percentile.
The starting source is conditional and difficult; these results neither pass
the required boss retry rate nor establish recommended first-clear power.

## Failure diagnosis and owned preparation

The offline analysis consumes saved observations without playing combat:

| Terminal location (zero-based wave) | Defeats | Draws |
| --- | ---: | ---: |
| Trash 0 / 1 | 22 / 21 | 0 |
| Elite 2 / 3 / 4 | 5 / 75 / 3 | 0 |
| Duriel 5 | 28 | 54 |

Only 61 of 143 reached boss encounters were victorious. Of all 208 failed
attempts, 156 entered their final wave with no living mercenary. Direct damage
to the hero across all waves was predominantly physical (170,494), followed by
lightning (20,742), fire (4,978), arcane (4,756) and cold (2,947); this excludes
periodic damage and is not a forecast of incoming attack probabilities.

The original source owns 84 backpack items, no stash items and no spare bow.
A separately frozen native preparation projection applies the existing
monotone policy and existing two-pass Act II survival policy, preserving hero
attack/speed/full mana-capacity floors. Hero equipment/stats do not improve.
The mercenary gains one owned amulet. Exact native save capture and resource,
point, ownership, currency, material and quest conservation checks pass, with
no combat, purchases, healing or farming. Its strict typecheck-v2 passes; the
retained v1 type failure was a scratch Node-type configuration and `xp` versus
`experience` annotation mistake, corrected before execution.

The 54 boss draws all leave the hero alive with 1–6 mana. Stream 6, attempt 1,
illustrates waste: 32 rank-1 Magic Arrows cost 160 mana, with 22 direct Arcane
hits of 1 damage and ten misses; 18 Multiple Shots contribute the useful damage.
This supports testing an ordinary combo-order correction before adding farming.
The original cohort remains intact. A new frozen five-stream matched policy,
`P15-amazon-act2-bow-priority-exploration-v1.json`, removes Magic Arrow from
the active order while retaining its learned rank and every other starting
field. It uses no holdouts or balance acceptance claim.

## Matched five-stream bow priority screen

The frozen Multiple-Shot-only policy ran against exactly the first five original
stream partitions; the independent reader verified all five without replay.
Every learned rank, initial stat, item and currency stayed the same.

| Measure | Original combo, same five streams | Multiple Shot only |
| --- | ---: | ---: |
| First-attempt full-area victories | 0/5 | 3/5 |
| Victories within three attempts | 3/5 | 5/5 |

The new sequences took 3, 2, 1, 1 and 1 attempts: eight attempts, 44 waves,
41 wave victories, three deaths and no draws. Winning whole-area duration
p50/p95 was 110.209/121.717 seconds. Total combat was 732.229 seconds;
execution was 4.310 seconds. They earned 149,390 XP and 405 items. Five streams
are a diagnostic screen, not an accepted population, holdout or balance cell.

## Chronological earned bow upgrade and boss retry

`P15-amazon-act2-bow-training-v1.json` froze one bounded acquisition sequence
before execution. It restores the original level-26 source once at its original
timestamp, changes only the native combo, then plays the earliest unlocked
Act II area (Rocky Waste, authored level 14) until the first earned bow upgrade
or the declared admission/nonwin limits. No purchase, grant, reset, discard,
selected seed or intermediate source restore is allowed.

One training admission clears, earning 10,210 XP and 53 items in 32.327 combat
seconds. The owned crossbow `it-5i8b4-6ox` has base Attack 33; native equip raises
hero Attack 140→155. The contiguous whole-Tomb sequence then clears on attempt
three, using 223.703 combat seconds and earning 43,650 XP and 123 items. Across
training and boss retry, all 20 waves remain recorded: 18 victories and two
deaths, with no draws. The sequence executes in 2.364 seconds. Actual combat
cost is 256.030 seconds; menu/decision time remains uncalibrated. This is one
conditional earned route, not a population success-rate or pacing result.

The independent chronological reader v3 and scoped strict types v5 pass.
Reader v1/v2 failures were comparison defects: native save serialization builds
actor equipment arrays from inventory/merc slot records, while the observation
codec sorts record keys. Reader v3 independently projects the same complete item
payloads and compares only these actor equipment lists by item ID, preserving
multiplicity. Slot records and every other field/array still compare exactly.
The original driver, completed combat, saved observations and native exports
were not modified or rerun. Failed readers/logs remain retained for review.

## Fresh bow route and independently verified Arcane defeat

The opt-in `amazon-bow-volley-v1` policy completed one fresh chronological
diagnostic through Act I and the Act II Staff prefix. It cleared Act I at
level 12 and earned level 14 through 36 additional Den admissions. Far Oasis
cleared; Arcane Sanctuary admission 144 ended in defeat on wave 3. Across
145 admissions, all 462 played waves remain: 461 victories and one defeat,
with no draws, unobserved waves or native exceptions. The run earned 287,890
XP and 4,576 items; normal native salvage removed 4,350 items. Combat cost
was 4,037,091 ms (67.285 minutes); wrapper execution was 54.877 seconds.
Neither number includes calibrated player decision time.

The offline reader `p15-bow-volley-fresh-act2-v1-readback.py` independently
matches all wave summaries, actual XP/item/currency/material ownership,
successive native admission ordinals/seeds, consumed logical time, full native
export and journal terminal snapshot. It also rehashes the 2,141 production
and 104 transport inputs against their exact before/after manifests. No combat
was replayed. The failed wave awards no XP or loot.

This defeat is a survival event, not mana starvation. The hero entered with
232 life and 136 mana, took 243 lightning and 69 physical direct damage, and
died with 139 mana. All eleven enemies were level 26; the hero was level 14
with 15 lightning resistance. Arcane is authored at area level 23. Earned
within-act preparation must be evaluated before attributing this to a formula
defect. This is one diagnostic chronology; accepted balance cells remain 0/210.

## Earned Act II preparation and exhausted Arcane retries

The exact fresh level14 checkpoint continued once under its frozen training
policy. Rocky Waste produced54 admissions:44 full-area victories and10 losses,
206 winning waves/10 defeats,449,380XP and2,312 acquired items. Ordinary native
overflow salvage removed2,316 items. Combat cost was2,175.981 seconds. The
hero reached level18, timestamp1793310213105 and next Normal ordinal199 before
the original total-nonwin limit stopped training. All ten defeats were Rocky
Waste wave4; lightning dominated direct incoming. No zero-mana observation
occurred. Level18 enemies still killed the level18 hero, so underlevel alone
does not explain those training deaths. No Arcane suffix action occurred.

Native survival preparation used owned backpack/stash items, preserving attack,
attack speed and full mana capacity. Hero and fielded merc each equip an earned
two-socket Coif of Glory. Hero lifeMax355→365, defense154→167, lightning15→23;
cold65→61, poison24→19 and magical dodge.09→.07 are retained tradeoffs. There
was no combat, income, cost or resource refill during this equipment selection.

The next frozen increment spends four owned Orts through native unequip,
material prepare/preview/execute and re-equip. Each armor socket adds30 authored
lightning resistance. All four actual costs are retained; hero displayed
lightning reaches83 and the ordinary75 damage cap applies. The original Arcane
loss counts as attempt1. Only attempts2/3 were admitted, at ordinals199/200,
with advancing native clocks/seeds. Both lose wave3; no Tomb or quest suffix
action occurs and no further training budget is granted.

| Attempt / ordinal | Hero entry life / mana | Direct physical / lightning / cold | Final mana |
| --- | ---: | ---: | ---: |
| 2 /199 |237 /187 |165 /93 /46 |207 |
| 3 /200 |172 /209 |180 /59 /73 |207 |

Both fatal waves contain level26 enemies against the level18 hero. Physical
damage is now the largest direct incoming component; no mana starvation was
observed. These are different advancing encounters, so their damage totals
are not a paired estimate of the Ort effect. The increment retains4 wave wins,
2 defeats,12,480XP,20 acquired items,12 normal salvage removals and62.426 combat
seconds. Native terminal state is level18, timestamp1793310275533, Normal201.
Neither training nor route retry limits may be extended within this policy.
Next inspect authored progression and preparation selection before choosing a
separately justified policy or production change.

Independent offline readers verify both complete journal/export/save identities,
actual XP/currency/material accounting, unique intrinsic item ownership and
socket payloads, native ordinals/seeds, all losses earning zero rewards, and
the unchanged2,141 production/104 campaign inputs. The Ort reader's first two
attempts corrected reader assumptions only: requests use last ordinal+1, and
merc unequip removes equipSlot ownership metadata. Reader v3 excludes only
equipped/equipSlot from intrinsic item comparisons; full native snapshots and
exports still compare exactly. No combat was replayed. Scoped driver types
pass; v1 inference failures and their corrected v2 preflight are retained.

## Evidence and retained artifacts

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Primary artifacts are:

- `p15-boss-intended-power-identity-audit-v1.json` and its `.py` reader.
- `p15-native-boss-retry-v1.readback.json`, the Act V and Amazon Act II variants,
  their compressed reports, committed journals and native exports.
- `p15-amazon-act2-retry-exploration-v1.readback.json` and all 100
  `p15-amazon-act2-retry-exploration-v1-stream-NNNN` report/journal/export triplets.
- `p15-amazon-act2-retry-failure-analysis-v1.py` and `.json`.
- `p15-amazon-act2-owned-preparation-v1.json.gz` and `.native-export.json`.
- `p15-amazon-act2-bow-priority-v1.readback.json` and its five report/journal/export triplets.
- `p15-amazon-act2-bow-training-v1.json.gz`, `.progress.jsonl.gz`,
  `.prepared-source.json`, `.native-export.json` and `.readback.json`.
- Training driver v1, readers v1–v3, launcher/exit/log files and strict types v5.
- `p15-bow-volley-policy-v1-closure.json` indexes exact hashes and current validation.
- `p15-bow-volley-fresh-act2-v1-plan.json`, the complete report/journal in
  `p15-bow-volley-fresh-act2-v1/`, and its independent `-readback.py` / `.json`.
- `p15-bow-act2-earned-continuation-v1` report/journal/native export and independent reader.
- `p15-bow-act2-lightning-preparation-v1.json`, native export and independent readback.
- `p15-bow-act2-ort-retry-v1` report/journal/native export, plan-v2, driver-v2,
  reader-v3 and independent `-readback.json`; failed preflights/readers remain.

Authorities 59–64 share production source hash
`64ceb9264f1caede430f343c33c497ebde03ff45bb3172c707dea8edf86257f8`
and authored data hash
`f94fd205da07f4fa8818d38aad5074a97fe7807230bf9c53466faae2f4c6bece`.
That manifest excludes campaign/contract transport directories. The Amazon
policies therefore separately freeze and verify their 104 transport inputs
before and after execution. Keep those historical fingerprints with their
results; changing transport does not retroactively update an old observation.

Retain the failed Amazon v1 setup log: a capitalized Act V policy-path mistake
stopped before store mutation/combat. The corrected v2 driver ran once. Also
retain the executed pre-annotation driver copy, type failures and their corrected
checks. No completed combat was replayed to repair a reader or type annotation.

Root retains this worktree and packet through umbrella review and owns eventual
cleanup/release. Required reports are evidence rather than disposable caches.
The earned level-72 SSR continuation remains the canonical campaign successor;
none of these conditional diagnostics overwrites it.

## Remaining work

The separately versioned [bow campaign policy](../plans/decisions/P15-amazon-bow-volley-v1.md)
retains Magic Arrow before Multiple Shot is learned and uses Multiple Shot alone
afterward. Preserve the historical combo/policy and its original fingerprints.
Fresh chronological acquisition and earned preparation have now exhausted the
declared Arcane three-attempt limit at level18. Inspect authored progression and
preparation selection next; do not extend this exhausted policy. Then freeze
intended-power role populations and independent holdouts with legal
acquisition and retry costs. Preserve the full 210-cell and 14-build fresh-campaign scope,
earned recruitment/economy/fairness, manual/idle equivalence, calibrated 30–50
active-hour pacing, performance BUG-592, integrated G0–G7, two-hour soak and
independent review, followed by the owner's playtest. Browser works, CI remains
excluded at the owner's request, and there is no pending user question or
external blocker.
