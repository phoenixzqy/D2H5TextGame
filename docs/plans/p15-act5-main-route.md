# P15 — Maintained Act V main-quest route

Owner: root, sole writer. Existing claimed human worktree remains active. No
agents, installs, publication, gameplay tuning or CI prerequisite.

## Problem and increment

The maintained harness has an exact Eve-only suffix. Earned Act V evidence now
includes Siege, Rescue, Prison and Rite plus Eve, but that valid graph is rejected
by the minimum-route predicate. Add an explicitly selected `main-quests` route
with all five main quests and their exact actions, proof receipts, claimed
rewards, canonical area clears and consumed potion/resistance scroll. Keep
`minimum` as the existing screen route; it remains a bounded diagnostic rather
than a complete v1 proof. The full objective remains C0–C4.

## Ordered work

1. Add meaningful failing regressions for all five native quest actions/claims
   around disclosed constructed combat prerequisites, strict graph corruption
   rejection and first-failure retention.
2. Extend the existing native quest-action adapter for finite Act V field/town
   actions and distinguish resistance-scroll Read from skill-book Read.
3. Add the explicit route selection and exact terminal graph; unknown selections
   must fail before mutation. No broad allowance for arbitrary optional history.
4. Run the affected campaign route/action regressions, scoped TypeScript and
   explicit-file lint. Retain failure evidence and remove disposable caches.

## Plan review

ready — Native services already implement the full main quest graph. Prison
requires Inspect, the source-bound Malah potion and Thaw before Nihlathak;
Rescue requires a cleared Highlands and three distinct cage receipts. The
resistance scroll must be read through its native item service rather than
counted as a skill-point book. These requirements are included in this slice.
Constructed combat fixtures prove route wiring and negative boundaries, not
earned viability; the separate audited native Baal/save/browser evidence remains
unchanged. No new gameplay source values are proposed.

## Remaining integration

The selected action order and optional combat proofs now reach the independent
campaign quest auditor and fresh runner. `CAMPAIGN_ACT5_ROUTE=main-quests`
selects the complete route only with `CAMPAIGN_PHASE=act5`; absent selection
retains the minimum route. Both launcher and runner reject invalid modes before
output creation or native mutation. Targeted dispatch checks pass2/2, then the
full dispatch suite passes39/39 in105.076s. Route/action checks pass41/41;
independent quest-audit checks pass34/34. These constructed combat fixtures
prove orchestration/conservation, not earned campaign or balance acceptance.

Scoped TypeScript passes12.192s after restoring the Vite declaration file to
the external check configuration; its first failure was missing `ImportMeta.glob`
types, not a source defect. Final explicit-file lint passes12.251s, including
the launcher's imported Node process and typed child completion. Two real Node
launcher rejection cases pass: unknown route and full route with an earlier
phase both fail before creating their requested output directory.

The separate [fresh level-training increment](p15-fresh-level-training.md) now
integrates maintained training at act boundaries with explicit budgets and an
independent checkpoint audit. Integrate the validated mature build/respec and
mercenary preparation next; do not silently enlarge
the160-admission/10-hour screen. Fresh fourteen-build/five-act acceptance,
all29areas, economy, pacing, PWA/endgame, holdouts, soak and owner playtest remain
open. This slice alone does not close C2/C3/C4.
