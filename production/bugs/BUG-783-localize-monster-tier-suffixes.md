# BUG-783 — Localize monster name tier suffixes

- Status: Implemented locally; gameplay validation deferred by owner.
- Severity: Low — tier remains understandable, but bypasses localization.
- Owner: root, frontend/store presentation responsibility, solo.
- Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus inherited local changes.
- Environment: WSL/Linux, Chromium147, zh-CN,360×640; English1280×800 control.
- Factory seed:7; constructed display fixture, not earned progression.

## Reproduction

1. Build the native level28 Summoner with the factory-generated monster ID.
2. Display that unit on CombatScreen in zh-CN.
3. Inspect the localized name under the monster artwork.

Expected: player-visible tier suffixes pass through i18next alongside the name,
consistent with the repository's localization rule. Preserve instance letters
that distinguish multiple monsters.

Actual: the localized name retains the engine's literal English `(Boss)`.
`resolveMonsterDisplayName` in `src/stores/combatHelpers.ts` appends the raw
engine suffix; the factory also authors a literal `(Elite)` suffix. The latter
path is source-inspected, not separately browser-reproduced here.

Evidence: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-summoner-cadence-l42tj9uu/teleport-card-zh-CN-360.png`.
The packet is retained by root through full-v1 review; no additional browser,
combat, campaign or diagnostic budget was used to discover this issue.

The Summoner Teleport correction is separately complete under BUG782. This
cosmetic follow-up does not reopen its finite checks or block continued
gameplay/progression implementation. The shared name formatter now translates tier suffixes through combat:tier.boss /
combat:tier.elite in both locales, preserving instance letters and engine identity.
Cards and logs use the same formatter. No gameplay or browser checks were run.
