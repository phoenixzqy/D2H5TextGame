# BUG-716 — Refresh crafting readiness for every native map dependency

Status: Locally fixed and verified; no commit. Independent umbrella acceptance remains open.
Severity: Low (defensive advisory-state consistency; commit revalidates).
Owner: frontend-dev; root implementation.

## Reproduction

HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus inherited human2 edits.
WSL, Vitest/jsdom; English and Chinese. No RNG; constructed state, no earned
campaign credit. Browser viewport does not apply to the isolated reproduction.

1. Mount crafting with an idle hero and enough El runes to fuse.
2. Change only `map.selectedTitle` to an unowned title through direct store
   replacement, without acquiring a transaction guard.
3. Compare the live native validator with the rendered Preview button.

Expected: readiness follows native authority changes and disables Preview;
restoring the valid title immediately enables it.

Actual: native validation refuses but readiness remains enabled
because its map subscription omits `selectedTitle` and several other fields
read by `hasReplayProfileAuthority`.

This is a constructed direct-store replacement, not a demonstrated supported
player flow. Sanctioned title/quest transactions notify the guard subscription;
save replacement is also guarded. Independent bounded review approved the slice
without treating this as a material supported-path failure. Commit still
revalidates, so no unauthorized crafting outcome is claimed.

Evidence packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-crafting-readiness-1k5oazhx`.
Regression: `src/features/inventory/CraftingReadiness.test.tsx`.
`map-dependency-red.json` records both disabled-button assertions failing
after the native validator correctly refuses the unowned title.
Workaround: native actions reject stale authority; reopen the form to refresh.
Security: existing native preflight/ownership checks remain authoritative; no
dependency, credential, network, CI, save-format or data change.

## Local result — 2026-11-04

The child now subscribes explicitly to all fields read by native authority.
Two bilingual title invalidation/recovery regressions pass; the final fixture
uses the allowed but unowned Baal title. Thirty component/target-work cases
pass, scoped strict TypeScript and corrected test-file lint pass. The prior
twelve-file lint had no errors outside that corrected test file. Original
failures remain retained. Independent bounded follow-up review: APPROVE, no
material findings; no checks performed by that reviewer.

[Full slice evidence](../../docs/plans/evidence/p12b-crafting-readiness.md).
The browser ten-layout run predates this subscription-only addition; the final
component regression covers its refresh behavior. No campaign or formal
balance credit. Root retains the required packet through umbrella review,
then owns cleanup; no commit or release claim.
