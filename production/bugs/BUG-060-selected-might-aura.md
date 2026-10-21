# BUG-060 — Apply explicitly selected player Might in combat

- **Status:** Narrow selected-Might path fixed: pure runtime `3e4f159`, native waves `53e2dc6`, selector UI `c159e5b`; broader aura/card acceptance remains open.
- **Severity:** High — selected Might has no combat effect.
- **Owner / affected systems:** engine-dev (root integrator), selected aura combat projection; native combat adapter follows separately.
- **Build:** `e1c976d1feca247200bcca1d0135826b54a88863` with reviewed regression tests installed; production engine unchanged.
- **Environment:** Node v24.21.0, Linux 6.18.33.2-microsoft-standard-WSL2, lockfile Vitest 1.4.0. Browser, viewport and locale: N/A (pure deterministic engine reproduction).
- **Seed:** 7.

## Reproduction

1. Run `node node_modules/vitest/vitest.mjs run src/engine/combat/might.test.ts`.
2. The `fixed physical100 at rank1` fixture supplies a canonical selected Might projection, a living player hero, allocated rank1, physical potency0.03 and Attack potency0.01. Its registered fixed physical skill has base100; the enemy has zero mitigation/dodge and1HP.
3. Repeat at rank20; also inspect the separate basic Attack100 and explicit fielded-merc cases.

## Expected

The fixed physical hit is103 at rank1 and160 at rank20, with no new weapon scaling. Basic Attack100 is104/192, applying the separate Attack bonus before additive physical increased damage. Only the live source hero and explicitly fielded living merc receive the effect. Current encounter source absence/death suppresses it; stun/freeze does not.

## Actual before patch

The fixed physical hit remains100 at both ranks (`expected 100 to be 103` / `expected 100 to be 160`). The behavioral suite has10 failed and16 passed assertions; failures also cover the basic Attack bonus, additive physical increases, fractional Attack flooring, later pipeline ordering and the eligible merc including source stun/freeze. The complete unaffected seed7 control recording passes.

The separate helper suite has44 missing-composer capability failures and188 existing passing controls. These are API-capability failures, separate from the10 demonstrated combat behavior failures.

## Evidence

Task evidence root (owner: root; retain through Might card preservation and review):
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-might-w1jtf6hl`.

- `runtime-proposal.v2.json` and reviewed frozen test drafts.
- `focused-runtime-red-behavior-report.json` / metadata:26total,10failed,16passed, no skips, exit1; production combat unchanged.
- `focused-runtime-red-helper-report.json` / metadata:232total,44failed,188passed, no skips, exit1.
- `runtime-prepatch-control.json`, SHA256 `736c05cfdd2d31fdaba94a63e2615f9b46a1db95391c1250453691d30cd802bb`: complete actual input, six timestamped events/delays and final teams, captured before implementation.

## Root cause and bounded fix

The snapshot/state has no selected Might projection. Basic attack reads only authoritative Attack; shared direct damage reads only existing per-type increases. Add a narrow frozen projection, compose from canonical selection/shared eligibility, and consume it through current encounter identity/life lookup at those two calculations. Keep fixed skill bases, authoritative stats/resources, summons, the distinct mercenary `aura-might`, RNG and scheduler unchanged.

## Workaround / closure

No player workaround. Pure-engine tests do not establish native playable activation. Record the runtime commit, native integration, regression evidence and final closure in the subsequent card evidence before marking the complete selected-aura path fixed.

## Native reproduction after pure-engine fix

At `3e4f159e8de12cf7fad3850af5da016fdcf6a2eb`, run
`node node_modules/vitest/vitest.mjs run src/stores/combatHelpers.might.test.ts`
with the reviewed v5 native regression suite. Production native adapter SHA256
`4679d8e1a59fd22e00dae100462944a9ea419e812f194251ef99cbdc25886177`
remains unchanged. The real `startSubAreaRun` / next-wave / replay path supplies
no `mightAura` input:15tests,9missing-projection failures,6passing controls,
no skips,4.806s. Selected rank1/20, exact fielded merc and validated import
all remain disconnected from pure runtime support. The actual seed7 fragile
mercenary death and won-wave carry assertions passed before the projection
failure; the nonzero-carry assertion is not reached in this RED.

Evidence: `focused-native-red-report.json`, matching metadata,
`native-prepatch-freeze.json`, `native-red-summary.json`; all prior unexecuted
v1–v4 fixture drafts and independent corrections remain at the evidence root.
Native fix: capture the constructed fielded merc's exact combat identity once
at run start; compose eligible selection from the current matching player at
each wave; pass the immutable projection separately from unchanged unit/carry
resources. No roster rediscovery or original-player selection fallback.

## UI reproduction after native integration

At `53e2dc6`, the independently reviewed v3
`src/features/skills/SkillsScreen.might.test.tsx` reproduces 12 failures out of
18 tests (6 passing controls, no skips; 8.619s). Eight failures stop at the
missing native aura fieldset; two reach and fail the missing exact Might
selection prose; two demonstrate alias-order / invalid allocated-rank display.
Later assertions within each failed test are not claimed as reached. The
whole-recording test establishes a real native recording before failing its
missing-selector lookup; recording preservation by UI selection remains unproven
until GREEN. Production UI and locale hashes match `ui-prepatch-freeze.json`.

Evidence: `ui-proposal.v3.json`, `ui-v3-preexecution-reviews.txt`,
`focused-ui-red-report.json`, matching metadata and `ui-red-summary.json` at
the retained evidence root. Earlier fixture drafts and all three independently
reviewed pre-execution corrections are preserved.

Bounded UI fix: a saved-choice native radio fieldset above tabs, shared Might
eligibility, explicit `selectAura` only, visible next-wave timing and unavailable
reasons, exact authored separate physical/Attack descriptions and rank previews.
Override only the two exact Might display aliases using the shared allocated
rank resolver; neither legacy `player.skills` nor alias insertion order may
invent an allocated rank. Browser layout, keyboard and focus remain separate
validation; this bug report does not close the complete Might card.

## Narrow fix validation

The final selector regression suite reaches all18 new cases, including exact
complete real native recording preservation during selection/clearing; combined
SkillsScreen suites pass62/2files. Engine1908/72files and full4279/181files pass,
with typecheck, lint and production bridge/build exit0. The first broad lint
attempt failed on a test nonnull assertion; the independently reviewed explicit
missing-slot guard correction preserves interaction and assertions. All failed
and pre-execution draft evidence remains preserved.

Final production-browser v5 passes18cases and both locales' explicit-save cycles in14.654s, with readable Chinese and actual Noto font evidence:
ordinary fresh L1 Paladin allocation (learning alone does not select), saved
radio choices, real Tab/arrows and focus outline, both languages and nine sizes
per language. Exports preserve canonical selection and omit it after clearing;
Settings Save confirmation precedes reload, proving explicit save, not autosave.
The host font prerequisite and failed earlier screenshots remain disclosed;
readable Chinese requires the final fresh-cache run, not DOM text alone.

This closes only the reproduced selected-Might behavior. Multi-aura replacement,
Meditation, earned campaign/balance, coverage, performance and full accessibility
certification are separate open acceptance. Existing engine/unit timing budgets
are missed and existing build warnings remain; no validation threshold changed.

[Accepted behavior and evidence](../../docs/plans/evidence/p07b02-selected-might.md).
