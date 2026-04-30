# Add Monster Workflow

## Steps
1. **producer → game-designer**: confirm role (trash/elite/champion/boss), act, family, signature mechanic, design notes appended to `docs/design/monsters.md`.
2. **producer → content-designer**:
   - Add JSON entry under `src/data/monsters/<act>.json`.
   - Add i18n strings (`nameKey`, `descKey`, optional flavor) in `src/data/locales/{zh-CN,en}/monsters.json`.
   - Validate via `game-data-schema` skill.
3. **producer → engine-dev**: only if the monster needs a new skill/AI behavior the engine doesn't support; otherwise skip.
4. **producer → qa-engineer**: add to a balance scenario; run `combat-balance`; verify TTK band.
5. **producer → reviewer**: review; merge.

## Checklist
- [ ] Schema-valid JSON
- [ ] zh-CN + en strings
- [ ] Drop pool referenced and exists
- [ ] Resist/immunity flags consistent with family
- [ ] Appears in at least one map's spawn pool
