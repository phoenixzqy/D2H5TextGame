---
name: game-data-schema
description: Validate and evolve JSON game-data schemas for monsters, items, skills, runes, runewords, and maps. Use whenever adding/changing files under `src/data/` or schemas under `src/data/schema/`.
allowed-tools: shell
---

# Game Data Schema Skill

All game content is JSON validated by Ajv against schemas in `src/data/schema/`.
The engine refuses to load invalid data on boot.

## Workflow

### Adding/editing data
1. Open `src/data/schema/<kind>.schema.json` and confirm the shape of your file matches.
2. If you need a new field, add it to the schema (with `description`) **before** writing the data.
3. Run the validator:
   ```sh
   npm run validate:data
   ```
4. Fix reported issues. Re-run until clean.

### Adding a new kind of data
1. Draft the schema as JSON Schema draft 2020-12 in `src/data/schema/<kind>.schema.json`.
2. Add a loader in `src/engine/dataLoader.ts` that ajv-compiles and caches the validator.
3. Add to the npm `validate:data` script (which uses `ajv-cli`).

## Schema conventions
- `$schema`: `"https://json-schema.org/draft/2020-12/schema"`
- `$id`: stable URL like `"d2h5://schema/monster"`
- `additionalProperties: false` everywhere — catch typos.
- IDs: kebab-case, namespaced: `monsters/act1.fallen-shaman`, `items/unique.shako`.
- Numeric ranges that grow per level are tuples: `[min, max]` with separate `growth: [min, max]` (matches `Diablo2TextGame.md` §怪物).
- Strings shown to players are i18n keys, not literal text. Field names: `nameKey`, `descKey`.

## Example: monster schema sketch
```json
{
  "$id": "d2h5://schema/monster",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "additionalProperties": false,
  "required": ["id", "nameKey", "family", "life", "lifeGrowth", "skills"],
  "properties": {
    "id":         { "type": "string", "pattern": "^monsters/[a-z0-9-]+\\.[a-z0-9-]+$" },
    "nameKey":    { "type": "string" },
    "family":     { "type": "string" },
    "life":       { "type": "array", "items": { "type": "number" }, "minItems": 2, "maxItems": 2 },
    "lifeGrowth": { "type": "array", "items": { "type": "number" }, "minItems": 2, "maxItems": 2 },
    "skills":     { "type": "array", "items": { "type": "string" } },
    "resists":    { "type": "object", "additionalProperties": { "type": "number", "minimum": -100, "maximum": 100 } },
    "immunities": { "type": "array", "items": { "type": "string", "enum": ["physical","fire","cold","lightning","arcane","poison"] } }
  }
}
```

## Don'ts
- Don't loosen `additionalProperties` to `true`.
- Don't store i18n strings inside the data file — use keys + `src/data/locales/`.
- Don't break a schema without bumping the save migration if it affects persisted state.
