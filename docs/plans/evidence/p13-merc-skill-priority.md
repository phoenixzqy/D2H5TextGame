# P13 — Mercenary skill priority; progression still draws

2026-10-22, local branch `feat/playable-foundations`, parent `8f73217`.
[D04](../decisions/D04-merc-skill-priority-v1.md) and
[BUG-084](../../../production/bugs/BUG-084-merc-secondary-priority.md).
[Machine-readable summary](fixtures/p13-merc-priority.summary.json) binds exact
source, executed scripts, raw reports and validation logs by SHA-256.

## Delivered behavior

An ordinary owned-mercenary action and Mercs controls reorder existing
secondary skills. Signature stays first; exact membership, copied input,
wave/restore/debit ownership and active-run/combat guards prevent unsafe
changes. Existing saved `comboOrder` retains the choice. Defaults, skill
definitions, targeting, damage, cadence and equipment are unchanged.

The UI has localized names, distinct readable legacy-name fallbacks, native
keyboard buttons and 44px targets. Producer source review APPROVE/security
PASS; independent QA found the original generic fallback ambiguity, now fixed
with a focused regression.

## Validation

- Initial RED: 16 behavioral failures for missing action/controls, before
  runtime changes. Mandatory fixture status source ID was corrected afterward;
  the RED reached the missing setter first. Fallback RED: one failure, three
  controls. Final focused: 17 tests/two files pass.
- Final full unit suite: 8,417 tests/266 files, exit 0, 197.36s. Typecheck,
  repository lint and explicit `eslint --no-ignore` for the native spec pass.
  Initial lint object-truthiness and native-test tuple typing/attachment-label
  errors were corrected without suppression; original logs remain.
- Production build passes with `VITE_E2E` unset. Repository bridge patterns
  scanned all four emitted JS chunks: no violations. Task-isolated build output.
- Two production-browser tests pass in 44.5s, retries 0: fresh Sorceress,
  ordinary free hire, keyboard Enter priority change, then Save → close page →
  new-page Continue with full export equality. English and zh-CN each check
  360×640, 412×915, 640×360, 1280×800 and 1920×1080, 44px buttons and no horizontal
  overflow. `window.__GAME__` absent; no hidden store writes. Browser errors [].
  Screenshots were visually inspected at 360×640. Desktop Chrome with viewport
  changes establishes neither touch-device nor browser-process-restart proof.
  Exact executed spec is frozen in raw evidence; final source adds only tuple
  `as const` and equivalent `String()` calls for numeric attachment labels.

## Exact retained W3 comparison

[Executed diagnostic bytes](fixtures/p13-merc-priority.diagnostic.mjs).
The prior report SHA `f9e9464f1f2a35fa1602521d958a8910121c678ffd72a87cde497b8027803975`
supplies the original opening. Wave seed is derived using the actual production
formula; baseline events and both final teams match exactly. Candidate changes
only the Rogue's order to Inner Sight → Pierce Arrow → Basic Arrow. No store
settlement or reward is performed.

| Measurement | Baseline | Candidate |
| --- | --- | --- |
| Result / terminal time | Draw / 60,000ms | Draw / 60,000ms |
| Living enemies | Zombie 38 HP | Stalker 94 HP, Zombie 67 HP |
| Inner Sight / Basic / Pierce casts | 10 / 29 / 0 | 10 / 10 / 19 |
| Rogue damage, including overkill | 166 | 421 |

The first diagnostic invocation matched baseline events, then stopped before
candidate execution because its assertion used the store's final-team field
name on `CombatResult`. Its script/report/log remain as `attempt1`; corrected
field access yields the one completed candidate. A nonfatal Vite websocket-port
warning in attempt1 was avoided by disabling its unused websocket afterward.
Independent QA ADEQUATE verifies exact baseline, candidate-only order change,
both summaries and the failed invocation's limits.

## One earned route attempt

[Executed route bytes](fixtures/p13-merc-priority.route.mjs), independently
reviewed QA ADEQUATE before execution. Restore the original unique L12 fixture
SHA `8c46c4f4026116360356a2d17dcde3d723310969a25664f85bc291a1886d2afc`,
clock 1792497600000, seed 2223645302, bonus 1. Select paid Frost Nova 2 / Ice
Blast 8 and the mercenary order through ordinary store actions. No farming,
allocation, gear change, respec, refill, direct XP or idle ticker.

| Area / ordinal | Attempted waves | Terminal times | Result |
| --- | --- | --- | --- |
| Blood Moor / 102 | 3 | 6,000 / 12,000 / 27,432ms | Victory |
| Cold Plains / 103 | 3 | 9,144 / 9,144 / 60,000ms | Draw; production returns defeat |

Stop at this first nonwin. Burial Grounds, Dark Wood and Catacombs are not
launched. W3 survivors are Stalker 94 HP and Zombie 67 HP. Drawn wave earns zero
hero/merc XP, currencies or items. Initial full-save equality and source-hash
invariance pass. The 52 actual additions reconcile with raw awards; unique owned
item objects increase 3,737 → 3,789. No duplicate-ID corruption occurs.

This fixes missing player control, but does not establish that the chosen
priority is stronger for the encounter or resolve progression. No Act I clear,
Andariel attempt, pacing result or C0–C4/G0–G7 acceptance follows.

## Retention and cleanup

Raw scripts, full events/results, saves, screenshots, reports, validation logs
and receipts remain at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-priority-fl7odaqn`.
Root owns this evidence through progression/C1/umbrella consumers and removes it
when they finish. Independent final QA publication ADEQUATE; all readers
released. Known script/server/worker PIDs are absent and preview port60319 is
closed. Exact disposable build/cache/tmp/extracted-preview/test-state cleanup
passes with remaining[]/failures[]; see `cleanup.receipt.json` at that root.
Shared tool caches are preserved. Original checkout unchanged; local commit only.
