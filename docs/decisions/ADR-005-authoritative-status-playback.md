# ADR-005: Record authoritative active statuses for combat playback

- **Status:** Accepted architecture,2026-10-22; technical-director approved.
  Producer publication sign-off precedes commit; runtime/browser acceptance remains pending.
- **Date:** 2026-10-22
- **Scope:** [D04 status playback](../plans/decisions/D04-status-playback-v1.md),
  [timing contract](../plans/decisions/D04-combat-timing-v1.md) and
  [QA plan](../../production/stories/status-playback/qa-plan.md).

## Context

The pure deterministic engine owns status application, refresh, potency, spread
and simulation-time expiry. Existing ID-only status events are log/FX cues;
recorded playback ignores them and snaps raw final statuses only at completion.
Compact combat cards hide persistent statuses. A surviving Poison target therefore
cannot show its real intermediate lifetime. Expanding fixtures cannot correct
missing state transport. SaveCurrent11 and native receipt/resource authority
already have separate contracts and must stay unchanged.

## Decision

Add a silent readonly status-state BattleEvent carrying a complete copied ordered
active status list for one target. An explicit initial:true prefix covers the
effective initial units Map roster at sim0, preserving existing synthetic
identity/overwrite semantics. Later complete observations follow committed changes,
activation, expiry, summon entry and death. Preserve all status fields, aliases,
duplicates and nested tags; filter activity with the existing engine clocks.
Keep ID-only status cues and legacy gameplay payload/order/timestamps unchanged.

Pure staging validates any new transport before publication and seeds only its
complete initial prefix, leaving events/cursor0/log/startup untouched. Playback
replaces lists immutably without status math or wall-clock expiry. Only recordings
with the complete prefix enable authoritative death-clear/final-overlay behavior;
legacy recordings without transport retain existing intermediate/final semantics.
Malformed partial transport fails staging; unknown later targets are inert.

Present contiguous equal-simulation-time events as one ordered atomic batch, with
one warmup/gap/speed calculation. Preserve a sole leading bossIntro as its separate
1200ms prelude, then the first engine batch200ms. Transport is silent and excluded
only from the existing last-four-event FX window. Compact cards display all active
records with wrapping, duplicate-safe keys and localized accessible names/stacks.
The linked D04 contract controls exact lifecycle, prefix, batch and fallback rules.
No new persistent/save fields, RNG, combat arithmetic or reward authority is added.

## Alternatives considered

1. Reconstruct statuses from IDs in the UI, applying default duration and local
   timers. Rejected: IDs omit source/rate/stack refresh/spread and custom/future/
   indefinite lifetimes; wall time diverges under pause, speed and replay.
2. Show only the raw final combat outcome. Rejected: it cannot expose intermediate
   application or expiry and can contain dead/expired historical status records.
3. Record individual status deltas. Rejected: every consumer would need matching
   merge/promotion/duplicate/expiry rules; complete observations keep one authority.

## Consequences

The UI can faithfully show conditions on the same living target while the engine
stays pure and replayable. Complete lists add event count/memory and require
explicit old-recording fallback and prefix validation. Atomic batching changes
same-timestamp DOM frames; historical action→MP→corpse frame assertions become
ordered-event/atomic-state assertions. Presentation delays are derived;5s of
simulation is not a promise of5s wall time. Manual feel remains a separate gate.

## Compliance and delivery

[SP01–13](../../production/stories/status-playback/qa-plan.md) cover copied initial/
future/refresh/expiry/death/spread/summon state, malformed staging, legacy mode,
pause/speed/replay/new-wave, compact duplicates/>4 records and production bilingual
mobile expiry evidence. Original frozen expected oracles remain unchanged;
compatibility projections remove only status-state and rederive/exclude only
uiDelayMs (plus previously accepted corpse-message additions for the original PE
baseline). Keep gameplay payload/order/simClockMs, non-event outcomes, RNG and input
immutability exact. Preserve the original24-PE oracle bytes and SHA.

Deliver bounded documentation, test-compatibility, Engine, Store, UI and production-
browser cards, at most five repository paths each. The pre-runtime audit requires
separate oracle-compatibility cards before Engine4. Each runtime card retains a
causal RED and independent checks/reviews. An encompassing lifecycle bug may span
cards; its updates fit each card budget. No permanent instruction or stack change
is needed. No browser, earnedL18, balance, full accessibility/performance,
manual-feel or full D04/D06/P09/P10/private-v1 acceptance follows from this ADR.

## Sources

Repository sources: src/engine/combat/{combat,status,types}.ts,
src/stores/{combatPlayback,recordedBattlePublication,combatStore}.ts and
src/features/combat/CombatScreen.tsx. These current implementation boundaries and
the linked accepted mechanic/QA contracts are authoritative for this local protocol.
The discriminated-union interface follows the existing BattleEvent pattern;
[TypeScript narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
describes its static representation, without prescribing gameplay semantics.
