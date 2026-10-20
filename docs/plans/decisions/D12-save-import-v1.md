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

### P17a03 shared online projection and save checkpoints

Keep one raw persisted idle tuple and one transient online clock anchor, replaced
atomically. readIdleBonus(now) projects via checkpointIdleBonus using the anchor
instead of the raw historical lastOnline; it never publishes or caches a tuple.
Successful exact import/raw hydration preserves all raw fields and starts online
consumption at publication time. Startup uses its sampled reconciliation time,
including time spent awaiting its persistence. Failed restores preserve the
prior anchor. Reset creates a fresh tuple and anchor at one sampled now.

updateIdleState with explicit finite lastOnline supplies the merged tuple at
that basis. Partial multiplier/remaining numeric edits without lastOnline first
project the current tuple to one sampled now, then merge, normalize and store
both tuple/anchor at now. Target/offlineTime-only edits preserve the raw bonus
tuple and anchor. setIdleTarget and empty/no-op patches cannot refresh a bonus.
No-op means the whole patch is identical. In a changed mixed patch, an explicitly
included numeric field deliberately replaces that projected value; an explicit
lastOnline deliberately supplies the tuple basis even if equal to raw history.
Metadata-only callers must omit bonus numeric/basis fields.
Reject nonfinite arithmetic/patch values before publication.

snapshotStores remains raw. Save and export use a shared projected snapshot
with one sampled timestamp for both save.timestamp and projected lastOnline.
They leave source tuple and anchor unchanged on success/failure, so repeated
saves/exports cannot refresh or double-consume. Projection failure in flushSave
publishes save error and returns a rejected Promise, maintaining its existing
Promise-or-null contract for background callers; retry remains possible.
Export throws to its existing UI handler. No schema bump or duplicate tuple.

This child requires actual stale production save/export behavioral
RED, partial-update/basis/no-op tests, exact restore timing/failure tests and
projection/save-error retry coverage. UI/reward/lifecycle consumers, periodic
and close writes, hidden interval ownership and browser restart/PWA acceptance
remain separate; full D12/P17 and campaign gates remain open.

Sixth-file scope extension: existing save-management browser assertions must
include projected clocks and startup accounting. Preserve the original pending
old-autosave/import cancellation sequence without manual Save before reload.
Observe the committed checkpoint read-only, require its timestamp within the
controlled+500..1000ms interval, and verify its complete payload against the
known imported fixture with only timestamp/lastOnline projected. Derive the
reload's exact away gap from that verified checkpoint, assert complete restored
save equality, then require a same-clock second reload to preserve the result.
Async transport does not guarantee the first callback snapshots at precisely
+500ms in every locale. Freeze the malformed-import test clock so complete save
equality proves preservation; its existing Escape handling closes the dialog
when a frozen transient toast covers the mobile pointer target.
