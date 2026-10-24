# D05 — Poison and Elemental Mastery / BUG174

2026-10-24; implementation `09a2722`, shared compiler `9e643b8`, baseline `b713c03`.
Root sole writer in the preserved claimed human worktree. Local implementation
and verification complete; independent acceptance and earned class/build balance open.
[Contract](../decisions/D05-poison-elemental-masteries-v1.md).

## Result and scope

- Necromancer Poison Mastery: +4% poison/+2% arcane damage per allocated rank.
- Druid Elemental Mastery: +3% fire/cold damage and +0.5pp magical dodge per rank.
- Both retain authored unlock30/cap20 and exact authored/canonical aliases.
  Maximum valid integer alias once; class/finite-level guards, no implicit rank.
  JSON potency unchanged. Closed per-ID schema and copied frozen tuning use the
  shared compiler. Other schemas/25prior skill rules remain unchanged.
- One fresh player-boundary projection adds damage before existing runeword
  grants and dodge over fresh equipment. No owner inheritance by mercs/summons,
  resource refill, recording mutation, extra action/cost/CD/status/RNG or save change.
  Reset/removal clears bonuses; ordinary allocation affects the next wave;
  explicit replay preserves original pools/carries and income.
- Existing final-hit-derived poison DoT snapshots include the increased hit
  once; no second tick multiplier or new coefficient. Real rank20 Poison Nova
  at seed7 hits96/99/172 for mastery0/1/20 and snapshots floor(hit×.05) per stack.
  Poison Dagger's existing marker without a DoT coefficient is outside this fix.
- Both locales now describe actual allocation scaling and next-wave eligibility.
  Druid details name fire/cold separately and retain fractional dodge values/deltas.

## Causal and final verification

Frozen corrected composition4RED/4controls; schema2RED/2controls; bilingual UI4RED;
native allocation/reset4RED. Exact four source files/hashes retained. Initial
composition compared deliberately different identities/allocations and was
corrected before counting causal failures. Later gear/dodge cases and a test
parameter-type correction are distinguished from the original frozen RED.

Final commands and complete outputs are in the raw archive/ownership manifest:

| Check | Result |
| --- | --- |
| Focused ten-file unit/native/UI/schema/control run |142PASS,11.98s |
| `npm run test:engine` |5868PASS/188files,72.00s |
| `npm test` |11915PASS/479files,2existing skips,408.64s |
| `npm run typecheck` |PASS |
| `npm run lint`; explicit no-ignore browser-file ESLint |PASS |
| `VITE_E2E=false npm run build -- --outDir <task>/build` |PASS; four JS chunks/all five forbidden bridge patterns, no matches |
| Production en/zh × Necromancer/Druid × desktop1280×800/mobile360×640 |8/8,99.71s; no retry/skip/flaky/captured error |

Coverage includes rank1/cap, aliases/caps/malformed/foreign/underlevel/removal,
independent copied tuning, exact per-type direct damage and ordinary passive
exclusion, real Poison Nova snapshots, replay determinism, actual magical misses,
Infinity addition/fresh gear/no accumulation, and native next-wave/reset pools.
Synthetic combat fixtures certify these mechanics only, not balance or campaign.

Browser tests import explicitly constructed legal level30 functional eligibility,
then use ordinary learning/rank-up and Save/close/Continue. All eight complete
player/inventory/map/mercs/formation pairs are exact. Derived stats/resources and
ownership do not change merely from allocation. Passives stay out of active
options; no test bridge, horizontal document overflow or sub44px allocation
button. Four representative final screenshots inspected; complete16screens in
the report. This is bounded browser evidence, not full accessibility/PWA acceptance.

The initial compiler full run failed two source-provenance guards after root
added new source during measurement, plus one5s dynamic-import timeout. All three
pass in the final stable full run;42changed source/test hashes and full worktree
status stayed byte-exact for that entire run. No timeout/assertion/check weakened.
Initial test-syntax/typecheck and schema-edit-helper failures are also retained;
their corrected checks pass. Build size/PWA-manifest/Browserslist warnings remain.

## Retention and remaining work

[Versioned fixtures](fixtures/poison-elemental-masteries/) retain all raw logs,
programs,24attachment hashes, eight exact Continue pairs,42source/test hashes,
build provenance and21terminal process records. Archive members are verified
byte-for-byte before removing scratch/build/browser staging.4456closed; cleanup
result is recorded in the fixture cleanup file. Shared caches are preserved.

Genuine earned Rite save remains decompressed SHA256
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`, nextNormal402.
No genuine challenge, reset, allocation or preparation action occurred.
Inventory:191unverified skill IDs; these two receive only bounded-functional,
independent-acceptance-open status. C2–C4, earned builds, economy/pacing/endgame,
independent review/QA and all full G0–G7 gates remain open.
Next candidate: Necromancer Summon Mastery/Summon Resist; inspect owner provenance,
global/local stat composition and all summon creation paths before implementation.

Root plan-review: ready. Security check: pass. Root self-review only; no independent
review/QA, remote publication, merge or deployment claimed.
