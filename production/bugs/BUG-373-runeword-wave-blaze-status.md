# BUG-373 — Establish paid Blaze before testing wave removal

Status: Fixed — paid-Blaze fixture corrected; final ordinary suite, types and lint pass.
Severity: Medium — invalid regression fixture; no production Blaze defect established.
Owners: qa-engineer / engine-dev; producer independently reviews evidence and source.

## Reproduction

- Base: `75cb704378c9c017c709bc6ed36a8cace9aa245f` with native Bash changes.
- Environment: Linux, ordinary Vitest UI project/jsdom; constructed integration
  characters. Browser, viewport and locale UI are not exercised.
- Seed: runSeed7/challengeOrdinal0; actual battle seed2654435766. The mock hero
  ID uses Date.now; no causal RNG contribution from that identity was found.
- Original2080-input map:
  `a03076fd0a18739fab895e46af5bea54ef370a642c4b9f021ab29889d30cc1a0`.

1. Run ordinary units using the reviewed default boundary; no diagnostic
   workspace, closed policy or protected retained-final fixture is selected.
2. In `src/stores/runeword-combat-wave.test.ts`, the hero Hand of Justice case
   prioritizes synthetic FINISHER before the granted rank5Blaze. Its front merc
   has empty combo/no signature, which selects native `mskill-bash` fallback.
3. Record the wave, verify frozen replay, unequip, rebase terminal statuses and
   advance. The original assertion expects a paid Blaze from the original hero.

Expected: a removal test first establishes a real paid, unexpired Blaze; source
removal clears that field while preserving other carried state and recording.
Actual: the expected original Blaze is undefined. Native ordinary units exit1
in1234.562202s:21101tests pass/one fails,992files pass/one fails. All2080inputs
stay unchanged. No timeout occurs. This report was filed before correction.

## Root cause and causal trace

The preserved original-fixture trace keeps every input and assertion. It
reproduces11passes/one same failure, exit1/12.582315s, unchanged2080map
`3a0f317df65caceb04e526629043bbd39e66a7c32331dd27a775d604c5c7f7b8`.
At400ms the hero pays8MP for FINISHER and misses one41HPFallen. Native merc
Bash then deals22+20 to that survivor at400ms; combat ends at400ms. There is
no Blaze action, payment, buff or status. This is no-cast, not expired carry.

The fixture's lethal-first priority does not establish its paid-field premise.
Native Bash legitimately ends combat sooner. The companion was not unused:
front/empty-combo fallback is an actual timing/RNG interaction path. No production
Blaze defect or Date.now cause is established; no production workaround applies.

## Correction and validation

Only the hero Blaze case now prioritizes Blaze before synthetic FINISHER. The
native companion and every original replay, resource, carry, cooldown, source
removal and saved-priority assertion remain. New assertions establish first
cast400ms,22MP debit, statusBacked buff, original source/rank5, literal400..3400
status clocks and terminal inside that interval. Temporary observation is removed.

Actual failed correction attempts remain preserved:

- A surplus parenthesis is rejected by source-boundary preflight before tests:
  exit1/4.091574s, unchanged2080map
  `cadf17f4d32e4213d759f0d2c9b618e53c1c00eb05b057fb8d3d4a5e5b616158`.
- Its single-character successor passes12/12 in13.848498s, but scoped lint exits1
  in10.190875s on a matcher-any assignment, unchanged2080map
  `b944d9007004f5658fdd8af95ce2350ac4d89a2fcb577a2e2f549d4c2240a6c6`.
  A discriminated native event/direct status assertion replaces only that new
  observation; no fixture or expectation is weakened.

Final2080map
`12bc75977a677d12f79052428bef445167eb475a3df6694718a3bbc19a59b562`
passes12/12 in12.970964s and scoped zero-warning lint in9.800919s. Exactly one
input differs from the original broader gate: this wave test. Independent
producer approves the native diagnosis, complete correction and additive
ordinary wave/lint runner. Final ordinary units pass21102tests/993files with
zero failed/pending/todo in1584.117326s. Project types pass280.345979s and full
zero-warning lint/engine purity passes540.454492s. Each terminal native receipt
records unchanged2080inputs at the final map above. The fixture defect is fixed;
independent final evidence review and exact commit binding govern the local
checkpoint. Browser, earned and full-feature acceptance remain unresolved.

## Evidence and boundaries

Root retains exact original, traced and failed-correction sources, native logs,
JSON and before/after/result receipts plus `wave-trace-analysis.json` and
`wave-correction-review.json` at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-bash-txtr1cps`.
Original test SHA256:
`7a03a881c446ac1b58262319508828b45647c703cdc2da0caf7963a60b635c6d`.
Final test SHA256:
`45225507631878ce9b376bf28563ba861f43e44a07016ef5634fb2afe844c6a6`.
Root owns eventual exact-path cleanup through unfinished acceptance. No protected
fixture access, diagnostic execution, app/browser retry or new acquisition/
lineage/gameplay replacement experiment follows. Engine/build predecessor
production inputs are unchanged; those are not successor rerun claims.
