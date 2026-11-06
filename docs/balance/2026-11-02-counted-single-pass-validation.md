# Counted quest validation — retained, 2026-11-02

Live counted reads previously validated the counted graph directly, then repeated
the same check through the complete quest-item ledger validator. The ledger now
owns that check. Every read still inspects all three input graphs for accessors,
reloads authored definitions and validates the complete ledger. No validation
cache, transaction, save format, engine or authored-data change.

The regression failed before the fix because one read checked the graph twice.
All 182 affected cases across six suites pass, including in-place graph and
definition corruption/repair, non-counted entitlement rejection and zero getter
execution. After test typing corrections, only the nine counter cases were
rerun; the other 173 passes are reused. Scoped strict types and changed-file
lint pass. Initial failed static-check logs remain diagnostic evidence.

Actual Chromium, native import of the unchanged earned level72/Hell1043 save
(8,540 backpack items), public/native full-save equality before/after inventory:

| Diagnostic median | Desktop/en before → after | 360×640 zh-CN, 4×CPU before → after |
| --- | ---: | ---: |
| Isolated live reader, nine calls | 8 → 7 ms | 37 → 28 ms |
| Warm inventory opening, five calls | 418 → 427 ms | 1,133 → 1,092 ms |
| One profiled first opening | 464 → 443 ms | 2,091 → 2,097 ms |

Retain the simpler single-pass validation. These measurements establish a helper
improvement, not a material whole-opening improvement. The approximately 2.1 s
mobile first opening and BUG592 remain open. No errors or horizontal overflow;
the native/public saves remain exact. Development localhost and emulated CPU
measurements do not establish release-device budgets or acceptance percentiles.

Authority55 independently rehashes all 2,141 source entries; exactly the counted
contract and its counter test differ from authority54. Authored data and the
canonical earned successor remain exact. No campaign or unrelated suite replay.

Evidence retained by root through full-v1 review under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/`:
`bug592-counted-single-pass-{baseline,candidate}-v1.{mjs,json,log}`, their initial
opening CPU profiles/screenshots, the RED/GREEN/type/lint logs and
`bug592-counted-single-pass-readback-v1.json`. The baseline's inherited limits
prose mentions page pairs; its actual driver and rows measure repeated openings.
Both drivers are terminal, cleanup reports are empty and both exact owned Vite
caches are absent. Required evidence and worktree remain with root for review
and eventual cleanup/release. Full v1 is unfinished; balance acceptance 0/210.
