# F08/P13/P15 — Mercenary XP growth correction

Date:2026-11-04. Owner:root. Worktree:human2/`feat/playable-foundations`.
HEAD:b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus preserved inherited edits.
BUG-709 is locally fixed; full privatev1 and earned pacing remain incomplete.

## Scope and result

[Written decision](../../design/merc-xp-policy.md) replaces the exponential late
mercenary cost with a2.5 power curve anchored at18. Costs1–18 stay exact;
31/82/99 costs are363648/4138203/6627735. Five production files change: store,
registered schema list, new JSON policy/schema/loader. No changes to XP sharing,
stat growth, recruitment, save data/version, combat or chapter targets.

Existing explicit thresholds are retained through add/read/non-leveling awards
and legacy manual upgrades, then consumed before using the next canonical cost.
Thus a real old save may still need its large current threshold once. There is
no automatic level repair or retrospective reward credit. Hypothetical
population arithmetic is labeled as such in the decision and external receipt;
it is insufficient for real pacing, affordability or build fairness acceptance.

## Focused verification

The before-source native-store run has four legitimate RED cases: late costs,
old-threshold crossing/spillover, manual-upgrade legacy preservation and missing
late progress. After the correction,43selected cases pass:27store progression
cases and16actual registered Ajv policy cases. Four unrelated dismiss/equipment
cases were excluded by the name filter. Existing monotonicity/safe-integer,
early hire, per-class stat, custom-progress and75% sharing checks remain green.
Strict scoped types and explicit lint on the five TS files pass. No accepted
tests were repeated afterward; no broad suite, build or campaign ran.

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-merc-xp-policy-n89no0k9`.
It retains `arithmetic-before.json`, original source snapshots under `before/`,
three exact incremental `.patch` files, red/green/types/lint logs and command/PID/
exit receipts, archived `scoped-tsconfig.json`, and `closure.json` with after
source hashes. Root retains it through unfinished umbrella review and owns its
eventual cleanup once evidence consumers finish.

All four recorded checker PIDs are absent. Exact active type config is removed;
its content is archived as required evidence. No task server, browser or isolated
cache was created; shared caches remain untouched. No disposable paths or cleanup
failures remain for this slice. Worktree/source changes remain for ongoing work.

## Unchanged completion boundary

No earned save or campaign admission changes.14/14ActI and8/14five-act Normal;
formal balance0/210. Summon Druid50/next724 remains at the Ancients draw. All
closed retries, diagnostics and preparation limits remain spent. Six builds,
acquisition/crafting/economy/pacing, higher difficulties/endgame, PWA/a11y/
performance and independent acceptance remain open. Browser works; CI excluded;
no pending user answer or external blocker. Human extended playtest follows
implementation. No new agents/install/commit/push/publication.
