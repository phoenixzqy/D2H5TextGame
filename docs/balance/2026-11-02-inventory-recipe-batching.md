# Inventory recipe batching — 2026-11-02

Status: targeted implementation and affected checks complete; BUG592 and full
private v1 remain open. Continues the current earned-inventory performance work.

## Change

The inventory recipe list now loads freshly validated item definitions once and
shares lazy quest lookups within that synchronous read. Exact authored sources
still control visibility and readiness; only real ingredients and an owned tool
permit assembly. The singular status API shares the private derivation. No
caller can supply a trusted context, and no validation survives between reads.
All action preflight, complete-ledger validation, transaction, publication and
rollback boundaries remain in place. UI subscriptions, localized copy and item
ownership are unchanged.

The bilingual regression reproduces four full item-graph reads for one ready
Staff list before the fix. The new path uses two: one for the list and one for
the independent counted graph. It then assembles real recovered ingredients,
consumes the exact components, retains the Cube, disables another assembly and
announces the result. Additional tests cover fresh missing-tool/repair reads,
real assembly, and changed authoring rejected after an earlier successful read.

## Verification

89 actual passing assertions across five affected files: QuestItemsPanel14,
InventoryScreen.pagination6, questStages4, staffQuest20 and khalimQuest45.
The resource RED has two real failures; its other12 assertions are filtered,
not passing. A later fixture-only run executes three passing assertions and
filters15. Vitest1.6's top-level JSON counters include filtered cases, so counts
come from individual assertion statuses. No unrelated suite or campaign runs.

Final global incremental types exit0 (`bug592-quest-list-types-v2.log`), four-file
ESLint exit0 (`bug592-quest-list-lint-v2.log`), and scoped diff whitespace pass.
Initial GREEN has17passes and one incorrect capitalized English assertion;
the actual message is “Horadric Staff assembled.” Only that assertion is fixed.
The first type/lint pass sees tuple elements as possibly undefined; explicit
constant tuples fix the test fixtures without casts or production changes.
The89-case affected run passes before that type-only correction; the three
changed-fixture cases subsequently pass. No engine/data/schema/save change.

## Real browser result

Fresh baseline and candidate use Chromium147 in WSL, desktop1280×800/en and
mobile360×640/zh at4×CPU. Public native file import migrates the unchanged earned
save32→33. Exact import/export, IndexedDB contents, inventory first100/final13
cards and the exact last earned item all pass; both consumed recipe controls
remain disabled. All7,413items and every expected save field are retained.
No page/console errors or horizontal overflow. No source changes during either
frozen measurement; both servers/contexts/browser instances terminate normally.

| First inventory page | Before | After |
| --- | ---: | ---: |
| Mobile action-to-visible wall | 2297.9ms | 2081.9ms |
| Mobile longest task | 354ms | 231ms |
| Mobile sampled inclusive quest panel | 339.5ms | 183.3ms |
| Desktop action-to-visible wall | 432.7ms | 577.9ms |
| Desktop longest task | 117ms | 107ms |
| Desktop sampled inclusive quest panel | 67.2ms | 42.6ms |

The retained change removes demonstrably repeated work and materially reduces
mobile panel CPU/long tasks. Single-run development measurements include
profiling/automation overhead; desktop wall regresses despite lower sampled
panel work. They do not prove a uniform navigation speedup or Web Vitals budget.
Inclusive samples overlap and must not be added.

Raw final-page measurements are retained, but their speed comparison is not
accepted: the candidate's extra panel screenshot changes its starting scroll
position. That capture is after the first-page measurement, which remains
matched. Oversized element screenshots are clipped by the application scroll
container; they are diagnostic, not a complete panel visual/accessibility audit.
No extra browser replay is required to support the narrower first-page result.

## Evidence and remaining work

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Stems: `bug592-quest-batch-plan-v1`, `bug592-quest-list-red-v1`,
`bug592-quest-list-green-v1`, `bug592-quest-list-affected-v1`,
`bug592-quest-list-fixtures-v1`, `bug592-browser-quest-baseline-v1`,
`bug592-browser-quest-batch-v1`, `bug592-quest-list-readback-v1`.
Drivers, raw JSON, logs and CPU captures remain available for independent review.

Authority38 has2129inputs and changes exactly four files from authority37.
Source hash `d0b8f217d0df779683768c79c0cbfb0b8d6eba7a73cc821d413fa5b53371e5cf`;
data hash `f52d5e4ff3995f9b5b23ac13f168e744ad22ca0c7be0d50985adc204ecc862dd`.
Canonical earned source remains SHA256
`92bb1d9c21175dd4ca9120048a43444b59e4cc9ec060ac7d6a56bcdc96326e44`.
No prepared/browser copy replaces it; no loot/combat/recruitment replay occurs.

Inventory/startup/storage performance remains open, including the previously
measured9.915s throttled-mobile cold reload. Next prioritize chronological
recruitment/funding with actual competing sinks and representative Hell income.
The14-build chronology/fairness/holdouts, defeat/retry/manual-idle,30–50 active
hours, integratedG0–G7, two-hour soak, independent review and later ownerplaytest
remain. Accepted balance0; no pending answer/external blocker; CI excluded.
Root retains the worktree and required packet through review and owns eventual
cleanup. Exact disposable paths/terminal handles are recorded in the final
handoff. Security/root-cause/plan review: pass/ready; no installs, agents,
commits, pushes, grants, publication or credentials.
