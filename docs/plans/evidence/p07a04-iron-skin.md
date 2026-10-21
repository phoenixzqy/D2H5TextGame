# P07a04 Iron Skin — incremental evidence

Status: authored prerequisite delivered in `b73e858`; runtime adapter delivered
in `e234dad`; native fixture acceptance in `a4548e2`; bilingual details in `edaa2b2`. Production-browser acceptance remains open. Broader P07a/private-v1,
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


## Combat adapter / Stage B

`e234dad` applies eligible Barbarian allocation once to fresh equipment-derived
combat defense. It preserves the existing derivation floor and subsequent
fractional defense, with no authoritative/save mutation. Existing Frozen Armor,
Melt, Inner Sight, damage-type routing, periodic potency and passive execution
controls remain intact. Native wave/replay/save acceptance is still separate.

The original adapter RED had 26 cases:16 failed/10 passed. Its28 failed assertion
messages include 27 intended missing-defense mismatches and one incorrect
magicResist 31 expectation (actual 11). Fifteen failed cases are solely behavioral;
one is mixed. The hard magic-resistance error prevented later full-unit,
resources/carry and nonmutation assertions in that case from executing.
Two consumer runs each had 14 cases: 3 failed/11 passed. Those failures were
incorrect existing-behavior expectations: omitted Armor Melt physical ×1.25 and
two monster-death orb rolls. [BUG-064](../../../production/bugs/BUG-064-iron-skin-control-oracles.md)
was filed before correction; these consumer failures establish no product defect.

GD/TD, QA and producer re-reviewed exact corrected drafts. With production still
unchanged, the corrected baseline has 41 cases: adapter 26 = 16 failed/10 passed,
all 27 failed assertion messages solely missing defense; consumer 15 all pass.
The previously blocked preservation tail now executes. Original drafts, reports,
classification and corrective addendum remain preserved, without retroactive
claims of a clean original RED.

After integration, focused, engine and full tests passed. Type checking then
failed two TS2379 errors: optional Player.skillLevels casts admitted undefined
in present fixture fields. The subsequent serial lint passed before correction;
no source was edited during any command. BUG-064 records the failure before the
reviewed annotation-only NonNullable correction. Product source was unchanged.

| Final gate | Result | Duration |
|---|---|---|
| Focused Iron Skin + existing Lightning/Frozen Armor controls | 374 cases, 6 files | 3.612 s Vitest / 4.738 s wrapper |
| Engine | 2,303 cases, 77 files | 10.195 s / 11.413 s |
| Full unit | 4,723 cases, 189 files | 76.763 s / 78.088 s |
| Type checking | pass | 12.046 s |
| Lint + engine purity | pass | 31.492 s |
| Fresh production build + bridge exclusion | pass | 9.155 s |

All 15 commands, including preserved failures, ran serially with no wrapper stops
or signals. Final tests have no pending/todo cases. Existing engine 3 s / full 15 s
speed targets remain missed; existing Browserslist/chunk-size/manifest-precache
warnings remain. No coverage, performance, balance, campaign, native, UI or browser
certification is implied by this runtime increment.

GD/TD approve exact installed source. QA and producer independently verify all
four source fingerprints, drafts, failures/corrections, reports/logs/metadata,
serial order, all 2,187 PID/birth identities absent and output ownership. Review
records are root transcriptions. After commit and all reader release, root
freshly verifies source, process absence and every output hash, then removes
exactly 761 files (760 build outputs and one regenerated Vitest result), 40,964,763 bytes.
Absence is verified with no cleanup failures; preexisting cache parents/shared
caches/font/source/history remain. The original checkout is untouched and the
umbrella worktree claim continues; no remote action was performed.

RAW remains root-owned at the path above while Iron Skin continues. Key Stage B
records: stage-b-drafts-freeze-v6.json, stage-b-adapter-red-classification-correction.json,
stage-b-corrected-baseline-classification.json, stage-b-type-correction-freeze.json,
stage-b-source-freeze-v2.json, stage-b-final-gates.json, stage-b-output-inventory.json
and stage-b-output-cleanup.json. Root owns eventual durable packet verification
and exact disposable cleanup after downstream readers finish. Unexecuted native
draft corrections are retained separately; no native result is claimed yet.


## Native boundaries / Stage C

Test-only `a4548e2` adds six native cases using real stores, allocation, equipment,
seed7 waves, explicit replay and serialization/validated import. They verify
next-wave rank1/rank2 defense104000/108000 from base100000; level17/other-class
suppression; paid18000-gold respec without refill; rank20 naked defense127.8;
original resource pools/all three carry baselines and no repeated multiplication,
recording/reward drift; allocation-only persistence without combat overlays.

Imported level18/points/extreme gear and a registered finisher are explicit
scaffolding. The disk adapter is the sole mocked module; Date.now is fixed for
fixture time. This establishes native
boundaries, not earned progression, browser disk/reload, campaign or balance.
All six cases passed their first execution; there is no manufactured native RED
and no runtime edit. Preserved unexecuted draft corrections fix regen4→2, the
fresh redundant stats.life/mana mirrors after a gear clamp, and clearing ranks
before naked-defense71. The expected gear-replay record changes only those two
mirror fields; the complete actual recording stays unnormalized and compared.
Rank-only replay first restores the complete original recording.

| Final gate | Result | Duration |
|---|---|---|
| Type checking | pass | 11.855 s |
| Native/adapter + Lightning native/Frozen Armor controls | 57 cases, 4 files | 3.732 s Vitest / 4.889 s wrapper |
| Full unit | 4,729 cases, 190 files | 76.694 s / 78.137 s |
| Lint + engine purity | pass | 32.136 s |
| Fresh production build + bridge exclusion | pass | 9.097 s |

All five commands ran serially, exit0, no stops/signals/skips/todos. The full15s
target remains missed; existing build warnings remain. No new engine source
changed. GD/TD approve exact installed v4 SHA256
`68faf4daf76248e1a49dd2f3f118565e4a7c888110db71d7c2db0f8b32e4a0d1`.
QA and producer independently verify the source/drafts/corrections, reports,
logs, serial metadata,896 absent PID/birth identities and761 exact outputs.
Review records are root transcriptions. After commit and all reader release,
root rechecks source, processes and output hashes, removes exactly40,964,848B
(760 build files+one regenerated Vitest result), and verifies absence without
cleanup failures. RAW/source/history/Noto/shared caches/preexisting parents remain.
The original checkout is untouched; umbrella worktree claim continues; no remote
action. RAW remains at the path above pending root's independently verified
durable packet and exact cleanup. Key records: stage-c-draft-freeze-v3.json,
stage-c-installed-source-freeze.json, stage-c-final-gates.json,
stage-c-process-union.json, stage-c-output-inventory.json and
stage-c-output-cleanup.json. UI/spec/locales and production-browser acceptance
are next; full private-v1/C0–C4/G0–G7 remain incomplete.


## Bilingual skill details / Stage D

`edaa2b2` normalizes the two exact allocated aliases once using the same
immutable rank resolver, interpolates the JSON-derived definition in both
locales, and corrects only the Iron Skin spec row. The existing name 钢铁之肤
remains. No combat-runtime or data tuning changes, or generalized passive composition, are included.

[BUG-065](../../../production/bugs/BUG-065-iron-skin-details.md) was recorded
before patching. Actual unchanged-production UI RED20=12 failed/8 passed: each
locale fails authored prose, legacy fallback, alias-order rank19→1, uncapped
rank99/20 label, fractional allocation and near-miss normalization. Reverse
order, NaN+valid alias, real learning at18 and recording/resource controls already
pass; numeric4/8 and level18 were existing controls. Hard failures prevented
later assertions in their cases; the full original JSON and classification stay
preserved. Four production hashes were verified unchanged around RED execution.

| Final gate | Result | Duration |
|---|---|---|
| Focused Iron Skin/Lightning/Might/main Skills | 100 cases, 4 files | 5.803 s Vitest / 7.043 s wrapper |
| Type checking | pass | 11.852 s |
| Full unit | 4,749 cases, 191 files | 78.921 s / 80.294 s |
| Lint + engine purity | pass | 30.554 s |
| Fresh production build + bridge exclusion | pass | 9.107 s |

All six commands including intended RED run serially with no stops/signals or
pending/todo cases. Five final gates pass; full15s timing target and known build
warnings remain. Locale validation confirms the same bonus/maxBonus/cap/level
placeholders and complete exact bilingual expected prose. UI fixtures import
level18 and do not establish earned progression. GD/TD exact source and QA/
producer whole evidence approve; root-transcribed reviews remain in RAW.

Root retains the exact761 outputs40,965,478B for the immediate Stage E production
browser consumer: claimed-worktree `dist/` (760 files) and
`node_modules/.vite/vitest/results.json` (one file), enumerated with hashes in
stage-d-ui-output-inventory.json. Owner root; reason fresh bridge-free preview;
remove after browser and all reviewer readers finish, with fresh source, process
and output hash checks. They are not yet removed. All910 StageD PID/birth
identities are absent. Browser acceptance, broader mobile/a11y/performance,
campaign/balance/coverage and full private-v1 remain open. Source/history/font/
shared caches and original checkout are preserved; umbrella claim continues,
no remote action. RAW remains at the exact Iron path above until its independently
verified durable packet and exact cleanup. Key records: stage-d-ui-draft-freeze-v1,
baseline-freeze, red-classification, source-freeze, locale-validation, final-gates,
process-union and output-inventory JSON files.

Four completed historical StageA/B/C full-unit reports are preserved losslessly
as .json.gz after prior reader release:6,297,541B→470,018B. Root verified exact
roundtrips before unlinking original task-owned JSON copies;
`historical-report-compression.json` binds original/decompressed and compressed
lengths/hashes. The current StageD report remains unchanged. Required failures,
source/oracles and diagnostics remain preserved.
