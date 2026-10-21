# P07a04 Iron Skin — incremental evidence

Status: authored prerequisite delivered in `b73e858`. Runtime, native, bilingual
UI and production-browser acceptance remain open. Broader P07a/private-v1,
C0–C4 and G0–G7 remain incomplete.

[D05](../decisions/D05-iron-skin-v1.md) controls the authored contract: Barbarian
level 18, +4% ordinary defense per allocated rank, cap 20/+80%. The exact schema,
independent immutable definition and two-alias allocation resolver preserve the
existing JSON tuning. This prerequisite grants no combat effect by itself.

## Authored prerequisite

GD/TD, QA and producer approved the exact frozen schema, helper, decision and
oracles before execution. The schema-only test is the exact prefix of the full
test without the missing-helper import. The original unexecuted draft is retained;
v2 corrected similar-but-wrong alias negatives and added frozen-input coverage.

Actual unchanged-schema RED: 71 assertions, 32 behavioral failures and 39 passing
controls. Those failures expose missing exact-player restrictions; existing base
schema rejections are controls. The production schema SHA remained
`63cdb36991258b67ff4c3d5b8858042f66a3fe8bdf204c58c9fb6cc5fded5658`.
The reviewed narrow schema change makes the same 71 assertions GREEN.
The subsequent missing-helper run collects zero assertions and reports failed
import `./iron-skin`; it is capability evidence, not behavioral rank RED.

| Final gate | Result | Duration |
|---|---|---|
| Focused Iron Skin + Lightning | 308 assertions, 2 files | 2.073 s wrapper |
| Engine | 2,288 assertions, 76 files | 9.963 s Vitest / 11.226 s wrapper |
| Full unit | 4,682 assertions, 187 files | 77.899 s Vitest / 79.361 s wrapper |
| Type checking | pass | 12.318 s |
| Lint + engine purity | pass | 30.878 s |
| Fresh production build + bridge exclusion | pass | 9.236 s |

All commands ran serially with no wrapper stop or signals, no skipped/pending/todo
assertions. Intentional schema RED and collection failure exit 1; final gates exit
0. Existing engine 3 s/full 15 s timing targets remain missed. Existing Browserslist,
chunk-size and oversized-manifest precache warnings remain. No coverage,
performance, campaign, balance, native or player-facing certification is claimed.

GD/TD reviewed the exact installed four files; QA and producer independently
verified all source/draft hashes, reports, logs, serial metadata, process records,
RED classification and output ownership. Reviews are root-transcribed records,
not verbatim transcripts. All reviewers released their readers before cleanup.

Root rechecked the committed source, all 1,183 PID/birth identities absent and all
761 exact output hashes, then removed 40,963,684 bytes (760 build files and the
regenerated Vitest results file). Absence is verified; cleanup had no failures or
signals. Preexisting cache parents, installed Noto, shared caches, source and
history remain. The original checkout is untouched; the umbrella worktree claim
continues. No remote action was performed.

Root retains the raw drafts, original schema, failures, reports, fingerprints,
reviews and cleanup evidence at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-iron-skin-c7fexii5`
while Iron Skin continues. Key records: `stage-a-drafts-freeze-v3.json`,
`schema-red-classification.json`, `stage-a-delivered-source-freeze.json`,
`stage-a-final-gates.json`, `stage-a-output-inventory.json` and
`stage-a-output-cleanup.json`. Root will preserve a verified durable packet and
remove exact disposable RAW files after downstream readers finish.
