# Escalations

- `data/loot-tuning-and-i18n`: `drop-table.schema.json` forbids top-level `noDropChance`/`numPicks`, and `monster.schema.json` forbids `nameKey` (`additionalProperties: false`). Per task constraints, schema files were not modified. The Act 1 baseline loot sim already passes the 10-fight sample target, so no drop-table data field was added; monster `nameKey` edits remain blocked pending schema owner approval.
