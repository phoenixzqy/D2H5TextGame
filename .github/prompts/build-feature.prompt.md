# Build Feature Workflow

A reusable PM playbook for building any new feature in the D2 H5 Text Game.

## Inputs
- **Goal**: one-line user-facing description of the feature.
- **Acceptance criteria**: checklist of observable behaviors.

## Steps
1. **PM**: read `Diablo2TextGame.md` + `.github/copilot-instructions.md`. Confirm scope with user if ambiguous.
2. **PM → game-designer**: produce/update spec under `docs/design/<feature>.md` if the feature involves combat / skills / items / progression.
3. **PM → architect**: only if new dependencies, new top-level folders, or build/PWA changes are needed.
4. **PM → content-designer**: add/extend JSON data + i18n strings (validate via `game-data-schema` skill).
5. **PM → engine-dev**: implement engine changes with Vitest tests.
6. **PM → frontend-dev**: build/extend the UI. Verify via `mobile-responsive-check` skill.
7. **PM → qa-engineer**: ensure unit + E2E coverage; if balance-touching, run `combat-balance` skill.
8. **PM → reviewer**: request review.
9. **PM**: address blocking review items; loop steps 5–8 until approved.
10. **PM**: report ✅ / 🚧 / ⏭️ to user.

## Done definition
- Reviewer approves
- CI green (typecheck + lint + vitest + build + Playwright smoke)
- i18n complete in zh-CN and en
- Mobile check passes
- New/changed save state has a migration if persisted
