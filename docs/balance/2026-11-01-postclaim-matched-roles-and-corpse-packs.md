# Retained same-act pack sources and Corpse Explosion behavior

Status: seven additional equal-level recipes measured; full-v1 balance remains
unaccepted. Production code/data and authoritative earned saves are unchanged.

## Result

The role catalog moves from **75 matched / 65 unmatched** to **82 matched /
58 unmatched**. All 70 boss sources remain available; none of these pack tests
changes first-attempt boss eligibility or establishes population acceptance.

| Source build | Act / role | Actual hero and enemy level | Target duration, seeds 1 / 8 | Target minimum mana, seeds 1 / 8 |
|---|---|---|---|---|
| Summon Druid | IV trash | 45 / 45 | 5.480 / 5.480 s | 437 / 437 |
| Summon Druid | IV elite | 45 / 45 | 3.560 / 3.560 s | 437 / 437 |
| Corpse/curse Necromancer | III elite | 40 / 40 | 14.360 / 14.360 s | 203 / 204 |
| Cold Sorceress, historical Nova lineage | III elite | 30 / 30 | 8.808 / 7.600 s | 454 / 447 |
| Cold Sorceress, historical Nova lineage | IV trash | 46 / 46 | 17.600 / 13.600 s | 324 / 437 |
| Cold Sorceress, historical Nova lineage | IV elite | 46 / 46 | 14.800 / 13.200 s | 233 / 315 |
| Fire Sorceress | III elite | 40 / 40 | 7.018 / 8.520 s | 453 / 453 |

All 14 full-area attempts for these seven recipes won. This is a fixed-ordinal,
two-seed screen. It does not establish a win rate across challenge ordinals,
appropriate intended power, holdouts, manual/idle equivalence or pacing.

The cold sources retain their actual Blizzard/Static Field/Ice Blast orders.
Their historical profile name does not assert that Frost Nova supplied their
damage. The Necromancer identity remains the declared corpse/curse build.

## Source policy and preparation

Same-act post-claim repeat trash/elite sources are allowed. A first-act-boss
reward cutoff is inappropriate for every repeat pack test; first-attempt boss
rules remain separate. The retained sources have no known future-act progress
or discovered combat areas. Equipment payloads require bounded award/socket
paths; absence of future quest flags alone is insufficient provenance.

One forecast-only pass checked 144 source/act plans, 4,919 contexts and all
65 previously unresolved roles. Seven roles had retained conditional matches;
the other 58 had none. That pass ran no battles and changed no catalog counts.

Four roles were qualified using existing exact equipment paths. The other
three needed only three temporary identities outside the earlier boss equipment
index: `it-yga4-c16`, `it-vsmg-c0y`, and `it-4ahb9-2s6`. Three retained reports
provide the exact awards and three one-El socket debits. Independent path
readback preserves identification, affixes, rolls and socket contents; only
container/equip metadata is normalized. No original-journal rescan was needed.

The two Cold IV fixtures start from a legacy-overflow backpack of 13,904 items
and a stash of 493. Before combat, their disposable copies each use the native
bulk-discard action for the 13,869 normal/rare backpack items, leaving 35 unique
backpack items. Unique/set items, stash, equipped items, currencies, materials
and every other observed state field remain exact. The source save is unchanged.
This inventory-recovery cost is explicit; it does not certify fresh-campaign
inventory management or pacing. Other fixtures use native stash-only capacity
preparation where necessary. No gear, rank, points, core stats, resets, mercenary
or pack priority changes are made for the seven role recipes.

## Corpse Explosion behavior and the retained failure

The learned pack order for Acts IV/V is frozen in
`docs/plans/decisions/P15-corpse-pack-priority-v1.json`: Corpse Explosion,
Amplify Damage, Weaken. Native eligibility skips CE until a real corpse exists.
Boss priorities remain separate. Only Act IV behavior was measured here; the
Act V definition still needs its own behavior evidence when that fixture runs.

Two additional City of the Damned attempts use the existing level-50 Act IV
source and one native free priority change. They are behavior diagnostics and
never count as equal-level recipe coverage. Both win the first four waves and
lose wave index 4:

| Seed | CE casts across attempt | CE casts in failed wave | First enemy death in failed wave | Mercenary death | Hero defeat | Minimum mana in failed wave |
|---|---|---|---|---|---|---|
| 1 | 24 | 1 | 6.234 s | 9.960 s | 14.580 s | 371 |
| 8 | 24 | 0 | none | 3.320 s | 25.400 s | 390 |

All 48 casts follow actual enemy death/corpse availability and consume exactly
one corpse and 20 mana. Message `params.count` is the remaining corpse pool.
Seed 8 produces no corpse in the failed wave, so CE correctly remains ineligible.
The observed failure involves survival and first-kill generation with ample
mana; it does not justify a mana refill, injected corpse, global spell change
or automatic larger sample. The next investigation should inspect retained
mitigation/targeting/first-kill evidence and intended power before another trial.
Damage events lack a skill identity; this report does not assign all hero damage
or periodic damage to CE.

## Verification and retained artifacts

Both native batches completed: 16 attempts, 84 waves, 23.546 owned process
seconds. Independent readers check actual outcomes, logged damage, reward
deltas, no reward on defeat, target entry levels, seed-1 planned spawn counts,
prefix XP, equipment/point custody and 124 hero/mercenary carry boundaries.
Three altered CE controls reject invented corpses, changed mana charges and
changed corpse balances. Scoped TypeScript/lint checks pass.

The optional Act II input descriptor used a misspelled Seven Tombs quest ID.
The reader is corrected, and a metadata overlay corrects two descriptor uses.
Eligibility/planning never used that descriptor; the pinned 144 plans remain
unchanged, and all seven matches are Acts III/IV. No planning or combat replay
was needed for this correction.

The packet is
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Its controlling artifacts are:

- `p15-build-act-native-catalog-refinement-v9.json`: cumulative role catalog.
- `p15-postclaim-role-native-v1-readback-v1.json`: four recipe pairs plus CE IV.
- `p15-postclaim-origin-native-v1-readback-v1.json`: the other three recipe pairs.
- `p15-postclaim-origin-supplement-v1.json` and
  `p15-postclaim-origin-qualification-v1.json`: three targeted item paths.
- `p15-unmatched-source-inputs-metadata-v2.json`: optional descriptor correction.
- `p15-unmatched-role-next-v2.json`: 58 unresolved roles, grouped for reuse.
- `p15-boss-source-next-decision-v5.json`: next work and replay exclusions.
- `p15-postclaim-role-artifacts-v1.json`: process receipts and cleanup proof.

The initial forecast type failure, the first reader's absent-zero currency
format failure, and one catalog-script launch failure are retained. Corrected
checks pass; none caused a combat replay. Six disposable configs and two
redundant progress files are archived/removed after verification. Three launcher
caches are absent, and all owned processes are terminal.

## Remaining work

Unresolved roles are Act II 2, Act III 9, Act IV 19, Act V 28. No retained
conditional match remains among them. Reuse the frozen plans and earned
checkpoints for the next legal preparations; do not repeat the seven resolved
source studies or the equipment-origin scans.

Per-role intended power/acquisition/adaptation/RNG policies, the remaining
earned preparations, required population and disjoint holdouts, within-three
and manual/idle checks, economy/fairness/30–50-active-hour pacing, integrated
G0–G7 and the two-hour soak remain incomplete. Owner playtest follows
implementation. Browser access works; CI is excluded; no user answer is pending.
