# Ordinary armor and two-handed source implementation — 2026-11-05

Owner instruction: no gameplay execution, simulations, browser playthroughs or
soak runs. The following results are static data checks only.

## Production changes

BUG792 appends 154 ordinary armor rows across 23 existing source tables. It
covers the canonical six-tier head, chest, gloves, boots and belt ladders in
existing source families, intersected with established finite table envelopes.
This supplies the previously missing Casque, Breast Plate, Chain Gloves,
Light Gauntlets, Vampirebone Gloves, Chain Boots, Light Plated Boots,
Myrmidon Greaves, Heavy Belt and Plated Belt ordinary drops.

BUG793 appends 24 ordinary two-handed rows across nine existing source tables.
It restores War Pike and Giant Thresher and fills missing usable bands of the
existing six-tier two-handed ladder. The separate five-socket Battle Scythe
source is preserved. No new weapon bases or mastery rules are introduced.

Original table fields, row order, weights, quantities, fixed rewards and level
bands remain exact. Existing base stats, requirements, sockets, schemas, save
format and production loot logic remain unchanged. Added ordinary rows omit
forced rarity. Source weights reuse the previous supplementary family weights;
goblins use their existing ordinary supplemental weight of 10. Additional rows
change relative odds; no drop-rate, acquisition-time or balance claim follows.

## Static results

- Final `npm run typecheck` passes for both application and Node projects.
- Scoped ESLint passes for the changed source, reconstruction helpers and
  loot/projectile fixtures. Campaign fixtures are lint-ignored and compile;
  none were executed. Final touched files pass `git diff --check`.
- All 38 treasure classes and 100 item bases pass their existing strict schemas.
- Every treasure-class base reference resolves.
- Armor coverage: 3,254 family/level positions across 26 existing source tables.
- Two-handed coverage: 544 source/level positions across ten existing tables.
- Each added row has a positive weight, an equip-legal lower bound and no
  overlap with an existing ordinary row for that same base.
- Removing exactly the declared two-handed suffixes reconstructs its entire
  predecessor; removing the armor suffixes then reconstructs its predecessor.
  The earlier shield predecessor also retains its exact SHA256.
- Historical claw/shield/MF/Hell source comparisons compose the new declared
  deltas. Their previous hashes and assertions remain intact. They were not run.

Machine-readable frozen deltas, used only for historical reconstruction:

- `tests/fixtures/armor-progression-v1.json`
- `tests/fixtures/two-handed-progression-v1.json`

The initial inline no-overlap check incorrectly included fixed goblin unique
rows; the corrected check distinguishes ordinary and fixed sources and passes.
No production data was changed to satisfy that mistaken check. An intermediate
TypeScript error from widened JSON `type` strings was corrected in the
historical adapter with the explicit item discriminant.

No gameplay tests, campaigns, combat/equip/craft operations, simulations or
browser checks were started for these changes. Owner playtesting, balance,
acquisition odds and 30–50-hour pacing remain deferred. No disposable files or
processes were created by the inline schema/reference checks.
