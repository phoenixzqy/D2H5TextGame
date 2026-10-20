# BUG-006 — Keep every combat action within the inclusive deadline

Severity: High (combat outcome and measurement integrity). Owner: engine/technical.
Status: fixed and independently source-reviewed, 2026-10-20. Card P06b.
Reproduced before fix at `f36b866`.
Environment: Node 24.21.0, Vitest 1.6.1 Node engine project; seed 7.
Browser/viewport/locale: not applicable; pure engine fixtures without UI text.

## Reproduction and evidence

1. Run `npm run test:engine -- src/engine/combat/deadline.test.ts --reporter=dot`.
2. Use two durable units with AS100 and no skills or periodic statuses.
3. Repeat with AS263, where the action period is 400 ms.

Initial result: 2 failed / 3 passed. The AS100 action timestamps include
`61200`, beyond the 60,000 ms cap. The AS263 actions at exactly `60000`
contain only `hero`; the tied `enemy` action is missing.

Expected: AS100 actions end at 59,500 ms and the timeout event is exactly
60,000 ms. Both AS263 actors may act at 60,000 ms unless an actual victory
ends combat first. Nothing occurs after the deadline. Earlier victories keep
their actual end timestamp. Timeout remains `winner: null`, not victory.

Root cause: the loop checks the previous simulation clock before selecting the
next timestamp, permitting an overshoot; its strict `<` clock condition also
excludes remaining actors tied at the deadline.

## Fix boundary

Check the next action timestamp before advancing the simulation. When it is
beyond the deadline, advance to exactly 60,000 ms and stop. Otherwise process
the action, including deadline ties, while retaining the existing victory and
runaway-action guards. Preserve damage, rewards, tie ordering and DoT behavior.

Controlling scoped decision: `docs/plans/decisions/D04-combat-timing-v1.md`.
Regression path: `src/engine/combat/deadline.test.ts`.
The three already-passing cases cover lethal deadline victory, exact earlier
victory time, and complete deterministic state/timestamps without input mutation.
Full D04/P06 acceptance and periodic-effect/death integration remain separate.

Security check: pass; transient scheduler boundary only, without new network,
filesystem, credentials, save shape, permissions or validation-policy behavior.

## Validation and review

`npm run test:engine -- --reporter=dot`: 38 files / 351 passed, 4.18 s
(exceeds the 3 s engine budget). The new regression file has all five cases
passing. `npm test -- --reporter=dot`: 87 files / 812 passed / 1 existing skipped,
57.14 s (exceeds the 15 s unit budget). Typecheck, lint including engine purity,
and `git diff --check` passed. Existing React act/router warnings remain.
No browser run: this child changes the pure engine and no UI flow.

Independent parent source review: APPROVE; no blocking correctness,
readability, security or performance finding in this deadline-only child.
The actor-only DoT limitation remains explicitly open. The integration ledger
records the P06b fix commit SHA; this report and regression ship with that fix.
