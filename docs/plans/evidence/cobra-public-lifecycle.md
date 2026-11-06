# Cobra public-store lifecycle — native checkpoint

Status: Native public recovery/playback and ordinary save/Continue/import verified.
Subsequent browser durability/UX evidence is linked below; full D05 and earned
acceptance remain pending. Combined native/DEV/production evidence now supports
bounded-functional inventory credit and local resolution of BUG304 for that scope.
Parent: `4d591dff3ecb3efa7f797c4c1edf3094bfa4094c`.

## What the regression establishes

`src/stores/assassin-cobra-public-lifecycle.test.ts` exercises learned Cobra
ranks 1 and 20 through real XP-derived point budgets, the Tiger prerequisite,
ordinary allocation/equipment/priority, `startSubAreaRun`, recorded native
combat events and public `advanceEvent` playback. Catacombs seed 7 / ordinal 0
uses authored enemies with zero current/capacity MP and no enemy mana events.

Each initial, Continue and import run must contain an isolated nonterminal
positive HP/MP recovery witness, before final-team snapping. It proves an actual
Cobra action, positive same-clock cast debit, subsequent exact N−1→N paid gain
for the actual 1–3 consumed stacks, then a later basic release/full clear.
Competing orb/life-capacity effects cannot satisfy that witness. All final
nonstatus unit fields equal native outcomes; presented statuses equal the last
recorded observation or death-cleared authority. Valid terminal batches are
consumed, but cannot supply the nonterminal witness.

The complete persistent snapshot matches real export, flush, load, Continue
hydration and import replacement, including rank, points, priority and equipment.
Only Dexie constructor/table I/O is mocked with an in-memory record. The real
save codec, validator, store adapters and write ordering execute. Restored runs
have empty live teams/events/charges and must earn new paid Cobra recovery.
Combat-unit HP/MP, charges, runtime authority and fractional regeneration carries
are transient: this does not prove that recovered midbattle HP/MP is saved.

The constructed level-30 hero wears an explicitly synthetic cap with life
+999880, mana +999000 and attack +25, at ordinary native action speed. At most
six native waves are inspected. These are integration controls, not earned gear,
sustain, balance or pacing evidence. No monster or CombatUnit override is used.

## Actual validation

| Check | Tool session | Native exit | Result | Elapsed |
| --- | --- | --- | --- | --- |
| Targeted lifecycle | 85345 | 0 | 2 passed / 1 files | 10.952s |
| Full unit | 7612 | 0 | 21,189 passed, 2 skipped / 990 files | 1258.984s |
| TypeScript | 51382 | 0 | pass | 181.317s |
| Lint | 1303 | 0 | pass | 306.268s |

All four checks preserve 5339 identical before/after inputs, snapshot
`cc157092139f4a749a1883b09305e88a59fda2cb70900aba8154b4d46a0e87fe`.
The test SHA256 is `4801b5d1dfdedc943ba30b45552023eb440779c3784f7bae172545cd17e81d7f`.
Full command is unfiltered `npm test` with output-only default/JSON reporters.
No discovery, coverage, worker, assertion or timeout setting changed. Existing
skips remain skips. This test/documentation checkpoint has no production delta;
prior production-build/coverage results retain their original scope rather than
receiving fresh-check credit.

Retained failed attempts are test setup/oracle diagnostics, not production RED:
the synthetic slow-speed fixture reached release with full MP from natural
regeneration; a fixed one-stack expectation contradicted an actual two-stack
release; and reset sampled real time before the frozen export clock. The final
test uses ordinary speed, actual paid 1–3 stacks and freezes time before reset,
while preserving strict full snapshot equality and all recovery assertions.
The two-stack diagnostic did not record the damage/dodge reason for the earlier
nonconsuming basic, so it establishes no definite dodge explanation.

## Review and evidence retention

Independent final test/targeted-native review is `v6-native-review.json`, SHA256
`4ded9bc64b71e7fa76e2027fe25abd2aaccc19fb35be1dd320ca600036d535f8`:
source approved, targeted 2/2 pass, security pass, no findings, readers released.
That review precedes the final full/types/lint results; the final checkpoint
review and local commit are recorded separately in the retained root packet.
Summary bindings:

- `primary-fourth-summary.json`: `77267406b90cebd18d1660d8cfb78ae07fd07f9b618017bb37f42734d33c0711`
- `full-first-summary.json`: `f6efe096b6eb07a847fdba1f1667d2a04ece61485532949b41841740fd18f6e0`
- `typecheck-second-summary.json`: `76eebcefa629312703355e76aee2386cfeb538e886bc8975e1f2b374551dd77b`
- `lint-second-summary.json`: `b43b19619c4683d0f140e57b89c9c5625e4bcc9882a63235e16816b78cebd9de`

Raw logs/results, full before/after maps, failed candidates/diagnostics and
independent reviews remain at:

`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-h2-hell-b6de0n4x/cobra-public-lifecycle`

Root retains this exact evidence through unfinished full-v1/independent
consumers and owns eventual verified removal. No build/coverage output was
created by this checkpoint. The repository test and documents are deliverables.

## Remaining acceptance

[BUG304](../../../production/bugs/BUG-304-cobra-mana-free-monster-contract.md)
is resolved locally for bounded recovery functionality. The later
[browser checkpoint](cobra-browser-lifecycle.md) verifies
actual IndexedDB durability/Continue/import UX and recovery playback across
eight constructed DEV cases; this native checkpoint's original scope is unchanged.
The [production supplement](cobra-production-offline.md) supplies offline public
controls/previews and resource scrolling/captures. Independent combined review
accepts bounded-functional credit: inventory 213 bounded / zero unverified.
Full D05 and independent feature/earned acceptance remain separate.
No terminated H3/browser retry, earned sustain/economy/pacing, campaign,
whole-app locales/devices/a11y/performance/PWA, actual CI, human/soak or full-v1
acceptance is supplied. No publication, merge or deployment occurred.
