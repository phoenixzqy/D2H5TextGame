# Content Delivery Report

**Author:** content-designer agent
**Scope:** Full Wave 2 content corpus — `src/data/**`
**Status:** ✅ Lint clean · ✅ All 167 tests pass · ✅ All schemas validate

---

## 1. Files delivered

### Game data JSON (33 content files)

| Category    | Files | Total entries |
| ----------- | ----: | ------------: |
| Skills      |     9 |           150 |
| Monsters    |     5 |            51 |
| Items       |     7 |           285 |
| Maps        |     6 |            34 |
| Quests      |     2 |             2 |
| Loot        |     2 |            39 |
| Gacha/Mercs |     2 |            26 |
| **Total**   |  **33** |       **587** |

Detailed breakdown:

| Path                              | Entries |
| --------------------------------- | ------: |
| `skills/amazon.json`              |      10 |
| `skills/assassin.json`            |      10 |
| `skills/barbarian.json`           |      10 |
| `skills/druid.json`               |      10 |
| `skills/necromancer.json`         |      10 |
| `skills/paladin.json`             |      10 |
| `skills/sorceress.json`           |      10 |
| `skills/mercenary.json`           |      29 |
| `skills/monsters.json`            |      41 |
| `monsters/act1.json`              |      11 |
| `monsters/act{2,3,4,5}.json`      |  10 ea. |
| `items/bases.json`                |      60 |
| `items/affixes-prefix.json`       |      60 |
| `items/affixes-suffix.json`       |      61 |
| `items/uniques.json`              |      40 |
| `items/sets.json`                 |       6 |
| `items/runes.json`                |      33 |
| `items/runewords.json`            |      25 |
| `maps/acts.json`                  |       5 |
| `maps/sub-areas/act{1,2,3,5}.json`|   6 ea. |
| `maps/sub-areas/act4.json`        |       5 |
| `loot/treasure-classes.json`      |      38 |
| `loot/mf-curve.json`              |       1 |
| `gacha/mercenaries.json`          |      25 |
| `gacha/banner-config.json`        |       1 |
| `quests/main.json`                |       1 |
| `quests/side.json`                |       1 |

### JSON schemas (12)
`act`, `affix`, `drop-table`, `item-base`, `merc`, `monster`, `rune`,
`runeword`, `set`, `skill`, `sub-area`, `unique`.

---

## 2. Schema validation

All 33 data files load through `src/data/loader.ts` → `buildDataMap()` →
`validateData()` (Ajv) using the matching schema in `src/data/schema/`.
The loader is exercised by `src/data/loader.test.ts` (11 tests) and by
the integrity suite below — every entry of every dataset is validated on
load. **0 violations.**

Datasets currently surfaced as opaque (`ReadonlyMap<string, unknown>`)
because their TS types are not yet wired up in `loader.ts`:

- `uniques` — schema validated, type pending (`TODO: type after unique impl`)
- `mercenaries` — schema validated, type pending (`TODO: type after merc impl`)
- `dropTables` — schema validated, type pending (`TODO: type after drop impl`)
- `quests` — **no schema yet**, validated only for `id: string` uniqueness

---

## 3. Test results

```
Test Files  14 passed (14)
     Tests  167 passed (167)
  Duration  ~2.5s
```

Content-relevant suites:

| Suite                                        | Tests |
| -------------------------------------------- | ----: |
| `src/data/__tests__/data-integrity.test.ts`  |    27 |
| `src/data/loader.test.ts`                    |    11 |

The integrity suite cross-references IDs across datasets:
mercenary→skill, runeword→rune, unique/set→item-base, sub-area→act,
sub-area→monster, drop-table references, quest area refs, etc.

---

## 4. TODOs for engine-dev

1. **Type the opaque maps.** Add concrete TS types and pass them through
   `buildDataMap<T>` for `uniques`, `mercenaries`, `dropTables` (see
   `loader.ts:76,82,83`). Schemas already exist.
2. **Quest schema + types.** No `quest.schema.json` yet. Loader currently
   only checks `id` uniqueness (`loader.ts:246-260`). Author a schema and
   wire it in once quest mechanics are designed.
3. **Skill implementations.** 150 skill entries are authored and reference
   only data fields the schema enforces. The runtime resolvers for new
   skill effect types (e.g. percent-based debuff scalers, summon caps,
   aura stacking rules) need to be implemented in `src/engine/skills/`.
   A follow-up audit per class is recommended before balance pass.
4. **Mercenary signature skills.** Verified to resolve to defined skill
   ids (integrity test at line 215). Engine still needs to honor mercenary
   `skills[]` ordering / cooldown profile.
5. **Runeword recipe ordering.** `rw.runes` is validated to reference real
   runes (line 326). Insertion-order semantics (does Stealth require Tal
   *then* Eth?) must be implemented in the crafting flow.
6. **Drop table chain resolution.** Treasure-class entries can reference
   sub-tables; engine needs a deterministic resolver fed by
   `engine/rng.ts`.
7. **MF curve consumption.** `loot/mf-curve.json` is a single-entry
   document; the rarity upgrade pipeline must read it instead of
   hardcoding constants.
8. **Sub-area → monster pool.** Verified at integrity test level, but the
   spawn weight / level-scaling formula is not yet wired.

---

## 5. Known limitations / spec-vs-schema deltas

- **No quest schema.** Per §4.2. Quest JSON is intentionally minimal until
  the quest system design is finalized by `game-designer`.
- **`async loadGameData`.** Currently synchronous under the hood (data is
  bundled via `import.meta.glob`). The async signature is preserved for a
  future network-backed content-pack flow; the lint suppression is
  documented inline at `loader.ts:189`.
- **No localization split.** Player-visible strings still inline in JSON
  for some entries. i18n extraction (`src/i18n/`) for content strings is
  pending — see `frontend-dev` follow-up.
- **Per-class skill counts capped at 10.** Spec lists 30 skills/class
  (D2 parity). Wave 2 ships top-tier representatives only; remaining
  20/class will land in Wave 3.
- **Acts capped at 5.** Matches D2 LoD baseline; expansion content
  (Act 6 / Uber) intentionally not in scope.
- **No per-entry `i18nKey` cross-check yet.** Integrity suite does not
  verify that every translatable string has a key in `src/i18n/locales/`.

---

## 6. Running the integrity tests (for QA)

```bash
# Lint only
npm run lint

# Loader + integrity suites only (fast, ~1.5s)
npx vitest run src/data

# Full suite incl. engine
npx vitest run

# Watch mode while editing JSON
npx vitest src/data
```

Failure modes to expect when authoring new content:

| Failure                                  | Fix |
| ---------------------------------------- | --- |
| `Duplicate id "X" in <dataset>`          | Pick a unique id |
| Ajv validation error on load             | Match the schema in `src/data/schema/` |
| Cross-reference test failure             | Ensure the id exists in the referenced dataset |
| `Quest at quests/...[N] is missing string id` | Add `id: string` |

---

**Hand-off:** ready for `reviewer` sign-off and `qa-engineer` to fold into
the regression baseline.
