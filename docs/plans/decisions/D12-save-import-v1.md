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

### P17a04 shared displayed bonus (approved implementation contract)

UI reads the same meta.readIdleBonus(now) projection as save/export, subscribing
to both raw idleState and transient idleBonusAnchor. Read actual Date.now on
render, including restores/updates between ticks; no mount-time accrual or
duplicate tuple. Display active/current multiplier/current percentage and
remaining seconds only. Remove peakPct/windowSeconds/deriveBonusFromLastClosed
from the UI interface: v7 cannot recover original peak/window. Explicitly
supersede the four old UI helper accrual tests; retain engine arithmetic tests.

Reproject at min(30seconds, remaining duration), hide exactly at short expiry,
clean timers on inactive/unmount/StrictMode, and publish no domain state from
render/ticks/remounts. Preserve raw tuple/anchor references. Tiny positive
bonuses remain active even if display rounds to0%. Mounted exact replacements
display immediately at their current publication basis, including identical raw
tuples with new anchors. Metadata-only edits cannot refresh. Banner/chip show
current percentage and ceil-minute countdown; visible units/labels are localized.

Require aged mount/remount, between-tick updates, actual restore/new-anchor,
inactive/short expiry, no-publication/timer-cleanup tests plus ordinary browser
import→600online seconds→Save/same-clock reload→600seconds→expiry in en/zh-CN
at1280×800/360×640. Imported bonuses prove wiring, not earned progression.
Worker owns hook/banner/test/locales/browser/BUG-022; root owns this control.
Obsolete App/meta close API cleanup stays with lifecycle. Reward integration,
hidden interval ownership, periodic/close writes, true-away browser/PWA/full
P17 acceptance remain open.

Visible-return events reproject actual wall time after throttled timer delivery;
listener/timer cleanup must survive StrictMode. Clock rollback can leave the
projected duration unchanged, so each delivered timer wake must rearm even when
the projection equals the previous render. Historical inactive tuples never
accrue in UI; this supersedes testing the obsolete transient close API itself.

### P17a06 periodic and lifecycle checkpoints (approved implementation contract)

startAutoSave is the sole owner of domain subscriptions, a30second interval,
document.visibilitychange (hidden and visible) and window.pagehide. All use the
existing projected flushSave and catch background Promise rejection. No callback
publishes the raw tuple/anchor or grants offline accrual; hidden/BFCache pages
stay online and decay against actual wall time. Startup alone resumes the
persisted away gap. IndexedDB pagehide completion is best effort, not a guarantee
after termination. Periodic staleness bounds apply while callbacks can execute.

Guard absent characters, suppression, blocked recovery and the entire queued
replacement interval, including the gap between raw hydration publication and
an already queued import/delete. Suppress the startup existence check as well
as subsequent reads/writes so an already started autosave cannot overwrite it.
Preserve adapter write ordering and cached page-lifetime initialization. Do not
stop persistence from App effect cleanup without a matching cached-init restart.
After P17a04 lands, remove obsolete App/meta lastClosedAt/markClosed ownership.

stopAutoSave removes domain/event listeners, interval and debounce; repeat start,
stop and restart have one owner. Stopping callbacks does not cancel already
submitted adapter writes. Tests cover current projected data after quiet time,
all events, throttled return/expiry without accrual, raw reference preservation,
cleanup/restart, storage/projection failure+retry, delayed load/import/delete,
startup recovery and queued replacement callbacks. Scope is persistence.ts,
metaStore.ts, App.tsx, lifecycle tests, BUG-024 and this control. Actual browser
close/reopen, PWA and P11 background combat catchup remain separate acceptance.

### P17a07 ordinary close/reopen acceptance (approved QA contract)

Use ordinary character/import/export/Save controls in en/zh-CN at1280×800 and
360×640. Close actual pages, retain context/origin IDB and reopen with controlled
away clocks. Playwright clock is context-wide: install/pause once, close the old
app before changing away time on a new blank page, then navigate. Collect errors
on every page; no game bridge, direct store/storage writes, forced clicks or
injected lifecycle events.

Known inactive Save atA→reopenB=A+1h gives1.08/1200 and cumulative away+1h;
sameB reopen preserves entire expected save. Advance online600seconds toC, then
read-only IDB must show a periodic checkpoint in[B+570s,C]. Verify its complete
payload against the knownBfixture with explicit decay at that bounded timestamp,
never adopt arbitrary observed data as baseline. Ordinary Save at frozenC
establishes exact1.04/600 before close. ReopenD=C+180s retains the stronger
1.04/600 and adds180000away ms; sameD reopen preserves entire expected save.
Check localized current bonus/no overflow and exact unrelated data throughout.
Worker owns one new ordinary-browser spec and small evidence document. Pagehide
durability, production PWA, earned progression and fullP17 remain separate.

### P17a05 production award-time XP and effective MF

After playback completes, an actual player win with the original hero alive and
at least one slain non-summon samples Date.now and meta.readIdleBonus(now) once,
before XP/loot effects. Every reward in that wave uses that sampled multiplier.
Keep the existing baseline xpForKill and sum floor(xpForKill(level)×multiplier)
per kill. Existing mercenary sharing remains floor(total awarded XP×0.75).

Thread an optional magicFindMultiplier (default1) from KillRewardInput through
DropContext to rarity selection. Effective MF is
`effectiveMagicFind(rawPlayerMF + rareEliteBonus50) × multiplier`, after the
existing floored diminishing-return curve, with no outer floor or new cap.
MF300 at1.5 gives327×1.5=490.5. Preserve existing RNG draws, shared stream and
materialization, GF, currency/material quantities, picks/noDrop and first-kill
rules. Forced rarity and direct TC rewards bypass MF effects. No new RNG fork.

Read-only bonus projection leaves raw idleState and transient anchor unchanged.
Incomplete/duplicate/loss/draw/dead-original-hero/no-slain outcomes do not sample
or award a bonus. Preserve existing idle-pity updates, including failed waves;
this change does not redefine pity policy or the XP baseline.

BUG-025 retains the production XP RED and the tight MF rounding reproduction.
Regression coverage uses real stores, gear, combat, playback, XP and mercenary
progression over two waves. An unforced TC fixture at the data-loader boundary
makes the MF path observable through real award/RNG/item materialization. The
authored Act I trash table forces normal rarity; a separate real-data control
preserves its complete loot/currency output while boosting XP. These controlled
high-power/imported fixtures prove wiring, not earned progression or balance.
Default1 has a fixed reward/next-RNG oracle. Forced/direct/noDrop/missing-TC
controls preserve rewards and following RNG state; no arbitrary same-seed
currency equality is claimed where changed rarity alters materialization draws.

Lifecycle/hidden interval ownership, periodic/close writes, browser/PWA restart,
true-away and earned campaign acceptance remain separate. This child alone does
not close full D12/P17 or the campaign gate. Functional test results and elapsed
test-budget acceptance are reported separately in BUG-025.
