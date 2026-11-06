# BUG-792 — Restore ordinary usable armor tiers

- Status: Implemented locally; static data checks pass; owner gameplay validation deferred.
- Severity: Medium — multiple canonical armor upgrades have no ordinary source.
- Owner: root, solo content repair.
- Discovery: static comparison of bases.json and ordinary treasure-class rows.

Casque, Breast Plate, Chain Gloves, Light Gauntlets, Vampirebone Gloves,
Chain Boots, Light Plated Boots, Myrmidon Greaves, Heavy Belt and Plated Belt
have no ordinary drops. Other sources begin above the required usable tier or
stop at obsolete Normal level caps, leaving later levels with weaker armor.

Restore missing usable tiers for existing ordinary armor families within each
source's established finite level envelope. Keep every original entry, weight,
level band and specialized reward. Use established supplementary source weights;
for goblins use the existing ordinary supplemental weight of 10. Add no forced
rarity. Preserve item stats, requirements, sockets, save format and engine logic.

Verification: static schema/reference/coverage and exact predecessor checks only.
Owner explicitly stopped all gameplay testing; acquisition odds and pacing remain
unmeasured and are deferred to the owner's playtest.

Implementation and static results: [source report](../../docs/plans/evidence/p15-ordinary-armor-and-two-handed-tiers.md). No gameplay tests were run.
