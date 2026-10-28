# BUG-355 — Supply native acquisition for the remaining advertised high runes

- Status: Open — common-root Hell replay contract ratified; H1 compatibility next.
- Severity: High — seven materials required by advertised runewords have no
  native acquisition path under the shipped replay modes.
- Found: 2026-10-27.
- Build: `520d0e4bb76f15902e1399aaad1ad9e31f5ba9d8`.
- Owner: `game-designer` / `content-designer` / `engine-dev`; producer coordinates.
- Environment: source/content characterization in the current TypeScript game;
  browser, viewport, locale and combat seed are not applicable. No gameplay ran.

## Reproduction

1. Read `ReplayProfileId` in `src/engine/types/save.ts`: only `normal` and
   `nightmare` are shipped profiles.
2. Resolve `sampleMaterial` in `src/engine/loot/materials.ts` against
   `src/data/loot/material-economy.json`. For both profiles, every ordinary rune
   pool is capped at ordinal22 (`runes/um`), including Act V boss pools.
3. Read rune-fusion eligibility in
   `src/engine/crafting/material-actions.ts`: those same profiles refuse any
   output above that cap, even with sufficient owned inputs.
4. Enumerate explicit canonical rune IDs in authored loot, quest and endgame
   reward JSON, excluding the sampler's catalog/order definition. The existing
   explicit sources top out at Vex (ordinal26). Worldstone completion/achievement
   rewards contain gems only, and its ordinary loot profile is Normal.
5. Compare the remaining seven runes with the advertised recipes. Enigma, for
   example, requires Jah/Ber; Breath of the Dying requires Zod.

## Expected

D10 retains all33 runes, all32 rune-fusion recipes and all35 runewords. Each required input has a real
earned acquisition route, followed by ordinary UI crafting, useful combat
effects and persistence. Normal/Nightmare caps and existing explicit source
exceptions remain deliberate rules, with any additional exception documented
and reviewed before implementation.

## Actual

Ohm, Lo, Sur, Ber, Jah, Cham and Zod have neither an eligible ordinary pool nor
an allowed fusion output nor an authored alternative reward source. Catalog
presence, material import and constructed crafting fixtures do not establish
native acquisition. The corresponding advertised runewords are unreachable
from earned state through the current sources.

## Evidence and repair boundary

The missing live Hell replay blocks both acquisition and the eleven fusion
outputs above Um. A completion rune cache would supply inputs while leaving
those recipes unreachable. Review direction is real +40 level-only Hell,
derived from the existing full validated claimed-Eve source authority, with
native24 progress and frozen23 compatibility. Ratified contract/ADR/plan:
`docs/design/hell-replay-contract.md`,
`docs/decisions/ADR-013-source-backed-hell-replay.md`, and
`docs/plans/hell-replay-implementation.md`. No runtime repair exists yet.

Read-only source characterization, including twelve input hashes, is retained
as `source-characterization.json` in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-high-rune-source-gux7bj9a.evidence.tar.gz`
(SHA `2d31be150a200bd7f06b96cb3161e827b49bb153e35b9e1215fc35b6bf4c11a2`).
The archive also retains the full29-area Hell envelope and both exact-body
reviews. Root retains it and three evidence sidecars through implementation/
independent/full-v1 consumers, then owns removal. All5 members verified;
raw task root absent, remaining[]/failures[]. It characterizes
source availability, without measuring earned pacing or acquisition balance.

Controlling requirements: `docs/plans/work-plan.md` P12b and
`docs/plans/decisions/D10-material-economy-v1.md` (all33/all35, explicit TC
exceptions, Normal/Nightmare fusion cap, no arbitrary shard-to-high-rune vendor).
No repair has been attempted. Review the actual source/entitlement contract;
do not simply raise existing caps, relabel a Normal reward as Hell, inject
materials, weaken recipe requirements or remove advertised runewords.
