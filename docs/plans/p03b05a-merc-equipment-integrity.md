# P03b05a — authoritative mercenary equipment transfers

Status: accepted bounded slice; root/producer plan/source/final review APPROVE.
Evidence: evidence/p03b05a-merc-equipment-integrity.md. Base db83bbe.
Root owns this control, runtime/tests/UI/browser and BUG028. Design agent's
P01 read-only combat investigation is independent. Full P03b/P13 remain open.

## Scope and contract

Current mercStore.equipOnMerc trusts the caller's entire item, accepts unknown
merc IDs, returns null for both empty-slot success and rejection, and does not
remove a backpack source. MercEquipmentEditor separately adds displacement and
calls removeItem, which deletes every matching ID in backpack and stash even
after rejection. unequip returns stale equipSlot metadata; displacement remains
equipped=true. Reproduce before patching using actual stores/mounted UI; file
BUG028 with genuine failed state assertions and environment.

Make existing equipOnMerc/unequipFromMerc the sole complete synchronous transfer
actions. Return discriminated {ok:true} or {ok:false,reason}. Equip precedence:
merc_not_owned, not_in_backpack, incompatible_slot. Resolve first current
backpack index by requestedItem.id before inspecting base/slot; preserve the
complete stored payload/affix Maps, never caller fields. Match existing base-slot
and interchangeable-ring behavior. On success remove exactly that source index,
append any current displaced item once with equipped=false and no equipSlot,
and equip the complete stored item with equipped=true/equipSlot=target. Unequip
precedence merc_not_owned then not_found; return the complete current equipped
item once to backpack with equipped=false and no equipSlot, clear that slot.

Preflight all failures before publishing either store; refusal retains both
complete store objects/references, no publications, same picker/gear. Success
precomputes both domain updates and publishes each once synchronously, with no
await/throwing validation between writes. Existing debounced save samples the
settled state. This does not promise a multi-store atomic subscriber snapshot or
new behavior under arbitrary throwing/reentrant external subscribers.

UI delegates entire transfer to the action. Only success closes picker; equip
refusal keeps it and uses existing localized inventory toast.equipFailed in a
persistent polite status, translated from retained item name when locale changes.
Clear feedback on slot change and success. No new product copy/schema/migration.

Preserve current capacity/requirements/handedness/class policy for this child:
durable return ingress remains unbounded, no new merc stat requirements or
two-hand displacement. Net-capacity/UI/merc combat stat composition are separate
cards. No currency/economy/gain/gacha changes or same-ID global repair.

## Ownership and verification

Six source/test-file exception for one complete transfer path:
stores/mercStore.ts, existing mercStore.test.ts (return contract), new
stores/merc-equipment-transactions.test.ts, features/mercs/MercsScreen.tsx,
new MercsScreen.equipment-integrity.test.tsx, tests/e2e/merc-equipment-integrity.spec.ts.
Root additionally owns this control and required BUG028; ledger/evidence follows
after validation. Existing inventory-awards.test.tsx remains valid unchanged.

Genuine RED first: stale/missing source, unknown owner, actual current incompatible
base, caller-vs-store payload, duplicate source/stash IDs and returned flags.
Verify missing-owner/source precedence, unknown base/ring compatibility, empty
slot/swap/unequip, complete state/Maps/input immutability, exactly one publication
per changed domain, refusal no publication, unrelated player/currencies/progress/
stash/equipment preserved. Mounted UI catches a stale candidate whose current
base changes before handling and preserves localized picker/error until retry;
real swap/unequip roundtrip conserves items. No mocked transfer/store actions.

Focused/related then full U/T/L/build and forced browser lint. Browser uses
ordinary import only as a clearly labeled integrity fixture (not earned loot),
real hire/equip/swap/unequip/Save/reload/export, literal complete expected item
payloads across en/zh-CN×1280×800/360×640; delete downloads. No forced actions or
bridge injection. Independent source/evidence review before commit. Track exact
task dist/.vite/browser output and port; remove after all consumers/processes.
Timing budget misses remain explicit; passing behavior alone accepts no fullgate.
