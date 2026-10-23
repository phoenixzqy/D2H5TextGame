# D11 H3 — Qualified Duriel credit and explicit quest-table Claim

Accepted2026-10-23 at `31eccc7`; producer contract and implementation plan READY,
security PASS. This continues P14/C2 without changing the full v1 objective.

Seven Tombs' existing ordered kill objective uses `monsters/act2.duriel` and
`areas/act2-tomb-of-tal-rasha`. Only an opened, tracked quest can receive a new
qualified victory. Existing recorded-wave provenance remains authoritative;
victory before opening is not banked or backfilled. No new access prerequisite.

Ordinary combat retains `loot/act2-boss`, combat XP and independent kill income.
Explicit Claim separately grants12000 hero XP, the existing9000 fielded-merc XP
share, and a quest-table bundle once. Its closed authored profile is
`{tableId:"loot/duriel-q",ilvl:32,picks:5}`. Canonical table IDs, positive safe
integers and no extra fields are required at execution; the schema retains
legacy string syntax but strings remain unsupported for execution.

Level32 matches the actual manual challenge chapter boss: area25 + difficulty2
+ chapter-boss5. The raw authored encounter27 is not the manual runtime level.
Five independent picks with replacement use noDrop0, MF0 and multiplier1.
No live gear, player level, location, clock, idle bonus or gold-find contributes.
Every attempt starts a private seed:
`hashSeed(JSON.stringify(['quest-loot-table-v1',player.id,quest.id,tableId,ilvl,picks]))`.
Same identity/profile/catalog reproduces properties and quantities; item IDs may
advance after failed preparation/publication. Never rewind the allocator.

Extract TC-only materialization from the kill orchestrator, preserving selection
before materialization and ordinary output/following RNG. Ordinary missing item
materialization retains its existing skip behavior and exceptions propagate.
The strict quest path refuses unknown/empty/ineligible tables, missing selections
or failed materialization as a whole bundle. Exceptions become grant-failed at
Claim's private preparation boundary. No independent kill-income roll occurs.

Existing TC semantics apply: authored forced equipment rarity, aggregate rune
rewards and gold entries converted to rune shards. This does not promise an exact
socketable Io or guarantee equipment/unique selection. Only new table currency
grants normalize to inventory IDs: runes+runeShards→rune-shard, gems→gem-shard,
wishstones→wishstone. Existing direct numeric quest rewards keep their targets;
positive standalone gold remains unsupported. Aggregate by actual destination
and preflight combined safe totals before any publication.

Parse and validate the whole bag before rolling. Private deterministic preparation
precedes participating snapshots and guarded writes. Retain lossless backpack
overflow, add all items and mark claimed last. Shared quest locking, typed guards,
hydration/import refusal, safe XP/merc arithmetic and participating rollback
remain in force. Mutation-then-throw currency/item/claim publications restore all
participating slices and preserve unrelated quest writes; failed restoration is
explicit. No crash or observer-wide atomicity claim. No new save fields/version.

Preview uses a localized reward-cache label without rolling, raw profile data,
generation level or a promised identity. Acceptance requires canonical qualified
settlement/no-backfill controls, actual ordinary boss32/table regression, fixed
table semantics and ordinary output/RNG oracles, actual once-only Claim, mixed
bag/refusal/overflow/rollback/retry/nesting/persistence tests, and bilingual
production Claim/save proof. Constructed fixtures establish integration only;
earned Duriel victory and ActII/C2 acceptance remain separate required work.
