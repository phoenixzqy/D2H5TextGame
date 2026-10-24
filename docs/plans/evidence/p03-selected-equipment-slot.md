# P03 — Authoritative selected equipment destination

2026-10-24; local source `59f2590`, root implementation/self-review. This fixes
[BUG160](../../../production/bugs/BUG-160-equipment-picker-ring-destination.md).
Independent acceptance, C2–C4 and full G0–G7 remain open.

## Behavior and cause

The equipment picker previously compared its selected ring slot, then called
an API that automatically chose a destination. Confirm could replace the left
ring despite previewing the right, or fill the other empty slot instead of
replacing the selected occupied ring.

`equipItem(item, targetSlot?)` now validates an explicit destination against the
actual owned backpack item's base before any publication. Both ring slots are
compatible. A mismatch returns the existing `no_slot` failure with inventory
and player references unchanged; caller-supplied base metadata cannot bypass it.
The picker passes the same slot used by its comparison. Omitted destinations
retain automatic fill-left, fill-right, then replace-left behavior.

No save format, item payload, balance data, engine primitive, localization key,
dependency or external data flow changes. Security check passes. Root source
review finds no required correction; this is not independent review sign-off.

## Verification

- Three causal picker cases first fail, with14 existing controls passing.
- Two incompatible-destination store cases first fail, including forged caller
  metadata; the default automatic-placement control passes before and after.
- Focused UI/store/authority/capacity controls:52tests across4files pass,9.30s.
- Typecheck, full lint/engine purity and production build pass.
- Full unit:11670tests /451files pass, with the same two existing skips,471.30s.
  The15s full-suite budget remains exceeded; no performance acceptance follows.

Production Chromium passes English/Chinese ×360×640/1280×800, four cases with
zero captured errors/warnings. Every case keyboard-selects the right-ring
replacement with both slots occupied, unequips the left ring, then replaces
the occupied right ring again while the left remains empty. All three stages
match complete expected native exports and exact page-close/Continue state.

The separate artifact audit verifies28 exports,12 exact durable pairs,
all18957 ancestral unique item payloads,903 unchanged source/config hashes and
760 exact built-file hashes. Four HTTP-served JS chunks match and contain no
test-bridge markers. English/Chinese mobile screenshots were inspected.

These are explicitly constructed diagnostic copies: all noncandidate backpack
gear is moved into the diagnostic stash to leave room for the unequip case.
Every ancestral owned item is retained. The initial fixture attempted unequip
into the genuine overflow-sized backpack and correctly received `backpack_full`;
its original script/log/partial diagnostic exports remain retained. No assertion
or capacity guard was relaxed. No diagnostic save is promoted, and the genuine
next369 save is unchanged.

## Retention and limits

The [shared archive/manifest](fixtures/ring-slot-and-stat-preparation/manifest.json)
contains83 files (archive SHA256
`834ba60263b6b32a5d519eb704428df6bb1543626998a4aa03eba4b9f1fb3a3b`) and
retains source scripts, causal logs, original fixture refusal, corrected inputs,
all native exports/screenshots, hash records, artifact audit and cleanup.
Root retains raw evidence at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-static-field-27sv3iop/ring-slot160`
through campaign/full-v1 acceptance consumers and removes it after they finish.

Browser74872, audit32777, build87286, types23232 and lint48275 are terminal.
Preview86371 exits130;4436 is closed. The exact owned `ring-slot160/dist` is
removed after760 hashes are checked, and absence verified. No disposable build
or preview remains. Full-suite25639 is terminal with exit0.
Existing suite-time, bundle/PWA and full performance acceptance remain open.
No push, PR, merge or deployment occurs; umbrella goal/worktree remain active.
