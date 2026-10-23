# BUG-094 — Historical saves retain stale equipment critical/dodge caches

Status: source-reproduced; compatibility repair pending. Severity: Medium.
Owner: engine/save compatibility. Separate from BUG091/BUG093 numeric projection.

Environment: fd2c96e plus the reviewed, uncommitted BUG091/BUG093 unit correction.
This is a source-path finding; no historical-save browser reproduction is claimed.

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
