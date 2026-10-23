# BUG-129 — Apply the nine approved runeword adaptations

Severity: High. Status: Open; shared contract/stat composition in progress.
Owners: content-designer, engine-dev, frontend-dev; root is the sole writer.

Reproduction: local HEAD d5e6cdc; Node/Vitest pure-engine reproduction,
browser/viewport/locale not applicable; no RNG is used by stat composition.

1. Run `npx vitest run --project engine src/engine/progression/runeword-adaptations.test.ts`.
2. Inspect the nine approved D10 authored grants and equip canonical Beast or
   Last Wish through the real hero/merc stat projection.

Expected: the D10 amendment's nine named adaptations are authored, validated,
and applied only to the equipped bearer. Beast scales complete ordinary Life
and attack speed; Fade adds six resistance values and magical dodge. Other
grants need their approved combat, active-skill and UI integration.

Actual: all nine lack structured grants; Beast and Fade have no approved stat
effects. Eleven tests fail causally (nine missing rows, two wrong projections).

Evidence: root-owned
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-runeword-adaptations-6ut43sa0/stat-red.log`.
Contract: `docs/plans/decisions/D10-material-economy-v1.md`, item-granted skill
adaptation amendment. Root cause: the runtime grant contract and aggregation
only implement Exile. Legacy `stats.grantsSkills` strings are inert.

No workaround supplies the promised effects. No campaign, balance or full-v1
acceptance follows from this reproduction or subsequent isolated controls.

Stat slice validated: all nine rows now have closed typed/schema grants;
Beast/Fade composition, masked native19 compatibility and bilingual details
are implemented. Full10898/396+2existing skips, engine5266/149, types/lint/build
and production20/20 pass. See `docs/plans/evidence/d10-beast-fade.md`.
The seven remaining combat/active integrations keep this bug Open.
