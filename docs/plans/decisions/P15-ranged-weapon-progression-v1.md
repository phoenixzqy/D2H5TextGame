# P15 — Ordinary ranged weapon progression

BUG502 confirms the normal/magic/rare Bow upgrade path ends at the training
bow's level10 ceiling. Private-v1 G4 requires attainable, useful gear choices.
Root owns this local content change; current-source tuning is authorized.

Add bow/crossbow equipment to all28 campaign tables that already contain
ordinary weapons: trash, champion, unique, mini, boss and the three weapon-bearing
quest tables. Retain all existing entries, weights, level bands and ordering;
append the new picks. Goblin and material-only/service tables are unchanged.
The tutorial below10 retains its original distribution.

Each new family has weight one eighth of that table's existing ordinary weapon
weight. Two eligible families therefore add25% of its original weapon weight,
not25% of the whole table. At10–14 only Bow is equip-eligible. This increases
ranged weapon access and dilutes existing drop probabilities proportionally;
it does not increase picks, bypass no-drop, force a gift or change rarity/MF.
The fixed per-table values are recorded in `tests/fixtures/ranged-progression-v1.json`.
Numeric weights remain provisional pending full economy/pacing signoff.

| Monster level | Bow / crossbow | Equip level | Physical range | Sockets |
| --- | --- | --- | --- | --- |
| 10–23 | Existing Bow / Crossbow | 10 / 15 | 10–24 / 16–34 | 2 |
| 24–34 | Composite Bow / Heavy Crossbow | 24 | 22–48 | 3 |
| 35–51 | Great Bow / Siege Crossbow | 35 | 32–62 | 4 |
| 52+ | Ward Bow / Demon Crossbow | 52 | 50–95 | 5 |

New tier damage and sockets mirror the existing War Pike, Giant Thresher and
Colossus Blade curves; preserve their damage calculations and affix eligibility.
Both ranged families retain two-handed delivery and use the existing bow icon.
New names have zh-CN/en keys. Existing ranged bases, unique/set bindings and
persisted items retain their stats and IDs; no save-format change is needed.

Intersect each tier with the table's existing equipment envelope and its
base's equip level; stop at the table's finite D08 ceiling. Normal/magic/rare
rarity follows the source table. Low-level equipment in the old pool remains
possible; this change does not guarantee every drop is an upgrade.

D08's unchanged weighted-pool/seed contract described the earlier Hell ceiling
extension. P15 intentionally revises current loot. Its tests continue to verify
the exact original D08 component after subtracting the independently declared
P15 append-only delta; an exact full-JSON assertion prevents unrelated edits.
Current-source ranged tests separately verify finite eligibility, actual
seeded awards, real base stats, localization and icons. Old fixtures/reports
remain immutable. Earlier Act II checks now include the two newly eligible
ranged bases rather than asserting an obsolete five-base-only pool.

Plan review: ready. The scope covers actual ordinary/replay source levels,
late gear power, native requirements/rarity, immutable old saves, historical
test semantics and explicit economy risk. Use affected data/loot cases only;
no older campaign replay. Resume earned1466 with35 prior actions. Acquire
only new native gear, equip it through the normal service, then attempt Izual.
Do not grant weapons or assume a particular tier proves later-act viability.
