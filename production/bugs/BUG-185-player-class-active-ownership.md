# BUG-185 — Require learned ownership before native class-active combat

Severity: High. Status: Fixed locally in `70be381240aed745897271964448d1dbb950ca3b`.
Independent acceptance remains open.
Owner: engine-dev / store integration (root sole writer this session).

## Reproduction

Baseline: `65b6b85846d7c4f8b7535d3dc07918bcaf977417`.
Vitest/jsdom native Player projection → real deterministic engine, seed7.
Browser/viewport/locale: not applicable to this engine/store reproduction.
All inputs are synthetic, not earned progression evidence.

1. Construct a level30 Barbarian, empty allocations, priority `barbarian.bash`.
2. Call `playerToCombatUnit`, then `runBattle` against a one-HP, zero-dodge dummy.
3. Observe the hero action and remaining mana.
4. Repeat with imported Sorceress Ice Blast and its prerequisite on a Barbarian,
   or an actual Sorceress lacking Ice Bolt; repeat with malformed ranks.

Expected: unavailable class skills cannot cast; basic attacks do not pay skill MP.
Actual: Bash casts at implicit rank1 and pays5MP; foreign or prerequisite-less
Ice Blast also casts. Duplicate rank aliases use the first match instead of MAX.
Known passive/aura slots remain in the combat priority copy.

Evidence: `src/stores/player-skill-ownership.test.ts`; corrected causal RED:
21 failed / two valid rank1/20 controls passed. Raw command receipts retained in
the task-owned `d2h5-player-skill-ownership-76q2majn` root pending evidence archive.
The original fixture wrongly assumed legacy maxRounds limited actions; its
failure is retained, and the corrected fixture ends on the first actual kill.

Root cause: native configuration guards summons and D10 equipment actives only;
ordinary class priorities pass through, and trusted engine snapshots allow
implicit rank1. Save import accepts configuration without authenticating ownership.

Workaround: select only lawfully learned current-class actives. Existing persisted
priorities must survive; do not discard or rewrite imported progress to fix combat.

## Required regression scope

Exact data/canonical aliases, maximum valid rank once, class/unlock/cap and ordinary
transitive prerequisite checks; basic attacks/resource conservation; lawful casts,
native learning/reset/next-wave/replay/import. Preserve direct-prerequisite summon
contracts, Iron payment/locking/presentation and existing D10 equipped grants.
Generic non-class registrations remain available. No new save fields/version.

Review reproduction: the first filter still treated unauthored class IDs as generic
extensions. Existing registered `amazon.piercing_strike` casts on both Barbarian
and Amazon from an imported allocation, paying20MP despite no authoritative JSON
definition. Added seed7 native/engine RED: five failures /309 controls pass.
Reject class namespaces without definitions; retain truly non-class extensions.

## Final local verification

Full standard suite12822 passed/540 files, two existing skips; final engine6585/224,
types/lint/production build/bridge pass. Production en/zh desktop/mobile4/4 and
eight separately audited exact five-domain Save/Continue pairs.
[Evidence](../../docs/plans/evidence/d04-player-class-active-ownership.md).
Independent acceptance and full private-v1 remain open.
