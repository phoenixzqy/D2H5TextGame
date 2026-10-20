# BUG-018 — Equip trusts a stale caller payload instead of the stored item

Severity: Major (item substitution, eligibility bypass, and same-ID item loss).
Status: fixed scoped P03b04a authoritative-item resolution, 2026-10-20.
Base: `32b5b46`; owner store/QA. Vitest 1.6.1.

## Reproduction

1. Put a two-handed sword in the backpack, with a weapon and shield equipped.
2. Call `equipItem` with the backpack sword's ID but a one-handed base ID.
3. The original action accepts the ID, equips the caller's one-handed object,
   and retains the shield instead of using the stored two-handed sword.
4. The same stale-payload path accepts caller rarity/unique requirements,
   affixes, deterministic rolls, and flags. A stored unique's requirement can
   be bypassed by supplying a normal payload with its ID.
5. If two stored entries share an ID, the original ID filter removes both.
   A missing ID with an unknown caller base also returns `no_slot` before
   checking membership.

Expected: resolve the first matching backpack item/index before base lookup.
Use that complete stored item for eligibility, displacement, and equipped
contents; remove only its index. Missing source returns `not_in_backpack`.
Refusals leave inventory/player state and publications unchanged.

Actual baseline: all nine new real-store cases fail before source changes.
Command: `npx vitest run --project ui src/stores/authoritative-equipment.test.ts --reporter=dot`.
RED at 05:44:24 UTC, duration 1.78s: wrong missing-source reason; unknown
stored base accepted; valid stored base refused; both handedness directions
wrong; unique requirement bypass and false refusal; invented caller fields
equipped; second same-ID item removed. These are assertion failures against
the original action, not fixture/setup failures.

## Controlling plan and scope

Root exact three-file plan APPROVE; producer plan READY. Only inventory store,
the nine-test regression file, and this bug record belong to P03b04a.
The public `equipItem(Item)` contract and displacement/recompute sequence stay
intact. Affix Maps and all stored fields survive the existing equipped-flag
copy. No global deduplication, capacity guards, UI, save schema, mercenary
transaction, or engine changes. Equipment capacity remains P03b04b/BUG-017.

Security check PASS: this corrects the local authoritative-state boundary;
no external IO, credentials, permissions, CI, or agent-behavior changes.

## Validation and review

All nine focused regressions pass, 1.70s. Related validation passes 35 files /
347 tests / one existing merc-XP skip, 19.07s (above the 5s related budget).
Typecheck, lint, explicit forced lint of both changed TypeScript files, and
`git diff --check` pass. Production build passes, 11.56s while the full suite
also ran; existing bundle-size, Browserslist-age, and manifest-precache warnings
remain. This is not PWA/performance acceptance.

The first full `npm test -- --reporter=dot` exits zero, but its bounded-output
wrapper omitted the stdout summary. One unchanged-source evidence rerun retains
the summary: 103 files / 1084 passed / one existing skip, 57.94s Vitest time
(59.55s wall time), above the 15s full-suite budget under concurrent test load.
Existing React act/router warnings remain outside this store-only change.

Independent root source/test review APPROVE and producer source/test review
APPROVE, no material findings. The nine cases prove no-op refusal state/reference
and publication invariants, one successful publication/recompute, unchanged
input objects, full stored payload/Maps, actual derived modifiers, and retained
same-ID siblings. Ordinary UI behavior is unchanged; no new browser or
engine-only validation tier is required. Capacity remains the following slice.
