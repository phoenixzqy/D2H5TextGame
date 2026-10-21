# BUG-069 — Expose Meteor Armor Melt details

- **Status:** Fixed — bounded bilingual UI/browser acceptance; broader D04/P08/C1 remain open.
- **Severity:** Medium — combat works, but the skill detail omits its documented status strength/duration.
- **Owner / affected systems:** frontend-dev, writer, qa-engineer; Skills dynamic description and both locales.
- **Build:** `d50f124`; existing Meteor combat acceptance is P08a08/D04.
- **Environment:** Linux source inspection; no browser/viewport/runtime scenario executed for this report.
- **Locales:** zh-CN and en.
- **Seed:** Not applicable to this static UI reproduction; no engine simulation run.

## Reproduction

1. Read exact `skills-sorceress-meteor` in `src/data/skills/sorceress.json`: ordered Burn then Armor Melt; immutable definition resolves ordinary Defense reduction30%, duration3000ms, flat ranks1–20.
2. Inspect `SkillsScreen.dynamicDescription`: Meteor has no authored-specific branch. Its existing direct damage causes the generic damage sentence to return before any locale description can be shown.
3. Inspect both `sorceress.meteor.desc` locale strings: they mention melting armor but omit potency/duration and ordered Burn.

This is a source reproduction, not an executed browser failure. Frozen source bytes
and fingerprints are retained before any correction; concrete reviewed UI tests will
record actual unchanged-production RED separately.

## Expected

The detail should show the existing computed damage range and truthful bilingual
ordered successful-hit Burn→Armor Melt, with30% ordinary Defense reduction for3s
at every rank, using the existing immutable JSON-derived definition. Preserve
current/next100–150/110–160 and cap290–340, MP50/CD4/L24/prerequisites and all native
allocation/combo/recording/save behavior. New Melt does not benefit its triggering hit.

## Actual and root cause

The generic direct-damage description short-circuits Meteor's specific status
semantics. The authored locale prose also lacks exact metadata. The runtime already
implements the accepted D04 behavior; no combat defect or tuning change is inferred.

## Evidence and next steps

[Bounded control](../../docs/plans/p08a08d-meteor-ui.md) and
[D04](../../docs/plans/decisions/D04-armor-melt-v1.md) govern the correction.
Root-owned RAW `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-meteor-ui-68uhit_n`
retains baseline-source-freeze.json, original UI/locales, approved plan and review
transcriptions until durable packet verification and exact cleanup. Four source
paths and a separate production-browser increment follow reviewed frozen oracles.
No fullD04/P08/C1/private-v1 acceptance is claimed.

## Workaround

Read the accepted D04 contract for status magnitude/duration. Current damage and
status-name rows do not replace the missing explanation in the detail prose.


## Bounded resolution — 2026-10-21

Source `6af9f39` fixes the formatter/locales; browser `a3bc6bb` verifies bothlocales.
Actual unchangedUI RED10missingprose/10passingcontrols is followed by final20focused
and5444fulltests/201files, types/lint/cleanbridgebuild, then2productionbrowser passes.
QA personally reviewed all18originalscreenshots. Native learn0→1→2 changes only
rank/points; paused DOM/resources/combo stay equal, combo editing works, and entire
SaveCurrent/meta survives explicit Save→Saved→close/newPage→Continue. ImportedL24/
prerequisites are scaffold, not earned progression. Existing decorative glyph boxes,
small/landscape scrolling, build/Node warnings and finite acceptance limits remain.

[Full evidence](../../docs/plans/evidence/p08a08d-meteor-ui.md) preserves actualRED,
actualV3lintfailure, all preexecution corrections and independent approvals. Exact
761disposablefiles/40,979,191B/10distdirectories removed after readers released.
RAW remains root-owned pending lossless durable packet verification, then exact
cleanup; sharedfonts/tools/dependencies/source/history preserved. No remote action.
