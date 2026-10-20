# P06d — Independent magic mitigation

2026-10-20. Scoped primitive for P06/D04, with save compatibility and a localized
character-sheet row. [D04](../decisions/D04-independent-magic-mitigation-v1.md)
and [ADR-003](../../decisions/ADR-003-version-independent-magic-mitigation.md)
were accepted before runtime implementation. The prior native Den draw remains
failed discovery evidence; it does not establish a regression or authorize a retry.

## Behavior and proof

Every actor now uses armor for physical/fire/poison/thorns and independent MR
for cold/lightning/arcane. Required finite nonnegative MR is composed from the
validated JSON policy, authored monster values/tier/final overrides, and the
supported explicit item bonuses. Friendly bases and summons are MR0. Merc
combat projection adds signed equipment MR to the saved baseline before one
floor/clamp, without persisting or accumulating it. No new item rolls, base-item
MR, rune or runeword capability was added.

Actual recorded-battle assertions cover all seven damage routes, unequal
armor/MR, incoming and outgoing magic, unchanged resistance order/minimum/RNG
and replay purity. Factory/stat assertions cover every monster tier, authored
zero/default/growth/final overrides, chapter-boss final overrides, modern/legacy
gear, unique/set bonuses, merc baselines/projection and summons. Chapter-boss
forwarding is source-reviewed rather than covered by a dedicated integration assertion.

Save9 requires MR on the hero and all owned mercs. Genuine historical inputs
validate before starter recomposition or MR defaults. Missing historical MR
becomes0; valid extensions survive, including the v7 Amazon starter seam.
Malformed present extensions (including own-property undefined) are rejected.
Whole-state assertions preserve other fields/resources, test corruption before
recomposition and cover current roundtrips. No unrelated rederive/heal is added.

## RED, amendments and failed attempts

The frozen feature RED has40 tests:31 failures and9 controls passing. The
policy module separately fails on the genuinely missing module/data before its
two tests pass. Original test sources, original failures and all before/after
amendment bytes remain in the diagnostic archive. Frozen source SHA256 values:

- Battle: `69b2f831f430f7cdaab87b22d33bb45f3379103d1bc45b745287906fcae9195e`
- Stats: `9e139d1e2de8f0f9b009f53d4c520b51983042a2d4de0617ff1978da7c6ecdb5`
- Save: `c01fccce653cd363e9617f175ba20052261f9d1ff3cb6a98582b961b220a64b4`

QA independently approved the initial actor→source event-oracle correction,
then three exact fixture amendments. The first adds31 explicit MR0 values,
corrects a type import and types three tuples, without numeric oracle changes.
The second updates current save expectations to9 while keeping historical
inputs genuinely historical; it corrects the new v6 formation expectation to
the existing migration7 defaults and gives an existing synthetic curse target
MR10 to preserve its original40 damage/460HP oracle. The third adds only MR0
to two complete stat-object expectations. All34 distinct amended files match
their latest approved bytes. Exact patches and approval/hash records are in
the packet and archive.

Intermediate failures remain preserved: a partial runtime attempt, incomplete
MR fixtures, historical/current version expectations, the v6 oracle, two
missing MR expected-object fields, and lint's unsafe any-array spread. The lint
fix narrows owned mercs to readonly unknown[] before spreading. Rune/runeword
schema changes identified as excess scope were removed before final validation.

## Final validation

| Check | Result | Wall time |
| --- | --- | ---: |
| Engine |1085/1085 pass |9.740s |
| Related |1594/1594 pass |40.789s |
| Full unit with coverage |2867/2867 pass;0 pending/todo |72.209s |
| Typecheck |exit0 |15.997s |
| Lint |exit0; purity57 test files |77.237s |
| Production build |exit0; guarded after test consumers exited |9.798s |
| Localized dev-browser proof |2/2 pass;0 skip/flaky/retry |17.474s |

The unchanged80% engine coverage gate passes across65 modules: statements/
lines8327/8807 (94.54%), functions307/326 (94.17%), branches1999/2205 (90.65%).
`git diff --check` passes. Exact argv/cwd/start/exit/time metadata for22 commands,
20 reports, diagnostic logs and65 changed source hashes are indexed in the
[packet](fixtures/p06d-independent-magic-mitigation/packet.json).

Engine9.740s exceeds the documented3s loop budget; related40.789s exceeds5s.
The first full unit attempt51.596s exceeded15s; final coverage72.209s also runs
the full suite. Budgets were not widened. Build warnings remain: a chunk over
500kB, outdated Browserslist data, and a2.57MB asset manifest excluded from
precache. This is no performance or PWA shipping signoff.

## Browser scope

Fresh character creation, settings locale selection and HUD navigation reach
the character sheet in both locales at320/360/768/1024/1280/1440px. Assertions
check localized MR0, no horizontal overflow and no page errors. The final360px
captures explicitly scroll the row into view and assert it is in the viewport:
[English](fixtures/p06d-independent-magic-mitigation/mr-character-en-360-row.png)
and [Chinese](fixtures/p06d-independent-magic-mitigation/mr-character-zh-CN-360-row.png).
Root and QA inspected both; producer also confirmed legibility.

This browser proof uses Vite's dev server. Production build success is a separate
check, not production-bundle browser acceptance. Initial browser failures used
a nonexistent navigation anchor; a second passing attempt captured the wrong
nested-scroll position. Both attempts remain preserved. The final attempt uses
the actual character HUD and the stronger viewport assertion. Task-local Noto
fonts compensate for absent host CJK/emoji fonts; no product CSS/font change.

## Independent review and retained evidence

Developer: Codex/root, implementation and final validation complete.
Design/technical: accepted D04/ADR003 and P06D-PLAN APPROVE before runtime.
Producer: P06D-SOURCE APPROVE after five-axis source review, reports, build and
both screenshots; no remaining material finding. QA: source/test quality
ADEQUATE; all amendments, reports and final row screenshots verified.
Producer P06D-OUTCOME APPROVE and QA P06D-QA APPROVE / ADEQUATE independently
verified the durable packet, including all102 archived members and coverage.
All three agents released their evidence consumers. Root verified no active task
consumer, removed the exact old RAW, dist and node_modules/.vite directories,
and verified all three absent. Installed node_modules, shared tools/caches,
source/history and durable evidence remain. The command runner alone transfers
to root-owned next RAW `d2h5-root-earned-measurement-0gjegt_f`; task fonts were
removed. Exact paths and transfer hash are recorded in the packet.

[Diagnostics](fixtures/p06d-independent-magic-mitigation/diagnostics.tar.gz)
retains102 compact source/report/log/plan/amendment/environment records, with
each member's bytes/hash indexed in the packet. Archive SHA256:
`e40e39f9bd00212f1f0dafdd4432f435e15d4e5e0a4aa7aaa3f1d7a2bbf425de`.
Large coverage HTML, duplicate screenshots, fonts and disposable build/cache
outputs are not deliverables. The packet and closing ledger retain verified cleanup.

Incoming hostile magic changes too. No earned Den checkpoint, native retry,
Andariel/campaign/pacing/balance, C0–C4/G0–G7 or full-v1 acceptance follows.
Next: source feasibility at this accepted head, then reviewed earned-acquisition
production measurement; no imported progressed fixture or guaranteed-win proxy.
