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

### P17a01 pure arithmetic foundation

The existing v7 tuple is sufficient for current multiplier and remaining online
seconds, without a migration. `checkpointIdleBonus(state, now)` consumes only
online elapsed time since lastOnline with linear decay. `resumeIdleBonus(state,
savedAt, now)` accrues only the gap from max(lastOnline, savedAt), avoiding
already-saved legacy online time. It never consumes old bonus duration during
the away gap. Fresh accrual replaces the old tuple only when strictly stronger;
ties preserve the remaining window. Repeating a persisted same-clock resume
does not refresh the bonus. No default wall clock or reward side effects exist.

offlineTime means cumulative informational away milliseconds, following its
existing TSDoc. Include each reconciled gap once, including sub-minute gaps;
derive the bonus from the current gap alone. Online checkpoints preserve it.
Preserve idleTarget and optional-field presence. For legacy finite values clamp
offlineTime to zero minimum, multiplier to 1..1.5, seconds to 0..7200; normalize
an inactive multiplier/window pair to 1/0. Reject nonfinite inputs, elapsed
subtraction or cumulative addition rather than producing an invalid future save.
Negative finite timestamps remain supported. Rollback clamps the gap to zero
and reanchors lastOnline to now; this is local-clock recovery, not a high-watermark
or clock-abuse defense. Serial online checkpoints preserve the decay slope,
subject to normal floating point rounding, including clearing a rounded-to-one
multiplier's residual duration.

This three-file foundation has no production consumer. It fixes no hook/restart
defect yet and does not accept P17. Lifecycle integration must establish hidden
tick/offline interval ownership, checkpoint persistence, startup versus explicit
import semantics, and common reward/UI authority. The tuple cannot reconstruct
original peak/window metadata for a HUD progress bar. Restart, production
reward, ordinary UI, network-disabled PWA and performance gates remain open.

### P17a02 persisted startup reconciliation

Only page startup reconciles the saved idle tuple via resumeIdleBonus. Sample
now once after loading, compute before domain/locale mutation, then persist the
updated idleState and save.timestamp before publishing the character or ready
status. A quota/read/arithmetic failure preserves the prior disk and all live
domain references/locale, exposes error and blocks automatic writes. No raw
rewards or nonidle save fields change. Public raw hydrateFromSave and explicit
import remain exact restoration, without away accrual.

Cache the complete initialization promise for the page lifetime, including an
error result. StrictMode/concurrent calls/remounts share it and never reload an
older snapshot after play. Recovery uses explicit exact import or full reload;
calling the cached init again is not a same-page retry. Test-only reset clears
the flight/operation queue only after all consumers finish.

Startup, raw hydrate, import and delete share an invocation-order restore queue;
the adapter still serializes actual writes. Replacement reserves its existing
exclusion and cancels/suppresses autosave immediately, then reasserts suppression
inside its queued job. That job owns flag release and normal autosave resumption
in finally. The queue recovers internally after rejection while callers retain
their operation's failure. Settings is usable during startup IO; no delayed
startup publication/write may override a later import/delete. This ordering
does not claim all character/gameplay mutations are excluded by route guards.

This startup child addresses persisted returning-player arithmetic and restore
ordering only. The transient UI hook, actual XP/MF application, periodic/close
checkpoints, hidden online/offline interval ownership and browser restart/PWA
acceptance remain pending. No complete D12/P17 or campaign gate is accepted.
