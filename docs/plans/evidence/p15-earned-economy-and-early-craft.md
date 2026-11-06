# P15 — Earned Act II economy and early caster conversion

Verified 2026-11-05 in the existing claimed `feat/playable-foundations`
worktree. Four retained branches reconcile their currency/material receipts;
one copied Fire terminal save then completes a fixed owned-material craft
through production transaction APIs. No production source, economy policy,
combat, completed campaign, probability sample or browser task is repeated.
Full P15 economy, active-hour pacing and balance acceptance remain open.

## Authored Normal faucet and sink budget

These are finite potential grants after earning and claiming them, before
spending. They exclude kill income, repeat bounty materials and other
difficulties. They are not observed player income or a time-to-afford estimate.

| Act | Main quest wishstones | Finite side wishstones | Core first-clear wishstones | Total |
| --- | ---: | ---: | ---: | ---: |
| I | 105 | 50 | 30 | 185 |
| II | 95 | 50 | 30 | 175 |
| III | 90 | 40 | 30 | 160 |
| IV | 65 | 30 | 25 | 120 |
| V | 95 | 50 | 30 | 175 |
| Total | **450** | **220** | **145** | **815** |

Main quests plus 29 core clears supply595potential wishstones. Recruitment
costs10for one draw or90for ten; first SSR is guaranteed by draw50. Without
other spending,595funds60bulk draws and815funds90bulk draws. Neither budget
establishes when a player earns the currency or guarantees a particular merc.
Stat and skill resets each have three independent free uses, then cost5wishes
per reset. Current bounty Claims directly grant one gem-shard, not wishstones.

The retained ledger records counts of28gem-fusion,35gem-dismantle and32rune-fusion
recipes with authenticated policy sources, salvage/insertion and exact special costs: armor sockets
use Hel/Amn/perfect topaz; clearing uses Hel/flawed skull/100rune-shards;
caster amulet uses Ral/perfect amethyst/20scrap/1,000rune-shards. Fusion needs
three lower gems and one gem-shard per operation. Lower-gem stock and surplus
dismantling catalysts matter: zero direct perfect gems does not prove scarcity.

## Observed branch accounting

The read-only ledger authenticates reports, journals, exports, readbacks,
analysis/ancestry and matching current economy-policy hashes. It applies
captured deltas chronologically, refuses negative balances and reconciles every
terminal material/currency amount. Existing ancestral costs and inherited
wallets remain charged; starting balances are not credited as new branch income.

| Branch | Outcome | Combat minutes | Wishstones start → end | New Claims / clears / other combat wishes |
| --- | --- | ---: | ---: | --- |
| Bow | Act II complete | 26.06635 | 172 → 308 | 95 / 30 / 11 |
| Double Swing | Act II complete | 7.22033 | 98 → 233 | 95 / 30 / 10 |
| Fire | Dry Hills nonwin | 24.51170 | 4,290 → 4,315 | 0 / 5 / 20 |
| Summon Druid | Act II complete | 4.29861 | 4,270 → 4,395 | 95 / 30 / 0 |

"Other combat" is the aggregated reward receipt, not independently derived
kill-only income. Combat minutes exclude player reading/navigation/decision
time. Fifteen corruption controls reject changed terminal wishes, omitted
paid Claims, unfunded clears and corrupted input hashes. Complete gacha and
recruitment endpoint equality supports zero pulls in these branches. The zero
`recordedCubeRecipeOperations` count describes captured action vocabulary;
it is not proof about arbitrary unrecorded actions. Socket insertions are28,
26,0,0respectively and all salvage/material receipts remain in the ledger.

## One early earned native craft

Fire's exact level16/Normal next167 terminal export supplies all stock and the
target. The frozen policy selects the lowest lexical native-eligible owned,
unequipped, identified magic amulet with empty contents before any output
preview. Three earlier candidates are refused by native target validation;
`it-65r0t-3oi`, a level12 brass amulet, is eligible except for the declared
perfect-amethyst shortage. No target is selected from its rolled result.

Exactly21successful operations advance material ordinal68→89:

1. Dismantle7flawed sapphires into14gem-shards.
2. Fuse27flawed amethysts into9normal, then3flawless, then1perfect amethyst
   through13paid fusion operations.
3. Craft the chosen amulet once. It becomes rare with fixed Energy5/Mana20;
   the two legal random affixes roll magical dodge3and physical resistance8.

Aggregate net stock changes are flawed sapphire−7, flawed amethyst−27,
scrap−20, Ral−1, gem-shard+1and rune-shard−1,000. All other balances stay exact,
including4,315wishstones. Rune-shards704,531→703,531. The perfect gem is created
and consumed once. Target identity/base/level stay exact. Independent checks
against the source preserve ordered backpack/stash custody, every unrelated
item and socket quarantine. Full native snapshots preserve other gameplay
domains. Duplicate final request is a no-op; stale first request is refused.
Export/decode/rehydration is exact and the outer store realm is restored.

A temporary native equip against the current tin amulet succeeds. It projects
Life446→440, Mana345→352, magical dodge10%→12%, physical resistance23→31,
critical chance10%→8%and arcane resistance19→14; all other derived stats stay
exact. Equipment Energy contributes through composition without rewriting
allocated core stats. Current Life120/Mana102does not refill. This is a
tradeoff, not a guaranteed upgrade or victory. The retained crafted successor
restores the amulet to its original unequipped location. No browser/IndexedDB,
combat improvement, earliest-affordability, population or active-time claim
follows. Fire's exhausted three-attempt Dry Hills nonwin remains unchanged.

## Verification, review and retention

Required packet, retained by root through full-v1 acceptance:

`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-p15-earned-economy-va_h_fxd`

`ledger.json`/`run-result.json` pass. `craft-result.json`/`craft-export.json`
retain the one native result and exact costs/custody/projection; `craft.log`
and `craft-process-exit.json` prove terminal success. Scoped strict types
cover877files with zero diagnostics in `craft-types-v4.json`. Earlier external
wrapper/driver type errors remain retained; none was a production gameplay
failure. Producer's bounded source review found preview-derived custody
expectations insufficient; independent source-based checks address it, and
the follow-up review is ready with no remaining material finding. This is
not independent final QA. Review metadata was finalized after execution;
the fixed operation budget, selection rule and authenticated inputs did not
change. Security review passes for the local copied-save transaction scope.

The native launcher PID83260is absent and its exact `craft-vite-cache` is
removed/absence verified. No disposable task paths remain. `completion.json`
records exact retained ownership/hashes; root owns eventual cleanup after all
consumers finish. No broad suite, build, CI, commit, push or worktree release.

Counts remain14/14historical intended Normal completions,210/210supplemental
checkpoint sources and formal balance0/210. Full privatev1, broader economy/
acquisition/30–50active-hour pacing, population fairness, difficulty/endgame,
mobile/a11y/performance/PWA/soak and independent acceptance remain incomplete.
