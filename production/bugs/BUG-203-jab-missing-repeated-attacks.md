# BUG-203 — Give Jab its promised repeated attack attempts

- Status: reproduced and contracted; implementation and functionality credit open.
- Severity: High — the advertised multiple-hit mechanic has no runtime sequence.
- Environment: Node24.21.0, actual native Amazon projection/default registry via
  Vite Node. Synthetic resources and held opponents, no genuine campaign action.
  Reproduced against the frozen Impale verification source, now committed at
  1d1eca0f; exact hashes and actual committed-blob proof retained.
  Jab's actual JSON row is unchanged from HEAD2d7cc6ce. This does not imply the
  uncommitted Impale source as a whole equals that historical commit.
- Locales: both existing descriptions promise multiple hits. Browser/viewport
  not applicable to this engine diagnostic.
- Seeds7/19/41/97; ranks1/2/20.
- Systems/owners: root acting as engine/content/design/QA; independent acceptance open.

## Reproduction

1. Project a synthetic L30 Amazon through real `playerToCombatUnit` with Jab
   rank1,2 or20 and only Jab selected. Use HP2000/MP100, zero regeneration,
   resistance/Defense/dodge/critical and a held living target.
2. Allow one actual1700ms cast, then hold the hero. Record all action, damage,
   resource and final-HP events. Require exact replay and input immutability.
3. Assert that a paid Jab cast makes more than one attack attempt, including
   misses. This assertion deliberately does not invent a particular sequence count.

Expected: the existing multiple-hit promise has multiple real attempt settlements
under one accepted cast and payment; exact tuning belongs to the contract.

Actual: all12casts pay5MP but settle exactly one attack attempt. Rank1 direct
hits are30/35/0miss/33; rank2 is33/38/0miss/36; rank20 is87/92/0miss/90. Final
HP is exactly2000 minus that sole attempt. The real registered effect has no
`hitSequence`; the native priority is legal and the actual action occurs.

Root cause: Jab is authored as an ordinary scalar damage effect without any
sequence metadata. The shared bounded damage-sequence runtime already exists
for Fury, while the JSON schema currently permits it only on Fury. Neither the
skill name nor the two locale descriptions can create additional attempts.

Evidence: [native reproduction](../../docs/plans/evidence/d04-jab-repro.md),
[contract](../../docs/plans/decisions/D04-jab-v1.md). The structural/native RED
is retained separately from the passing Impale verification; no Jab credit.
