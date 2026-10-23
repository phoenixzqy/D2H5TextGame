# BUG-121 — Use authoritative equipment ownership for material actions

Status: Fixed locally in `167aaba`; no push or release claimed.
Severity: High.
Owner: engine-dev / qa-engineer.

Environment: deterministic Vitest store/save integration; browser, locale and RNG seed not applicable.

1. Save and Continue with a hero or mercenary wearing a valid socketable sword.
2. Unequip the sword through the production store action.
3. Prepare socket insertion or salvage for that exact returned backpack item.

Expected: the authoritative equipment map no longer owns the item, so its
single backpack owner can perform the otherwise valid action.
Actual: materialActions counts the actor's stale equipment cache as a separate
owner and refuses with `Ineligible material action item`.

Evidence: independent read-only QA review of materialActions.ts ownership
projection and playerStore.recomputeDerived / mercStore.unequipFromMerc. These
production actions update authoritative maps without refreshing actor mirrors.

Root cause: actor equipment arrays are cache mirrors, but the new adapter adds
them to its additional-owner collision set. Authoritative hero/merc equipment
maps and both quarantine families are the actual owners.
Workaround: keep rollout local and unaccepted until both Continue paths pass.

Runtime evidence: both hero and merc Save/Continue→unequip→insert regressions
failed with the exact refusal (stale-mirror-red.log). Removing actor cache arrays
from the collision set fixes both while retaining all authoritative owners.
The focused eight-file suite passes175 tests, including all seven live-action
tests (runtime-ui-fixtures-green-attempt.log); typecheck also passes. Independent
read-only QA re-review is CLEAR for this correction only. Final corrected source
passes10843 tests across390 files (2existing skips); types/lint/build and corrected
en/zh mobile crafting checks pass. Fix committed at `167aaba`.
See `docs/plans/evidence/d10-native19-crafting.md`; earned rollout acceptance
remains separate and open.
