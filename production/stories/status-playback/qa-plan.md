# Status playback — preimplementation QA plan

Status: QA-PLAN APPROVE,2026-10-22; no runtime/browser acceptance yet. Root sole executor; all
functional fixtures explicitly imported/unearned. See D04-status-playback-v1.

Each case uses fixed seed1 unless production PE seed7 is explicitly named. Vitest
engine tests use durable units/registered production or narrowly scoped synthetic
status producers as labeled; store cases use real engine/store/staging, mocking
only disk I/O. Restore registry/stores/locale after each case. Browser uses fresh
isolated IndexedDB contexts, actual production bytes with VITE_E2E absent/bridge
scan, serial worker/retries0/maxFailures1 and frozen attempt/event/time budgets.
Keep every failed attempt; do not adapt encounter/seed/timeouts after observation.

| ID | Type / setup / action | Literal expected / acceptance |
| --- | --- | --- |
| SP01 | Engine, fresh Poison at1700 on durable survivor; no refresh | original frozen seed1/rank1 fresh PE oracle: hit60, potency3HP/s, DoT [[3400,5],[5100,5],[6700,5]], final925HP; complete snapshot1700, empty6700 after final5 damage; same target remains alive |
| SP02 | Engine, duration overrides/future/expired/indefinite initial records | initial prefix covers the effective units Map roster/order with existing duplicate-ID overwrite semantics and only active records; future appears at exact start, half-open expiry, indefinite remains; no remaining-to-seconds inference |
| SP03 | Engine, refresh/cap/marker promotion/valid old rate | snapshots preserve original start/source when required, first valid rate adopted only at promotion, caps/expiry exact, no extra RNG or damage |
| SP04 | Engine, alias/duplicate IDs, optional metadata and tags | complete ordered record equality and independent copies, no collapsing/canonicalizing; earlier payloads unchanged by later state |
| SP05 | Engine, lethal hit/periodic simultaneous deaths and orphan closure; Poison/Plague spread without cue | dead views empty; living recipient authoritative stack/rate/source/start at exact boundary; original death/reward/effect order preserved |
| SP06 | Engine, retaliation/debuff/summon entry, final end/timeout/cap | each committed active-view change observed; summon first, status after; end last; no active badge on dead units |
| SP07 | Engine preservation, original frozen24 PE oracle plus A/A/B/A and plain/recorded | remove predeclared transport/accepted corpse messages and derived uiDelay only; gameplay payload/order/timestamps and non-event outcome/input/RNG exact; original oracle bytes retained |
| SP08 | Store initial publication/observation-only future boundary/application/expiry, stop before end | complete prefix only seeds first frame with cursor0/events/log/startup unchanged; future not eager; immutable replacement; exact pre-end survivor state; malformed missing/duplicate/out-of-order/nonzero-clock/later initial prefix throws before publication; unknown later targets inert |
| SP09 | Store batches, same-time actions/mana/consumption/transport, pause/speed | one ordered atomic update; first200 and distinct gaps clamp50..3000 then speed once; sole leading bossIntro1200 then engine200, prefix scan never runs prelude/startup; pause/speed around intro and observation-only future wait never advances eagerly; transport silent |
| SP10 | Store final snap/legacy no-transport/replay twice/new-wave | authoritative recording final snap cannot restore expired/dead badges, late observations cannot decorate dead units; legacy no-transport keeps prior intermediate/final behavior; source outcome untouched; replay twice/resources/rebased nextwave exact; no persistence/reward/item drift |
| SP11 | Component and browser compact grid, Poison apply/periodic/expiry on same living unrefreshed target | all active statuses wrap visibly incl >4 and duplicate IDs with unique React keys; localized status+stack accessible names; FX last4 non-status-state events incl prior silent events unchanged; no UI-synthesized clock; exact expiry uses frozen production oracle/event alignment or public observable data, never wall time/HP alone |
| SP12 | Production mobile360x640/412x915, desktop1280x800, landscape; en/zh | actual allocation/priority/firstkill/body/MP/same-batch logs, status lifecycle and exact export/save/newpageContinue; no overflow, relevant44px targets, keyboard visible focus, contrast, reduced motion, clean console |
| SP13 | Manual/physical device/feel | separately assess whether status and firstkill transitions are understandable; automated passing fixtures do not close feel/full-a11y/performance/earnedL18/balance |

SP01–07 cover engine transport and preservation. SP08–10 cover staging, replay,
state lifecycle and pacing. SP11–12 cover actual live-grid/mobile/bilingual access.
SP13 is justified manual-only acceptance and remains open without actual review.
Before each runtime patch retain a genuine causal RED and structured bug report.
After each bounded slice run required checks, independent reviews and exact owned
artifact cleanup; retain raw evidence until all umbrella consumers finish.
