# Full-workload timeout investigation — 2026-10-28

Current native full-unit prerequisite: **satisfied on unchanged inputs** after
independent terminal review. Timeout attribution: **inadequate**. BUG-180 and
BUG-366 remain Open; BUG-365 browser/earned/feature acceptance remains Open.

## Source and invocation

Source checkpoint `af71980f69561a472fdf033088ceb7f0209bb465`, documentation HEAD
`d2f04645f5c349b9d1d093a660eb2f1d749c9e6d`, branch `feat/playable-foundations`.
Root used only the existing claimed worktree:
`/home/felixzhao/.zai/profiles/anonymous/worktrees/D2H5TextGame-human-worktree-2`.
Before, after and independently rehashed live maps match all 2,045 executable
inputs at SHA256
`680a938e050fcbec4617ee865e0083ea17d0bf3a6a8dd1a7998953bc5baeacf3`.

One pre-reviewed, unfiltered default full Vitest invocation ran under Node
24.21.0 / installed Vitest 1.6.1. The absolute installed Node launched installed
`node_modules/vitest/vitest.mjs run` with these additional arguments only:

```text
--cpu-prof
--cpu-prof-dir=/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-full-timeout-attribution-tx4w01xr/run/cpu
--cpu-prof-interval=10000
--reporter=default
--reporter=json
--reporter=/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-full-timeout-attribution-tx4w01xr/reporter.mjs
--outputFile=/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-full-timeout-attribution-tx4w01xr/run/test.json
```

The exact argv and frozen driver/reporter/analyzer hashes are in the terminal
receipt. The coordinator-only reporter passively observes native results; it
does not import the product or change tasks. No selector, assertion, deadline,
discovery, worker, isolation, dependency, configuration or environment change
was made. Direct launch bypasses only the npm wrapper; no pretest/posttest hook
exists. The outer 60-minute / 8-GiB guards did not fire; no signal was sent.

## Native result and history

Native exit **0**, elapsed **1,619.476379 seconds**: **21,528 passed, zero failed,
two existing skips across 1,007 files**. Individual assertion statuses supply
the pass count; Vitest's aggregate 21,530 includes skips. Both skips are the
unchanged fresh-campaign continuation/economy cases. The complete closed log,
native JSON and terminal markers report no unhandled errors.

| Existing target | Native status | Reported duration |
| --- | --- | ---: |
| Player-first module entry | Passed | 2,713 ms |
| Inventory-first module entry | Passed | 2,024 ms |
| Material-source constructed control | Passed | 4,866 ms |
| Save-schema compile-laziness | Passed | 3,405 ms |

Reported task durations include hooks/cleanup and are not exact import phases,
timer-body windows or deadline measurements. The earlier unfiltered full run
remains native1: 21,525 passed, three 5,000-ms timeouts, two skips / 1,007 files,
2,280.441251 seconds. Its player-first/inventory-first/material durations were
5,049/5,003/5,008 ms. Its save assertion passed at reported 5,095 ms; earlier
focused and isolated save timeouts also remain retained. No failure is erased,
and the new instrumented nonreproduction establishes no cause, production fix,
speedup or durable absence of intermittent failure.

File inventory and skip identities match exactly. Raw assertion identities
differ in exactly two collection-time Date labels: the unchanged `new Date()`
rejection fixtures in `src/engine/services/quest-services.test.ts:58` and
`src/engine/save/act3-delivery-save.test.ts:60`. Independent review reconciled
only those exact file/template pairs, once each; all other identities match.
Raw old/new names and reports remain unchanged in terminal-reconciliation.json.

The earlier same-byte checks also remain valid: focused-feature 246 passed /
12 files, engine 10,959 passed / 409 files, typecheck, zero-warning lint/purity
and production build all native0. Historical focused-final instead reports
246 passed plus one save timeout / 13 files, native1; it is not the passing
focused-feature receipt. See [Prayer evidence](merc-prayer.md).

## Attribution and retention

The frozen analyzer returns **inadequate**: 59 of 1,009 raw profiles contain
62 negative time deltas, minimum -168 microseconds. All 1,009 profiles,
1,317,319,852 bytes, remain retained with independently verified sizes/hashes.
No delta was clamped, raw record edited, analyzer weakened or capture repeated.
Disposable profile count is zero; no profile deletion is approved or performed.

The 63 clock anchors give an observed 2,892.25-microsecond uncertainty range.
The native marker bindings and four target coverage groups were independently
checked; those observations cannot overcome global profile inadequacy. No
stack, phase, import, exact deadline or timeout-cause conclusion is accepted.
No source optimization is selected.

Root retains this exact packet through unresolved BUG-180/366, Prayer, next-card
and umbrella consumers, and owns eventual cleanup after those consumers finish:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-full-timeout-attribution-tx4w01xr`.
The prior packet and all historical failures also remain retained:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-prayer-9d0e935j`.
Coordinator PID 2456515 and driver PID 2456501 are absent. The postrun audit
finds no remaining process whose CWD is the task worktree; no intervention or
cleanup failure is reported. No disposable build output was created here.

## Independent decision and next action

Producer terminal review: **approve / security-pass / findings empty / readers
released**. Receipt `terminal-review.json` SHA256:
`aef63973046e2eced4252aad34a988a20f1b1707b98385d7b9e3da3977b0854d`.
Conditional policy assessment SHA256:
`eb7425cdf336396e5535b45a7ada9f0bc1e56ff3caade7d0bbe52ceeef122df0`.
Pre-execution review SHA256:
`bfb3861bffe61091d3f2537af65dfbe6a88c22041087abde2905234c54b102a7`.
Native report SHA256:
`877b254eb8e7ce4d1f392165107c06bb45f8b6a204948cabe082295f94e21fd9`.
Native result SHA256:
`db302d5858b44a33968d674119cfaba00f322f0c0dc51cfd06979e275780d93f`.
Inadequate assessment SHA256:
`7728d6bada688ccf936a359063275ad5f72b9a69cc32c29a798cd36e4e3b6bda`.

The reviewed complete native pass satisfies only the current-byte full-unit
execution prerequisite. No additional unprofiled full invocation is required
or recommended. This separate terminal decision grants no bug closure,
browser/earned/feature, actual CI or full-v1 acceptance. Historical timing
causes remain Open; recurrence stops source continuation for bounded diagnosis.

After the documentation checkpoint, refresh native Fire Mastery's +25% party
Fire plan against the current Prayer source and obtain its separate readiness
review before any reproduction/implementation. No Fire code or test has begun.
Campaign/economy/build matrices, high-rune affordability/source mix/pacing,
devices/locales/a11y, performance/PWA, actual CI and human/playtest/soak gates
remain unresolved. H3 remains terminal `H3_PREREQUISITE_FAILED_NO_APP`; protected
fixture/closed-policy and spent acquisition/lineage restrictions remain intact.
No app/browser, new experiment, publication/push/merge/deployment occurs.
The full goal and worktree remain active.
