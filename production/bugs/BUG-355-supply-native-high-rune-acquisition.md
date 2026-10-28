# BUG-355 — Supply native acquisition for the remaining advertised high runes

- Status: Open — native Hell source and required H2 native checks pass; exact H2 packet gate and H3 functionality/earned acquisition remain pending.
- Severity: High — seven materials required by advertised runewords have no
  native acquisition path under the shipped replay modes.
- Found: 2026-10-27.
- Build: `520d0e4bb76f15902e1399aaad1ad9e31f5ba9d8`.
- Owner: `game-designer` / `content-designer` / `engine-dev`; producer coordinates.
- Environment: source/content characterization in the current TypeScript game;
  browser, viewport, locale and combat seed are not applicable. No gameplay ran.

## Reproduction (original source characterization)

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

## Actual (original source characterization)

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
`docs/plans/hell-replay-implementation.md`. The native Hell acquisition/fusion source repair is integrated. Prior focused,
type and lint passes are historical; the later compile-only save change has
passed its targeted RED/GREEN regression and1228 assertions/40 affected files.
Pre-cleanup typecheck98175 and build76346 pass on unchanged5333 inputs. Required native H2 checks now pass; final docs/inventory and independent
exact H2 packet review remain pending.
H3 functionality and earned acquisition remain pending. Constructed source
coverage does not establish earned availability or acquisition pace.

[H1 compatibility evidence](../../docs/plans/evidence/hell-literal23-compatibility.md)
records the accepted prerequisite: literal23 quest/campaign authority remains
frozen and predecessor injection of reserved Hell state is refused. Its final
full20,796PASS/978files/two existing skips and independent review remain H1
history. [H2 evidence](../../docs/plans/evidence/hell-native-integration.md)
records native24/Hell source, actual claimed-Eve authority, +40 projection,
independent histories and live materials. Constructed coverage reaches33 rune
intervals,32 exact3:1 fusions and35 ordered word bases/packages/persistence.
The original full failed8 assertions across6 files; the six reviewed test-only
repairs and historical focused1669/66/types/lint passes remain retained.
Full-second failed only BUG180:21,172passed/1failed/2existing skips and986/987files.
Instrumented full-v3 then passed21,173 assertions/987files with2existing skips,
unchanged5332 inputs/Git state and no remaining owned processes. It is a
diagnostic, with no acceptance credit or timeout-resolution claim. The reviewed
compile-only save change is now applied after actual regression-v3 RED19068
and GREEN52325; affected83753 passed1228 assertions/40files with unchanged5333
inputs. Pre-cleanup typecheck98175 and build76346 are consumed native0 on that same
freeze. Required native H2 checks now pass; final docs/inventory and independent
exact H2 packet review remain pending.
Prior engine/build reuse does not validate these changed runtime bytes.
H3 remains open after its reviewed blank-launch failure before any app page.
No earned quantity, affordability, browser crafting/effects or pacing evidence
is established.

Engine96409 passed10,735 assertions/401files before the exact reviewed type
cleanup; lint73517's three redundant-annotation errors remain retained.
After cleanup, typecheck40015, lint26336 and build2368 all passed native0.
Uninstrumented full27446 passed21,174 assertions/988files with2existing skips
in1280.293275s. All four final checks preserve unchanged5333 inputs on snapshot
`b63bcdfce5e051f2d3be206cdead07881cce853a9ed63efa21f6bc34465b3dc0`.
Earlier runtime outcomes retain their executed hashes and erasure-only mapping.
Required native H2 checks now pass; final applied docs/inventory and producer
approval of the exact H2 packet remain pending. No bug closure, browser/H3,
earned acquisition, CI or full-v1 acceptance is claimed.


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
The compatibility prerequisite is accepted and native source/entitlement
changes are integrated; required native H2 checks pass; final docs/inventory and exact H2 packet gate
remain pending. Keep this bug Open
through the separately reviewed H3 functionality packet and required earned-
acquisition evidence. Preserve Normal/Nightmare caps, authored explicit
exceptions, original quantities and all advertised runewords. No cache/vendor
shortcut, imported material or constructed success closes earned availability.
