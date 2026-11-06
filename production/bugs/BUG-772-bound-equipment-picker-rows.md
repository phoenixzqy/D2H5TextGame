# BUG-772 — Bound equipment picker rows without hiding owned candidates

Status: Fixed and verified locally; uncommitted. Severity: Medium; all items remain
usable, but gear selection exceeds the feedback target with a large backpack.
Date: 2026-11-05. Owner: root, solo frontend/performance/QA.
Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus inherited human2 changes.
Environment: Chromium147.0.7727.15, WSL, development native-component fixture;
en at360×640 and1280×800. No RNG, campaign admission, or earned save mutation.
Plan: F05/F15/F21 and P16; understandable, accessible equip decisions and
bounded large-inventory work. This is separate from historical BUG147's
whole-inventory navigation measurement.

## Reproduction

1. Mount the real EquipPicker with a constructed level-one Barbarian and2,001
   distinct legal normal Short Sword instances in the backpack. This intentionally
   models a retained over-cap bag; it is not an acquisition or earned fixture.
2. Open the weapon picker through the fixture's Open control.
3. Count option rows and measure opening through two animation frames after
   native auto-selection. Close/reopen three times at each stated viewport.

Expected: bounded visible row work, access to every owned candidate, unchanged
eligibility/comparison/equip/ownership, and working cross-page keyboard focus.
Actual: all2,001rows render on every opening. Readiness is684.9–952ms;
individual React commits take142.8–380.6ms. No page errors/warnings/request
failures occur. Backpack pagination does not bound this separate picker.

Root cause: CandidateList directly maps its entire slot-filtered collection.
Workaround: use backpack pages and individual item details, or wait for the
picker. Do not discard belongings to improve performance.

Evidence retained by root through full-v1 acceptance:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-equip-picker-paging-bvxyrzm7/before-browser.json`
and the exact browser driver/preimage in that packet. Root removes the packet
after its consumers finish. No full-game, population, or human-pacing credit.

## Local resolution

CandidateList now renders at most50 options per page. Selection determines the
visible page; arrows/Home/End traverse the complete collection with actual focus.
Localized page controls retain their focus, and absolute ARIA positions retain
the full collection context. Eligibility, comparison and native equip stay intact.

All29affected UI cases, scoped strict types980files/zero diagnostics and two-file
lint pass. Ten Chromium cases cover both locales at all five target sizes, with
30measured openings of79.9–174.1ms and individual render commits at most36.4ms.
Navigation, unchanged holdings,44px controls and no horizontal overflow pass;
no page errors/warnings/failed requests. This is a constructed development
measurement, not whole-app INP or earned progression acceptance. Historical
BUG147's broader inventory navigation issue is outside this fix.

[Resolution evidence](../../docs/plans/evidence/p16-equipment-picker-pages.md).
Both browser drivers are terminal, their PIDs/port absent, and the exact owned
Vite cache removed. Root retains the evidence packet under the custody above.
