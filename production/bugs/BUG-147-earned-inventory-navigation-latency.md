# BUG-147 — Profile inventory navigation with the large earned backpack

- Severity: Medium; navigation eventually succeeds, no loss or combat retry.
- Status: Reproduced performance concern; root cause/acceptance pending.
- Build: `1067b8e`; production Playwright-managed Chromium/en/360×640.
- Seed: N/A, before combat. Genuine Radament256 final,6124 owned items,
 6104 in backpack; raw SHA256
 `a22721de7f38951892de573d7994ccab3d4ddfa44b62148a28a5afff426012ee`.
- Owners: frontend/performance/QA; root retains diagnostics.

## Reproduction and observation

1. Import the unchanged earned save into the bridge-free production build.
2. From Settings click Inventory and measure click-to-visible `inventory-screen`.
3. Return to Settings between visits while performing ordinary equipment actions.

Expected: the real earned inventory remains responsive and usable. Full-v1
feedback/render budgets need direct measurement, including large retained bags.

Actual: first setup's default5s readiness expectation expired. Screenshot shows
the actual Inventory/Materials page; `inventory-screen` exists in source/build.
Its recovered export is byte-for-byte equal to the genuine original raw save,
no equipment action or challenge entry occurred, and console/page errors are empty.

A separate setup allows30s for functional readiness and records3.636/3.898/3.160s
over three Inventory visits. Settings visits take~0.05–0.16s. All equipment
actions succeed. These timings establish slow readiness; they do not identify
the exact cause of the first timeout or measure frame/INP/feedback budgets.
The longer diagnostic wait does not accept performance or weaken product tests.

Evidence: root-owned
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-act2-progression-jbutorzz`:
`browser257/{report.json,failure.png,stopped-export.json.gz}` and
`browser257-resume/report.json` (`navigation`). The second setup later stops
on an independently diagnosed expected-reference serialization mismatch; retain
that original failure too. Its actual six equipment transfers are valid.

Affected: Inventory rendering/comparison and navigation readiness. No exact root
cause established yet; do not blame a missing marker or tune gameplay around it.
Workaround: wait for inventory readiness; preserve the over-cap earned contents.
Do not discard possessions to make performance checks pass. Profiling and a
bounded UI correction remain future full-v1 work.
