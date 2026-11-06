# BUG-775 — Implement selected Act V champion elemental immunity

Status: fixed locally, uncommitted; mechanic verification complete, browser art warning remains separate.
Severity: Medium — selected champion challenge is missing; campaign remains playable.
Owner: root, acting as game-designer/content-designer/engine-dev, solo.

## Reproduction

- Base HEAD: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, inherited dirty
  `feat/playable-foundations`, Linux/WSL, 2026-11-05.
- Seed 775; actual monster JSON and native factory, L60, champion tier.
- Browser/viewport/locale do not cause the engine defect. Bilingual browser
  presentation will be verified after repair.

1. Build champion Blood Lord and Frozen Terror using their actual definitions.
2. Inspect damage immunities and resolve respectively fire/cold damage.
3. Compare their ordinary trash-tier versions and a different damage type.

Expected: monster-spec§10 reserves full elemental immunity for selected Act V
champions; the concrete selection/tier rule is recorded in
`docs/plans/decisions/P15-act5-champion-immunity-v1.md`. Champion Blood Lord
rejects fire and champion Frozen Terror rejects cold, with an explicit visible
label. Ordinary variants retain their75% resistance and take positive damage.

Actual: no Act V row authors any damage immunity; both champion variants take
matching damage under the75% numeric cap, exactly like ordinary variants.

## Cause and evidence

The named boss immunity infrastructure exists, but all-tier metadata alone
cannot express a champion-only exception without making ordinary trash immune.
Add optional champion-only authored metadata and compose it in the existing
factory. Do not infer immunity from IDs, names, resistance values or elite labels.

Regressions: `src/engine/combat/act5-champion-immunity.test.ts` and
`src/stores/combatHelpers.champion-immunity.test.ts`.
Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-act5-champion-immunity-hmslxzhh`.
Root retains this exact packet through full-v1 acceptance and removes it once
all consumers finish. Constructed mechanic evidence adds no earned campaign,
balance/pacing acceptance or new sample/retry budget. No player action needed.

## Correction and verification — 2026-11-05

Optional authored `championDamageImmunities` composes with all-tier immunity
only for actual champion tier, through the existing factory. The resulting
metadata is copied, deduplicated and frozen. Numeric resistance stays75;
ordinary variants still take matching damage. Native manual guards reach the
Frozen Terror selection; native idle Arreat Plateau wave2 reaches Blood Lord
at seed775/ordinal5/pity11. Planner and identities were preserved.

Twenty engine, three store and five immunity UI cases pass; affected immunity,
factory and Act V priority regressions pass. BUG776 records the separately
corrected delivery fixtures. Scoped strict types, changed-file lint and strict
validation of all11Act V rows pass. Four bilingual mobile/desktop Chromium views
pass mechanic/label/overflow assertions, then the driver fails its zero-warning
assertion on missing Blood Lord/Frozen Terror art mappings. No browser exception
or failed request occurs. Existing BUG309 deliberately uses readable fallback
portraits for absent art; no substitute art or suppressed warning was introduced.

See [complete evidence](../../docs/plans/evidence/p15-act5-champion-immunity.md).
Review is root self-review only; full-v1/independent acceptance remains open.
