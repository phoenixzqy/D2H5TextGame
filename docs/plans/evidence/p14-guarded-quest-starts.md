# P14 — Guard ordinary journal quest starts (BUG761)

Implemented locally, uncommitted; full private v1 remains unfinished.

The journal previously wrote quest progress directly during loading, missing-player,
combat, wave-transition and save-restore ownership. Ten real-component cases
reproduced the mutation in en/zh-CN. `startQuest.ts` now uses the existing
`questActionPreflight` and synchronous `withQuestTransaction` boundary. Canonical
quest lookup and live prerequisites prevent stale/repeated starts; regional
bounties retain their separate admission. Authored objectives initialize false.
Future-act tracking stays available; activation grants no rewards.

If publication throws, only the participating quest row is restored, preserving
unrelated writes. Reentrant activation refuses while restoration holds the lease.
Restoration failure remains explicit. The journal displays localized refusal and
failure feedback; it reports success only after successful publication.

## Verification

- 62 distinct selected cases pass: startQuest, QuestsScreen.start-guards,
  QuestsScreen and QuestsScreen.localization. Final22 new cases rerun after fixture
  cleanup and the strict-lint boolean correction: all pass with no warnings.
- Final strict scoped TypeScript:652 implementation/data files, zero diagnostics.
  Explicit changed-file lint and diff whitespace check pass.
- Chromium147.0.7727.15:12 constructed browser cases; all five refusal modes at
  360×640 in both locales, combat refusal at1280×800 in both locales. Each proves
  unchanged journal, exact localized reason and successful activation after release.
  Keyboard Enter,44px targets, status feedback and horizontal overflow checks pass.
  No page/console errors or warnings, failed or pending requests. Screenshots retained;
  mobile Chinese refusal inspected.
- Initial fixture errors (nonexistent combat property and wrong success-objective
  IDs) were corrected before GREEN; neither caused the original mutation failures.
  Original red output and first browser timeout retained. No full-suite, CI,
  campaign, sample, per-area retry or exhausted-budget renewal.

## Evidence and custody

Exact packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-quest-start-7rgsxyla`

Contains red/green/affected/final logs, browser harness/results/screenshots,
implementation diff, baselines, source hashes, self-review and cleanup receipt.
Root retains the packet through full-v1 acceptance and owns eventual removal.
All named handles terminal; task browser/server PIDs absent. Task-local Vite cache
and `/tmp/d2-quest-start-packet-path` removed and absence verified. No task disposable
or running process remains. No commit/push/release or worktree ownership change.

Historical14/14 intended Normal five-act completions,210 checkpoint sources and
formal balance0/210 are unchanged. This repair closes one quest-integrity gap;
it does not establish human pacing, earned balance, higher-difficulty/endgame
fairness, independent review or final integrated acceptance. Continue remaining
progression/challenge/acquisition/pacing implementation from retained evidence.
