# D06 v1b — Paid preparation summons

Status: accepted bounded implementation for the thirteen external-input-free
skills in [D06 v1b](../decisions/D06-summon-preparation-v1.md). Independent GD/TD,
QA and producer reviews cover the integrated source and bilingual production
browser path. Full D06/P09, corpse-dependent skills, selected-item Iron Golem,
earned progression, balance and private-v1/C0–C4/G0–G7 remain open.

Root alone writes and runs gates in the claimed umbrella worktree. The original
checkout remains clean/read-only; no push, PR, merge or deployment occurred.
Each increment changed at most five repository paths and was committed separately.

## Delivered behavior and commits

| Commit | Bounded change |
| --- | --- |
| `5dbe443` | Reconcile preparation policy, authored caps and controlling specification |
| `52d8cf8` | Canonical thirteen-skill policy and authoritative production eligibility/rank |
| `51a82f9` | Atomic paid missing-cap startup batches; no ordinary replacement/death refund for valid opted-in owner/template pairs |
| `3538184` | Real store allocation, recording identity, wave resources and explicit replay tests |
| `b8fa9e9` | Truthful bilingual Skills detail, current/next caps and costs, native allocation controls |
| `0e7a8ed` | Eight missing supported summon names per combat locale; existing translations and unknown fallbacks preserved |
| `bff2a70` | Production browser regression tests and preview-only configuration |

Preparation stages a complete valid batch before debit, scheduler, identity or RNG
changes. It pays the existing rank-adjusted cost once per skill/wave, preserves
living preloads and counts owner/exact-template units. Already-full/invalid/poor
inputs do not cast or pay; failed preparation is not retried. Scoped ordinary
selection excludes these skills, and battle-local valid owner/template authority
suppresses only their matching death refunds. Excluded/synthetic behavior stays
covered by controls. Fresh waves rebuild summons from carried hero/merc mana,
with existing mastery, position, identity, resource and replay rules preserved.
No save version or dependency change was needed.

## Test-first provenance and corrections

- A original frozen V3 eligibility test ran against unchanged production:
  66 failures plus 14 passing controls; identical behavior then 80 passing.
  Pre-execution immutable-fixture/fractional-level corrections were not failures.
  Actual lint failure led to reviewed equivalent deletion correction in V4;
  the later test bytes are not labeled the original RED.
- B frozen V5 runtime RED: 69 failures plus 74 controls. First implementation:
  142 passes and one position failure. Existing default-grid reservation puts the
  hero at 0:1, so the missing summon correctly uses 0:2 and then 1:0 fallback.
  Reviewed correction changes only those two position expectations, retaining
  counts, IDs, payment and preload state. Later lint-only normalizations remain
  separate; original reports/drafts/diagnostic are preserved. Final 143 pass.
  The filtered diagnostic reports one failure and 142 skipped assertions; its
  misleading top-level JSON passing counter is not treated as passing controls.
- B2 four integration tests were added after runtime implementation; no runtime
  RED is claimed. Original lint/full-unit commands overlapped by 0.201356 s.
  The full run was stopped through validated exact owned PID identities; no
  report or pass is claimed for that aborted run. Both checks were rerun serially.
- C original V1 UI RED: 54 failures plus 14 controls; V1 GREEN 68/68. Actual
  TS2345 and subsequent lint failures were corrected by reviewed type-only then
  lint-only test changes. V3 passes; it did not run the original RED.
- BUG-071 exact unchanged-locale RED: 16 failures plus 24 controls. The identical
  literal 18-template × 2-locale test then passes 40/40 after eight translations
  per locale. Explicit/legacy identity, card adapter, exact logs and four fallback
  controls pass. Existing Blood Golem wording remains 鲜血石魔.

## Validation

Final passing gates are attributed to the bytes that ran them; this table does
not imply every historical attempt passed or ran serially.

| Slice | Focused | Engine | Full unit | Types / lint | Production build |
| --- | --- | --- | --- | --- | --- |
| A | 80 | 2839 | 5550 / 203 files | pass / pass | clean bridge/build pass |
| B | 143 | 2982 | 5693 / 204 files | pass / pass | clean bridge/build pass |
| B2 | 4 | unchanged B runtime | 5697 / 205 files | pass / serial rerun pass | unchanged B build |
| C | 68 | unchanged B runtime | 5765 / 206 files | pass / pass | clean bridge/build pass |
| Names | 40 | unchanged B runtime | 5805 / 207 files, 98.268 s | 12.845 / 34.919 s | 9.550 s, four JS chunks, no bridge symbols |
| Browser original V3 | 2 locales | unchanged B runtime | reuses Names gate for unchanged unit/app bytes | 13.588 / 34.630 s | reuses exact Names build |

B engine coverage: lines/statements 94.63%, functions 93.85%, branches 91.29%.
Changed combat.ts: lines 97.76%, functions 100%, branches 91.22%; preparation
policy helper 100%. Existing coverage thresholds were unchanged. Final handoff
units have no failed/pending assertions. Normal engine 3 s/full-unit 15 s targets
were missed; passing reviewed bounded correctness runs is not performance acceptance.
Existing Browserslist/chunk-size/art-manifest precache warnings remain recorded.

## Actual browser failures and environment recovery

Original V2 passed English but failed Chinese: two exact summon messages used
`Raven`. V3 diagnostic preserved the same DOM failure without weakening the oracle.
After the translation fix, V4 passed Chinese startup but failed the original CJK
font assertion; V5 Chinese-only diagnostic confirmed visible tofu/DejaVu fonts.
Later Chinese layout/save assertions were not reached in those failed attempts.

Minimal no-app diagnostics identified bundled Chromium fontconfig 2.17.1 versus
system cache writer 2.18.3. The stale user-font cache predates installed Noto and
regeneration is refused; the decisive trace is `browser-font-environment-v4.log`.
A task-only 408-byte fontconfig XML (SHA256
`bd41c0bbed57225077dd7cd67e94e65f75da87f4afc8a0aaf01a621d2fc88dea`)
uses existing font roots/rules and an isolated eight-file cache. No source/CSS,
installed font, shared font cache or original assertion changed. Default/first
cache-sharing diagnostic failures and the successful minimal recovery are retained.

Final V6 restores exact original reviewed V3 spec, SHA256
`093a58b5c182b6e6c8a9878c9b86c36621fb3ecbc9df3c8d32f30bed340a7b87`,
and original config SHA256
`3c52611fd25ea4e4654cdb86d1e9e699b50493b99aa324d944bb0825d8e7189a`.
Only task `FONTCONFIG_FILE` is overridden; DEBUG/FC_DEBUG are absent. Existing
original-V3 types/lint and unchanged Names unit/build gates remain applicable by
24 frozen fingerprints and all 760 production output hashes.

## Bounded production browser acceptance

`node_modules/.bin/playwright test -c tests/pwa/summon-preparation.config.ts`
passes both locales, one worker, retries 0: 24.377 s runner / 23.435 s report,
no skipped/flaky/unexpected tests, report errors, stops or signals.

- Create native Druid, then explicitly import L6/two points/Cap/resources scaffold.
  Native keyboard Raven allocation 0→1→2 changes only rank/points in the complete
  exported player and preserves the paused combat DOM/resources/combo. Combo
  selection is a separate native edit; no game bridge, engine injection or seed
  search is used. Date alone is fixed; simulation timers remain native.
- Six bounded ordinary-DOM frames show 300→294/1000 MP, two distinct Raven IDs at
  100% relative life, one cast and two summon logs. Chinese contains exact 乌鸦
  messages. Numeric per-instance life/full hidden recording immutability are
  unit/store evidence, not conclusions from relative life bars.
- Explicit Save→Saved→close→newPage→Continue preserves the entire SaveCurrent
  export in each locale. Rank2/combo and truthful description remain present.
  Both browser console warning/error arrays are empty.
- Nine CSS sizes per locale: 360×640, 412×915, 640×360, 375×667, 393×851,
  768×1024, 1280×800, 1920×1080 and 915×412. Reviewed node/action controls
  are at least 44 px (node80×80, action≥120×48), description14 px, all nine-point
  control/heading hits clear and no horizontal overflow. Actual Chinese font:
  Noto Sans CJK SC123glyphs plus DejaVu6. Independent QA personally viewed all
  four original final 360×640/1280×800 PNGs; root viewed both mobile originals.
  Existing decorative navigation glyph boxes are outside this slice.

Imported scaffolding is not earned campaign/balance evidence. Finite Chromium
layout checks are not native-touch/all-browser/full-accessibility acceptance;
no offline, performance, fullD06/P09 or external-input acceptance follows.

## Regression mapping and retained evidence

| Test | Contract |
| --- | --- |
| `src/stores/combatHelpers.summon-eligibility.test.ts` | Production learned/unlocked/prerequisite/slotted canonical rank and exclusions |
| `src/engine/combat/summon-preparation.test.ts` | Literal ranks/caps/payment, atomic refusal, preloads, aliases, terminal guards, death/ordinary fallback, replay and synthetic controls |
| `src/stores/summon-preparation-native.test.ts` | Native allocation/current-recording identity, next-wave resources and explicit replay |
| `src/features/skills/SkillsScreen.summon-preparation.test.tsx` | Bilingual current/next/cost/prose and native paused allocation stability |
| `src/stores/summonDisplayName.test.ts` | All18 supported combat names, identity priority, card/log consumers and fallback |
| `tests/pwa/summon-preparation.spec.ts` | Bilingual native allocation, paid startup, explicit disk-save reload and finite layouts |

RAW is root-owned at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-summon-preparation-cijxqtry`.
Original failing/passing reports, unexecuted drafts, review transcriptions,
coverage, font diagnostics, source/build freezes, process observations and cleanup
receipts remain available. `a-final-gate-summary.json`, `b-final-gate-summary.json`,
`b2-final-gate-summary.json`, `c-final-gate-summary.json`,
`names-final-gate-summary.json` and `browser-final-summary-v6.json` index the proof.
All21 decoded final attachments byte-match their original report bodies.

After browser commit and all reader releases, root rechecked source/output hashes
and all 6,429 observed PID/startTicks identities absent including zombies. Exact
760 regular build files / 40,968,144 bytes and ten empty dist directories were
removed with zero failures; `browser-commit-cleanup-receipt.json` records verified
absence. The prior task Vitest result file is already absent by its reviewed
receipt. Shared cache parents, installed fonts/tools/dependencies and RAW remain.

A separately reviewed durable lossless archive/packet will bind exact RAW members
before root removes them. Preserve installed tools/dependencies/fonts, shared cache
parents, source/history and empty RAW root. Umbrella worktree claim continues;
no remote publication is authorized. Next external-input design/runtime work
must receive its own reviewed contract; this closure does not accept those skills.

## Durable evidence packet

Closure `3ae3191` and browser `bff2a70` are preserved by the
[packet](fixtures/d06-summon-preparation/packet.json) and lossless
[archive](fixtures/d06-summon-preparation/raw.tar.gz). Root verified all 531 safe
regular members / 22,257,641 original bytes byte-for-byte against live RAW.
Archive: 2,922,593 bytes, SHA256
`3eb3e6845acd498c62c418f3ccbf040d1a34374e9f7552453378eaa1fdac8609`.
The packet binds 28 current source/document fingerprints, 64 original command
records and all 6,429 observed task births absent including zombies. Historical
B2 overlap/abort signals remain explicit; this is not an all-serial-history claim.
Actual failures, drafts, corrections, all browser report bodies and four final
screenshots, coverage, font/cache diagnostics, reviews and cleanup receipts remain
recoverable. The skill specification's stale runtime-pending clauses are now
reconciled without a policy/runtime change.

Independent durable review and committed archive must precede removal of the
exact 531 manifest files and 19 empty child directories. Root retains the empty
RAW root, shared parents/fonts/tools/dependencies, source and history. The packet
will record the actual cleanup receipt; removal is not claimed at preparation.
Umbrella claim continues; full D06/P09/private-v1 remains open.


## Committed archive and verified RAW cleanup

Producer approved the final 263,099-byte packet
(`c1ec0c47afe2d2b2b264863dc07fc638cdd4ad076998cfb7b195ffa9f72b2dda`)
and exact five-path archive increment. Commit `a167a1d` preserves the packet and
lossless archive; all readers released before cleanup. The guarded script then
revalidated the committed archive, all 531 live members, 28 source/document
fingerprints, 6,429 absent process births including zombies, 771 absent outputs
and the clean original checkout before removing exactly 531 files / 22,257,641
bytes and 19 empty child directories. Zero failures and zero remaining files.

The packet's `rawCleanup` records the actual receipt at
2026-10-21T14:40:40.008404+00:00. The empty RAW root is retained; shared parents,
fonts, installed tools/dependencies, source and Git history are preserved.
The archive remains the durable source of original reports and attachments.
Cleanup changed no runtime or tests; bounded acceptance and outstanding full-v1
gates remain as stated above. Umbrella work continues into the corpse contract.
