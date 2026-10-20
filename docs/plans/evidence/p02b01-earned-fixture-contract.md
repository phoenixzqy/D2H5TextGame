# P02b01 — Fresh earned recipe contract

2026-10-20, input head `1c55248935d1ae4b94c7359fe44581950f9279fa`.
This child adds strict parsing and fingerprinting for a fresh Sorceress earned
action recipe. It executes no acquisition actions or Den challenge. P02b00's
[source feasibility](p02b00-post-mr-den-feasibility.md) remains source arithmetic,
with the historical failed discovery kept distinct from current observations.
Den, campaign, balance, pacing, C0–C4, G0–G7 and full v1 remain unaccepted.

## Delivered behavior

The additive `tests/sim/production/earned-fixture.ts` accepts only version2,
fresh production Sorceress defaults, a safe clock, 1–8 uint32 target seeds and
1–32 ordered closed actions. Exactly one bounded Blood Moor farm count must
match the Den target ordinal. It checks real production references, active
Sorceress combos, the actual hire-roster subset, attribute spending, equipment
base/slot compatibility, Act1 links and unique checkpoints. Inputs cannot
supply character state, items, rewards, imports or overrides. Validation neither
coerces nor fills fields and returns an independent nested clone.

`fingerprintEarnedFixture` hashes the complete validated recipe with the
unchanged canonical JSON/path/length/byte protocol. The independent Python
oracle is 1693 canonical bytes and
`60ac311d50e7db36d7d95d77dff9244adf3b54534290bc22c8b791546765d90a`.
The README documents the contract and deferred execution checks. Five existing
v1 implementation/test files retain their baseline SHA-256 values; no `src/`,
configuration, package, persistence, CLI or allocator behavior changed.

## Independent review and retained attempts

Design/technical, producer and QA approved the parser-only plan. Producer and
QA reviewed the missing-module RED before implementation. Their initial review
required actual hire-roster references and real non-roster mercenary controls,
real nine/ten-skill combo bounds, matching invalid farm/ordinal bounds, catalog-
present foreign class/skill controls, an isolated invalid checkpoint slug and
selector-only fingerprint sensitivity. These were added before the final freeze;
all original assertions and each intermediate RED source/result are retained.
Final frozen source SHA:
`702317a4c2fcd508d78c0c6e6701447c24c1f76f7878d3e480aea1da40a9cb5d`.
Each RED run passed 35 old v1 assertions and failed to load the absent new
module; zero new assertions executed. This is a missing-capability RED, not
127 failed assertions.

The parser stage used an explicit name filter: its report contains 148 actual
passes and 14 intentionally filtered assertions, despite Vitest's aggregate
claim of 162 passes. The subsequent unfiltered focused run passed all162
(127new +35v1), and related passed174. No filtered run substitutes for final
validation.

Initial typecheck failed on three possibly undefined indexed values. Both
reviewers approved only two test-presence guards and optional access in the
parser's existing farm-count check. Original source, failure, approved exact
diff and final source are preserved; nested mutations and every assertion
remain intact. Final parser SHA:
`c29b0b99c8b75bb4f4a856b7935e0f0323172c4bfbc1b9718d0a39b18eade9f5`;
final test SHA:
`99fb52eda848407cfcdc1089fd71cc1399ab2be770b8050204675959cc1b61d1`.
Producer `P02B01-SOURCE: APPROVE` and QA
`P02B01-QA-SOURCE: APPROVE / ADEQUATE` found no remaining material source/test
issues. Both released their source/fingerprint consumers before the build.

## Validation

All commands ran in the claimed isolated worktree. Exact argv, exits, wall times,
full reports, logs, source snapshots and amendments are in the indexed archive.

| Final check | Result |
| --- | --- |
| `npm test -- --reporter=json --outputFile=<task-owned path>` | 2994 actual passes, 0 failed/skipped/pending/todo; exit0, 49.832s |
| `npm run typecheck` | exit0, 24.902s |
| `npm run lint` | exit0, 56.263s; purity guard scanned57 engine test files |
| `npm run check:test-bridge-shake` | exit0, 9.080s; four production JS chunks, no test-bridge symbols |

Related6.880s exceeded the unchanged5s budget. Initial full45.803s and final
full49.832s exceeded the unchanged15s budget. Final unit/typecheck/lint ran
concurrently; these timings establish command completion, not performance
acceptance. The build ran after all tests and source consumers finished.
Existing large-chunk and oversized manifest/precache warnings remain recorded.
No engine code or browser flow changed, so this child claims neither new
coverage measurement nor browser/earned gameplay evidence.

## Durable evidence and continuation

[packet.json](fixtures/p02b01-earned-fixture-contract/packet.json) indexes78
archived records, exact commands/reports, source hashes, review/amendment
attribution and cleanup ownership. The
[diagnostics archive](fixtures/p02b01-earned-fixture-contract/diagnostics.tar.gz)
has SHA-256
`5064247e0ad9bbf745fd8f95173ae840d560eeb3747b75970540e09c18b1133e`.
Final outcome review and cleanup status are recorded in the packet and closing
execution-ledger entry. Root owns the recorded RAW, `dist` and task-created
`.vite` cache until all consumers release; installed tools and shared caches
are preserved. The overall worktree stays claimed for full v1.

Next is a separately reviewed P02b02 acquisition adapter using seven-store/meta
isolation, actual UI eligibility and production actions, W1 settlement followed
by abandoned W2 flee, original earned item IDs and honest partial/refusal output.
Reporting/repetitions and a tiny frozen screen follow separately. No push, PR,
merge, deployment or additional native pilot occurred.
