# BUG-663 — New preparation silently retains permanent Dark Wood fallback

- **Status:** Fixed and verified locally; earned progression and pacing acceptance remain separate.
- **Severity:** High for intended-build preparation/pacing qualification.
- **Owner:** root; shared campaign controller.
- **Environment:** WSL/Linux native controller, retained dirty `feat/playable-foundations`
  at `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`. No browser/locale dependence.

## Reproduction

1. At a fresh lawful Act III/IV/V quest boundary, call the corresponding
   `createAct*AreaPreparation()` with no options or an empty options object.
2. Observe the state omits `trainingFallbackPolicy`, selecting historical
   permanent Dark Wood fallback after an unrecovered training failure.
3. Inspect already-retained Fire/Bow/Holy Bolt Act IV and Cold Act V journals:
   low-XP safe farming exhausts preparation allowances after one draw. Do not
   rerun those histories or renew their limits.

Expected: new preparation explicitly records the already implemented ranked
cleared-source policy. A failed source does not discard other qualified earned
clears. Historical retained states without the field still reproduce and audit
their original legacy policy. No target, cap, reward or seed changes.

Actual: BUG613's source-selection correction is opt-in; omitted constructor
options silently select its known defective predecessor on new evaluation runs.
The shared XP correction already addresses its earlier structural XP mismatch;
this report does not propose another XP or level-target change.

## Repair and validation scope

Default the field only at fresh state construction, never at runtime, resume or
audit of retained states. Preserve existing source exclusions, paid preparation,
learned recovery and all original limits. Cover default/empty/explicit options,
real controller source selection after a constructed training draw, legacy
omission and budget/continuation regression callers. No native campaign run.
Security check: pass; plan review: ready. Root self-review is not final independent
acceptance. Frozen plan/preimages: `p15-ranked-training-default-v1` beneath the
retained root packet. No new agents, install, CI, commit, push or publication.

## 2026-11-03 — Fresh construction corrected

The shared constructor now records `ranked-cleared-v1` for omitted and empty
options as well as an explicit opt-in. Runtime, resume and audit still interpret
absent policy as historical behavior. The Act III historical fixture explicitly
retains absence, including across continuation; the Act V caller exercises the
new default. No production combat, XP, target, save or budget changes.

Both constructor and actual source-selection cases failed before the one-line
controller correction. All45 selected affected cases pass (25ActIII,10ActIV,
10ActV), plus scoped strict types and explicit four-path zero-warning lint.
Unselected cases were filtered, not disabled. No native combat or new build clear.
[Evidence](../../docs/plans/evidence/p15-ranked-training-default.md).
