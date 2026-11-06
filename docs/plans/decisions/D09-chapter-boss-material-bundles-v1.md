# D09 — Complete chapter-boss rune and gem quantities

2026-11-04. Owner: root. Implementation slice under BUG680; full boss loot,
economy/pacing and private-v1 acceptance remain open.

`drop-tables.md` §5 lists separate guaranteed material quantities. Currently a
boss instead receives five mixed TC picks and the D10 one-rune/one-gem baseline;
its required gems and rune bands are not guaranteed. Implement the material
portion at the kill award boundary, using schema-validated policy keyed by the
five authored chapter-boss tables and the actual chapter-boss tier/act.

| Boss | Rune quantity | Rune pool act | Inclusive rune band | Gem quantity |
| --- | --- | --- | --- | --- |
| Andariel | 1 | II | Ith–Tal (ordinals 6–7) | 2 |
| Duriel | 1–2 | III | Ral–Hel (8–15) | 3 |
| Mephisto | 2 | IV | Hel–Lem (15–20) | 4 |
| Diablo | 2–3 | V | Ko–Pul (18–21) | 5 |
| Baal | 3–5 | V | Pul–Zod (21–33) | 8 |

The reversed “Tal..Ith” endpoints in §5.1 are normalized by canonical rune
ordinal. Use D10's existing weights within the band, intersected with source
act, difficulty and tier caps. Baal therefore stops at Um outside Hell; no
Mal+ drops on Normal/Nightmare. Gems use the actual act and existing quality
weights/cap folding; perfect gems remain Act V Hell only. Multiple materials
are independently sampled and repeated identities aggregate into safe stacks.

For these five live chapter bosses only, this replaces D10's independent
one-rune/one-gem quantity contract. Remove their ordinary TC rune/gem choices
before selection so materials cannot be randomly duplicated outside the bundle.
Their TC equipment, currency and existing additional rarity guarantees remain
available; the separate ordinary/jewelry counts and optional unique/first-kill
rules still need implementation. D10's normal secondary path remains exact for
every unconfigured table/tier, including minibosses/goblins. Quest-cache calls
bypass the live policy and retain explicit/generic material entries unchanged.

Keep the first two secondary identity draws and shard variance in their current
positions. Reuse those two variates for the first rune and gem; draw quantity
only for a variable range, then further identity draws for additional units.
Additional draws/filtering change this boss's later shared loot stream; old
earned saves and past evidence are not replayed or relabeled. Wishstone chance,
amounts, shard formula and save schema are unchanged.

Plan review: ready after accounting for the D10 conflict, duplicate TC materials,
actual-act validation, bounded quantities, range/cap intersection and quest
isolation. Verify real-pool exact counts/bands on all three difficulties, forced
endpoints/aggregation, invalid policy rejection and native inventory publication.
Run only affected loot/material/settlement checks plus scoped types/lint/build.

Security check: pass. Local authored reward data and deterministic generation;
no dependency, credentials, permissions, external publication or migration change.
