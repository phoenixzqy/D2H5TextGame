# D07/D11 v1a — First-act access and first-clear route

Status: accepted scoped design/measurement contract, 2026-10-20; P02b05a.
Independent design/technical plan review: `ready`, GD-DESIGN-REVIEW APPROVE and
TD-ARCH-REVIEW APPROVE. Concrete document review and commit are recorded in the
execution ledger. Full D07/D11, later-act progression and campaign acceptance
remain open. This decision changes no runtime, data, save or numeric balance.

## Problem and controlling sources

The GDD's main-quest progression (§7.3 of `Diablo2TextGame.md`) does not require
Den completion before Cold Plains. Conversely, [maps-spec §12](../../design/maps-spec.md#12-map-travel--unlock)
describes previous-area clear or waypoint-quest access, and
`src/data/quests/main.json` advertises a legacy Cold Plains unlock for Den.
These are conflicting subsystem contracts; current source alone cannot resolve
their intent.

[Scoped town-talk D11](D11-quest-talk-v1.md) already acknowledges current act-only
access and claims no new Cold Plains unlock. [Scoped claim-safety D11](D11-quest-claim-safety-v1.md)
preserves completed-status act gating and existing unlock semantics. The
behavior-preserving first-act choice below is compatible with those decisions
and the GDD's quest role. Making Den mandatory would introduce a progression
change and require its own review, implementation and fresh-player evidence.

## Chosen first-act behavior

All authored Act I subareas are accessible within the unlocked first act. Den
is an unfinished story/clear/reward feature: native full clear → Akara talk →
explicit quest claim, including its additional skill point. It remains part of
C1; access to another Act I area neither completes Den nor accepts its quest.
Den failure does not establish an access softlock.

For the measured first-act transition, preserve the exact existing Act II gate:
completed `quests/act1-sisters-to-the-slaughter` **OR** canonical clear
`areas/act1-catacombs`. Reward claiming is not required. `isActUnlocked` and
`isSubAreaUnlocked` in `src/engine/map/unlock.ts` implement these conditions.
This records the integration boundary; it does not accept earned Andariel,
the quest's remaining reward execution, or later-act progression.

For this scoped first-act route, the sequential-access wording in maps-spec §12
is superseded by act-wide access. Den's legacy Cold Plains unlock metadata is
retained as historical quest metadata; under this chosen rule it produces no
additional map-access transition. No code or data consumes it as a prerequisite
for Cold Plains. Do not remove or rewrite legacy identifiers as part of a
measurement task. Full D11 can reconcile the remaining metadata and player copy
with every quest/reward kind; this decision does not claim that work is done.

The tradeoff is deliberate: players can choose another Act I encounter while
Den's reward remains unfinished. Sequential progression would constrain that
choice and needs a separate design change. This choice is made from scope and
existing scoped decisions, not to turn a failed recipe into a passing test.

## Full clear and active idle are separate conditions

The lowest authored Act I area is canonical `areas/act1-blood-moor`, area level2,
with three native challenge waves. A separately frozen first-clear pilot must
begin from fresh creation, declare its legal acquisition/actions and finite
preparation/attempt/time bounds before execution, then play and settle every
qualifying native wave. It stops at the first native nonwin. Missing gear,
refusal, defeat or timeout is retained; no fallback seed/build/farm or refill
follows without a new reviewed card. No clear is promised by this decision.

W1 rewards survive native flee, but W1→installed unplayed W2→flee is not an area
clear. Only native final qualifying victory calls `mapStore.markCleared`.
MapScreen enables Farm Here only for an unlocked area's canonical/alias clear.
The low-level `startSubAreaRun` service itself does not enforce that UI gate.
Calling it in idle mode from an uncleared state therefore supports a labelled
service diagnostic, not earned idle eligibility.

The next [active-mode measurement contract](D07-active-mode-measurement-v1.md)
uses an explicitly restored test baseline. A supplied synthetic clear, if a
later routing test needs one, proves neither acquisition nor first-clear
feasibility. Actual fresh earned clear and UI idle access remain separate
follow-on proofs.

## Verification and remaining work

Counterexamples that must remain visible: defeated Den does not lock the rest
of Act I; claimed Den does not manufacture a new Cold Plains transition; a
partial Blood Moor run grants no clear; direct idle service invocation proves
no UI eligibility; completing the Andariel quest and clearing Catacombs are
alternative Act II gate inputs, not a claim-required conjunction.

This documentation child checks source references, links, scope and absence of
runtime changes. New executable behavior requires its own frozen contract and
genuine RED. Historical P02b04 tests do not validate new gameplay. C1 still needs
ordinary earned Den/Andariel, quest/equipment/skill/passive/status interactions,
save/reload and mobile UI proof. No C/G or full-v1 gate is accepted here.
