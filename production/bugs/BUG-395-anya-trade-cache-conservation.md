# BUG-395 — Preserve accepted hero caches during physical trade rollback

- Status: Fixed locally; bounded current32 integrated acceptance APPROVED (see final acceptance below).
Severity: Medium. Owner: root / engine-dev; independently reproduced by producer.

## Reproduction

Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus unpublished batch.
Environment: WSL installed Vitest UI project; browser/locale not involved.
RNG: deterministic Anya trade seed derived by executeAnyaTrade from hero/entry identity.
1. Arrange earned Anya entitlement, an accepted stale defense cache999 and enough
   materials/currency for the finite Waterwalk trade.
2. Execute the public paid trade.
3. In the actual publication observer, rename/move the new boots to authoritative
   hero equipment and its mirror, then throw.

Expected: remove failed reward lineage and refund payment while preserving the
continuous hero's accepted cached stats and independent changes.
Actual: item removal/refund succeeds, but defense becomes canonical20.

## Evidence and cause

Packet: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1.
anya-physical-stale-cache-red-v1.log and source-bound exit receipt retain the
actual causal failure. Regression: src/features/town/anyaTrade.test.ts,
hero-equipped case. Shared questRewardOwnership.restore unconditionally derives
hero stats when cleaning touched equipment, even when original composition survives.

## Resolution

Added bounded read-only actor/cache continuity witness in the physical journal.
No XP ownership or transaction normalization is introduced. Independent surviving
composition and actual XP recomposition must keep fresh stats; raw XP and damage
must survive without incidental normalization. The initial focused trade/cache
checks pass. A second actual RED proved the witness must remain subscribed during
compensation; physical-compensation-xp-green-v1 passes the21physical controls plus
affected cache Claim/acceptance suites. Producer's expanded44trade controls pass.
No commit/publication made.

## Final acceptance

The later [integrated current32 evidence](../../docs/plans/evidence/p14-successor32.md#final-bounded-local-acceptance) supersedes pending integration notes above. `d2-counted-source-z3jj3xa1/current32-acceptance.json` retains exact source, reconciled unit coverage, green terminal checks, headed-browser evidence and cleanup. Original failures stay retained; no uninterrupted full-green, earned pacing or full-v1 acceptance is claimed.
