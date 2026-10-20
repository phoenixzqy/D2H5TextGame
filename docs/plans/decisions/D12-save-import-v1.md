# D12 v1 — Save and import synchronization

Status: implementation contract for P03a; offline portion remains pending P17.
Date: 2026-10-20. Input: `9e0ef64`.
Owners: producer, game designer and technical director, with independent QA review.

Save and Export capture the latest live stores, including changes within the
500 ms autosave debounce. A write failure is observable, never success.
Export can preserve a live JSON backup even when IndexedDB is unavailable.
All adapter writes execute in request order; rejected writes do not poison the queue.

Import parses, migrates and validates the complete candidate before changing
disk or stores. Cancel pending debounce, suppress new writes, drain older writes,
persist import, then synchronously hydrate all stores and reseed item identity.
Reset transient combat/run state only after persistence succeeds. Synchronize UI
locale. Concurrent state-changing save-management operations are serialized.
A rejected import preserves current live state and the prior persisted record;
resume autosave without hiding the original error. Current v7 shape is unchanged;
legacy optional fields and existing over-cap inventories remain supported.

Startup validates before any store mutation. A corrupt/future record or read
failure blocks automatic writes until a valid explicit recovery/import, so an
unreadable stored character is not silently replaced. Errors offer retry/export.

QA requires current-state Save/Export, pending and deferred-write import races,
all-slice v7 round-trip, corrupt/future/nested-invalid rejection, quota failure,
identity reseeding, transient reset and both desktop/mobile ordinary controls.
Producer plan review requested these cases; they are implementation gates,
not a claim that the full D12 offline requirement or G1/G6 has passed.

## Remaining offline contract

The existing locked idle spec controls +8%/hour, +50% cap, 20 boosted minutes/hour
and two-hour maximum with linear online decay; no raw offline XP/items. P17 must
make persisted idleState the shared UI/reward authority, persist lastOnline at
checkpoints/close, reconcile legacy v7 against save.timestamp, clamp rollback,
and preserve stronger remaining bonuses without reload refresh. Hidden-page
online farming and offline accrual cannot both reward the same elapsed time.
This portion needs production reward integration and restart tests before acceptance.
