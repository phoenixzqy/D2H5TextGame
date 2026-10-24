# P16 — Bounded, searchable mercenary equipment

2026-10-24; local source `6c6628e`, fixing BUG164. Root execution and
self-review; independent acceptance and full-v1 gates remain pending.

The hero's paged backpack did not bound the separate mercenary selector.
The genuine through379 save has3713 compatible head items among20371 total
owned gear. The old selector rendered every compatible row, displayed only
names and offered no exact-instance search. Four new integration regressions
fail against the old source in both locales:201 candidate actions instead
of100 and missing page navigation.

`MercEquipmentCandidates` reuses existing100-item inventory pages. It searches
localized names and visible persistent IDs, preserves acquisition order,
resets on search/slot changes and clamps after live removals. Native
`equipOnMerc` remains the only transfer authority; stale-source, requirement
and full-backpack refusals retain the existing feedback/retry path. No balance,
recruitment, ownership or save-format rule changes.

## Validation

- Focused mercenary23tests/6files PASS, including the four new regressions and
  existing exact transfer, refusal, retry and capacity controls.
- Final full-unit11678tests/454files PASS510.92s; two existing opt-in skips.
  Typecheck, final lint/engine-purity and ordinary production build PASS.
- Production Chromium10/10 PASS, en/zh-CN at360×640,412×915,915×412,
  1280×800 and1920×1080, zero retries, console errors or warnings.
- Each browser case imports an exact diagnostic copy of the genuine save,
  reaches the last page, searches an exact ID using keyboard actions, transfers
  that owned instance, preserves every full item payload, and proves exact
  Save-close-Continue. All essential checked controls are44px high or more;
  document/dialog horizontal overflow is absent. These copies never become
  genuine campaign resume saves.
- All1128 frozen source/test/config hashes match. All760 production build
  files match between the original and lint-corrected source forms. All7
  emitted JS files are bridge-free and served exactly.

Headless open observations range257.49–397.93ms for this selector. These are
scripted observations, not controlled device benchmarks or general0.5s feedback
certification. Existing test-time, bundle and PWA budgets remain unresolved.

Original failures remain: the first new localized-name test used an incorrect
double namespace; correcting its key preserves the actual translated-name
assertion. Lint rejects an empty no-op callback, corrected to explicit undefined.
The task's exact pre-correction Vitest PID is gracefully interrupted, its exit130
and output retained, then the full final suite is run from the final frozen
source. No assertions, skips, timeouts or budgets are weakened.

The [verified archive](fixtures/merc-equipment-browsing380/manifest.json) retains
scripts, original/final logs, source/build hashes, diagnostic exports and
screenshots. [Audit summary](fixtures/merc-equipment-browsing380/summary.json)
records exact source/build/browser checks. Root retains raw evidence at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-static-field-27sv3iop/merc-picker380`
through campaign/full-v1 consumers and then removes exact owned paths. The
preview was shared by the separately recorded genuine River continuation.
All consumers are now terminal, preview4441 is closed, and the exact disposable
build/cache paths are absent; [cleanup](fixtures/merc-equipment-browsing380/cleanup.json)
has no remaining paths or failures. No push, PR, merge or deployment occurs.
C0/C1 keep historical acceptance; C2–C4 and fullG0–G7 remain incomplete.
