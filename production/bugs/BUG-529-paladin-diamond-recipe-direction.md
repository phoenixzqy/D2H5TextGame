# BUG-529 — Use the input quality in Diamond fusion recipe IDs

Severity: Low. Status: diagnosed; task-local failed spec retained.
Owner: root (QA task driver). Production crafting behavior is correct.

## Reproduction

- Worktree: `D2H5TextGame-human-worktree-2`, branch `feat/playable-foundations`,
  HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, with existing dirty implementation.
- Native Node 24.21.0 / Vite SSR diagnostic; no browser viewport or locale.
- Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
1. Restore `p15-paladin-zeal-act1-complete-continuation-v1.json` (level12,
   XP42691, next134, nine flawed and zero normal Diamonds).
2. Run `p15-paladin-zeal-act2-rocky-forecast-v3.spec.json` with the checked v3
   area forecaster. The first two legal candidates finish and are retained.
3. The third candidate requests `recipes/gem-fusion/diamond/normal` three
   times, incorrectly treating the ID suffix as the output quality.

Expected: a feasible owned-material candidate or rejection before execution.
Actual: native crafting correctly rejects the first exchange with
`Insufficient crafting materials`; the aggregate forecast is not written.
The selected recipe consumes three **normal** Diamonds plus a shard and
produces one flawless Diamond (`src/data/items/material-recipes.json:238`).
To produce normal Diamonds, use the flawed-input recipe and budget shards.

Evidence: packet `p15-paladin-act2-rocky-forecast-run-v3.log` and matching
`-exit.json` (exit1, no owned descendants alive), original spec and
`p15-paladin-zeal-act2-rocky-forecast-v3.rows.jsonl`. No diagnostic preparation
or income reached the authoritative save. Both legal Diamond candidates
still lost Rocky W4; stronger fusion is not justified by these results.

Resolution: exclude the infeasible candidate from successor specs. Compare
the unlocked native Prayer hire before spending additional owned materials.
Retain the failed spec/results unchanged; no production patch or repeat of
the two completed candidates is required.
