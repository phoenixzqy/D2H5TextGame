# BUG-040 — Player Frost Nova drops secondary Freeze

Status: source-confirmed; genuine runtime reproduction pending before fix.
Severity: Medium; advertised crowd control never reaches production engine.
Owner: engine-dev/content-designer; independent producer/QA review.
Card:P08a04, bounded player Frost Nova secondary status only.

## Expected / actual

Expected: actual player Frost Nova retains current Chill and applies documented
10% Freeze to each successful hit; no proc on a miss. Preserve one damage result
per target, current exact duration/rank/resource/targeting rules.

Observed source: authored sorceress.json row includes [chill,freeze], but
`src/engine/skills/dataCatalog.ts` effectsForSkill selects appliesStatus[0] only;
DamageEffect supports only singular applyStatus. Registry loads JSON after
legacy builders, so the builder cannot restore the missing production tail.
No runtime test or browser outcome has yet been claimed by this investigation.

## Reproduction plan and environment

Isolated root worktree2, branch feat/playable-foundations; input includes
quest b4d2764, cast-name tests0df510a and frozen converter7ef1cfb9 awaiting final
browser acceptance. Node24.21.0, Vitest pure-engine project; locale/viewport
are not relevant to runtime status transport. Use actual JSON→schema→adapter→
registry→runBattleRecorded, no substitute registered Frost definition. Record
actual input SHA and genuine raw RED before source changes.

Contract:[D04 Frost Nova](../../docs/plans/decisions/D04-frost-nova-secondary-v1.md).
The design spec Sorceress table pins Freeze10%; D04 timing pins current1000ms
ordinary/500ms boss duration and exclusive expiry. Per-target independent rolls
append after existing Chill chance1. Analyst seed hypotheses5success/1failure/
4miss and AoE5 require actual executable verification; do not assume they pass.

## Scope and next actions

Representation child: strict opt-in secondary metadata/schema/shared types and
ordered engine list representation, with legacy compatibility, no live row change.
Behavior child: Frost JSON + adapter + shared damage-status loop; first prove
actual missing Freeze, then exact real-action suppression/expiry/AoE/rank/
resource/replay/legacy controls. Independent reviewed RED before each fix.
Do not enable unrelated multi-status tails or change Chill speed/monster Frost/
old two-turn conditional prose/UI/save/engine seed ownership. Security-check
PASS for local authored JSON and seeded engine behavior; no credentials/network/
dependencies/permissions/hooks. Final evidence/review/cleanup still pending.


P08a04a plan refinement approved by root/producer/QA before RED: opted-in
appliesStatus is exactly [nonempty non-Freeze primary,freeze], with damage and
damageType, unique IDs and closed required Freeze chance metadata. Overlong
opt-in arrays fail; identical opt-out arrays and existing legacy oddities remain
accepted. This uses an Ajv-strict closed tuple without weakening the validator;
general engine nonempty readonly applyStatuses remains unrestricted in length.
Input cast runtime is now accepted commit9f2eb48; Frost code remains unchanged.


## P08a04a representation RED before source edits

At9f2eb48, only loader.test.ts changed. Revised frozen test SHA256
`fb9dfc5a63d4f782835cebd307f7c2fd752da6c494927c84dd1fdcb53c32923e`.
Command: npx vitest run --project ui src/data/loader.test.ts --reporter=verbose.
Result:11failed/184passed/195total,0skips, runner3.05s/wall4.349s, exit1.
The actual Frost row validates unchanged; adding only reviewed Freeze metadata
fails with exactly one Ajv additionalProperties error for additionalStatusEffects.
All10other desired acceptance cases fail for the same unsupported field; legacy
controls/current283rows load unchanged. This is genuine schema RED, not runtime
Freeze evidence. Actual Sorceress JSON is independently verified metadata-free.
Opt-out fixtures clone the actual row and strip opt-in metadata so they remain
valid during B; no persistent assertion forbids B's intended content change.

Separate typecheck exits2/wall10.168s solely for desired applyStatuses positive
acceptance (TS2561); it is type-contract evidence, not behavioral RED. Negative
static controls require nonempty/exclusive forms. Test ESLint exits0/wall5.789s.
Initial run17fail/178pass also contained six test-harness failures because
Vitest spread array rows; revised fixtures use object rows. Initial TSC also
caught the same fixture typing and ESLint dynamic-delete issue; corrected
without any source edit or relaxed acceptance. Keep both attempts for reviewers.

Exact raw root:
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-frost-representation-rdc_xho_
Labels frost-a-red-final, frost-a-red-final-typecheck, frost-a-red-final-lint.
Root/producer/QA independently APPROVE / ADEQUATE genuine schema RED before
representation source edits. Frozen tests remain unchanged for GREEN review.

Final RED log SHA256: `1fb005e06c9d7099c439bafa5a36a6c80b7aabc9b400d6482f41c39aa7b1dc2a`.
