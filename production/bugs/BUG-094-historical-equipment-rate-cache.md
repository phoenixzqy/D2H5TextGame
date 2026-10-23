# BUG-094 — Historical saves retain stale equipment critical/dodge caches

Status: Fixed in the accompanying shared-decode repair (parent 16db3c5). Severity: Medium.
Owner: engine/save compatibility. Separate from BUG091/BUG093 numeric projection.

Environment: 16db3c5, including the committed BUG091/BUG093 unit correction.
Initially source-reproduced; constructed stale-cache browser verification now passes.
No naturally acquired historical-save or campaign acceptance is claimed.

Reproduction by source inspection:
1. A save previously written while affected gear was equipped contains oversized
   critical/dodge values in `player.derivedStats`; its raw affix rolls are valid.
2. `decodeSave` in `src/engine/save/validate.ts` migrates, validates and restores
   Maps, but returns those cached derived values unchanged.
3. `applySaveToStores` installs the saved player. CharacterScreen consumes its
   cached statistics. No normal recomputation is guaranteed at restoration.
4. Starting fresh combat derives equipment statistics again and uses corrected
   units, so the character display can disagree with the new combat projection.

Expected: an affected historical save presents canonical critical/dodge values
consistently after import/Continue while preserving raw rolls, resource pools,
unrelated historical fields and existing save compatibility.
Actual: BUG091/BUG093 correct new projections but do not repair saved caches.
Normal equipment/attribute recomputation can refresh those values later.

Independent QA source audit confirms the gap. A future repair should normalize
at a shared decoding boundary: `importIntoStores` writes decoded data to disk
before installation, so changing installation alone would split disk/live state.
Use the shared equipped-stat projection for affected fields only; broad historic
rederivation would break deliberately preserved MR and naked critical caches.
Character attribute drafts also require the original Player identity, so passing
an unrelated projected clone into the draft panel is not an adequate repair.

This report authorizes no save-format bump, blanket cache reset or campaign retry.
The follow-up needs affected-source detection, idempotence, JSON/IndexedDB import
and Continue coverage, unchanged raw items/HP/MP/unrelated caches, and unaffected
historical-save controls. Root owns this follow-up within the full-v1 objective.

Approved repair contract: shared decode boundary, per-stat source mask from
nonzero modern rolled rate affixes and the exact24BUG093 corrected unique/set
fields. Count distinct active set pieces with canonical membership as the
existing aggregator does. Reproject once and copy only masked rates; reject
nonfinite repaired arithmetic after validating the original save. Originally
fractional unique/set packages and legacy Maps alone do not trigger repair.
Raw items, resources/maxima, MR, unmasked fields and all merc state stay exact.
Removed gear cannot identify a stale cache and remains outside this repair.
Producer contract APPROVE/security PASS. Initial executable reproduction:
four rate assertions fail and one naked/legacy-only control passes.

Verified correction: `src/engine/save/equipment-rate-cache.ts`, called after
validation/Map restoration from `decodeSave`. Regressions:
`src/engine/save/equipment-rate-cache.test.ts` (42) and four new real-adapter
cases in `src/stores/persistence.offline.test.ts`. Final full8646/278, types,
lint, production build/four-chunk bridge scan and two locale browser cases pass.
Producer source APPROVE/security PASS; independent final browser QA ADEQUATE.
[Complete evidence](../../docs/plans/evidence/historical-equipment-rate-cache.md).
Removed-gear ambiguity remains explicitly outside the identifiable repair scope.
