# D05 — Global Necromancer summon passives

Authored Summon Mastery unlock30/cap20 grants5% life and2% Attack per allocated
rank. Summon Resist unlock24/cap20 grants2 percentage points to each of the six
engine resistance types per rank (physical/fire/cold/lightning/arcane/poison).
Keep the existing damage resistance cap/act penalties. Both exact authored and
canonical aliases resolve max-once, ignoring invalid allocations, clamping caps.
Only eligible Necromancers qualify; Resist also requires eligible learned Golem
Mastery, including its existing Clay prerequisite. No implicit rank or active slot.

Recipients: newly created owned skeleton, skeletal_mage, clay/blood/iron/fire_golem
and revived. Exclude enemy/foreign units, mercs and other classes' templates.
Sum same-stat local/global percentage bonuses over fresh rank-scaled stats,
after Iron item inheritance; retain fractional stats. Preserve Golem flat Attack
Speed and Skeleton Defense. Fresh current life initializes to the new maximum.
Already-created/damaged summons and hero resources never retrofit or refill.

Capture immutable owner-bound wave tuning through the production adapter. All
three creation sites (ordinary summon/Revive, prepared batches, selected-item Iron)
share fresh composition. Preserve identity/cap/corpse/payment/cooldown/RNG/grid,
Iron attestation/debit and locked replay. Ordinary allocations affect next wave;
unlocked explicit replay uses its original resource baseline. No save change.

Display current/next passive scaling, accurate bilingual descriptions and fresh
summon previews using the same arithmetic, including all six resistance rows.
Rank1/cap, local/global addition, seven templates, malformed/foreign controls,
preloaded summons, costs, determinism and native next-wave/replay/reset must pass.
Then focused/engine/full/types/lint/build and targeted production browser checks.
Freeze source and Git state during the full suite. No earned balance acceptance
from constructed fixtures. Security check: pass. Root plan review: ready.
