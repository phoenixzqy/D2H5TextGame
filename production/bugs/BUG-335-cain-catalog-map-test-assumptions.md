# BUG-335 — Select map acts without relying on unrelated disclosure buttons

- **Severity:** Low (test harness)
- **Status:** Fixed locally; final combined full suite passed.
- **Build:** `40bb9c35408c24fd25ea5d8dde69df6f6f37b184` plus frozen Cain inputs.
- **Environment:** Vitest 1.6.1 / jsdom, en and zh-CN; no viewport, RNG or gameplay dependency.
- **Affected systems:** QA / map and NPC catalog tests.

## Reproduction

1. Run `npm test` with the authored Act I Cain dialogue and Dark Wood object entry.
2. Observe `quest-npc-talk.test.ts`, `MapScreen.test.tsx`, `MapScreen.cube.test.tsx` and `MapScreen.journal.test.tsx`.

## Expected

The catalog includes canonical Cain. Map tests identify act headings and open Act II while retaining their existing gameplay, localization and ownership assertions.

## Actual

Ten tests fail: the catalog expects the previous five Act I NPCs, localization tests count every `aria-expanded` button as an act, and Cube/journal tests click the first collapsed button, which is now Dark Wood Inspect rather than Act II. The production paths work in the eight-case Cain browser matrix.

## Evidence

`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-cain-1sjuc_zy/full-typed.log` and `full-typed-receipt.json`: 10 failures, 20,137 passes, two existing opt-in skips, 952 files. All 1,836 inputs rehashed unchanged after terminal handle 10289.

## Correction

Select act headings by their localized accessible names, preserving exactly five act headings and all original interaction assertions. Include Cain in the authored NPC catalog expectation. No production behavior or timeout changes.

## Local correction and current validation

Authored NPC expectation includes Cain; map act headings use localized accessible names. All prior gameplay assertions remain. Combined focused593/30 includes the four corrected files and passes.

Final full `npm test` original72370 terminated0 and was consumed:20,211 passed,
955 files, two existing opt-in skips. All1,841 frozen inputs rehash unchanged.
Final whole types/lint/build and browser8/8 pass; independent review approves.
Original failures and final receipts are retained in the verified Cain/Identify
archives linked in [Cain evidence](../../docs/plans/evidence/d11-cain-recovery-rescue.md)
and [Identify evidence](../../docs/plans/evidence/d11-cain-identify.md).
Both raw roots are absent after exact cleanup, remaining[]/failures[]. No remote
publication or private-v1 completion is claimed.
