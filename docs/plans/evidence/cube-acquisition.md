# Horadric Cube: explicit recovery from an earned Act II prefix

2026-10-23, base `ad65952`, H1 runtime identified by the retained 812-file
source manifest. [Accepted contract](../decisions/D11-cube-acquisition-v1.md).
This completes Cube acquisition only. C0/C1 retain their historical acceptance;
C2 is underway, while C3/C4 and full G0–G7 remain open. Local only.

Map Inspect visits the canonical Dry Hills coffer without combat or credit.
Only explicit Recover from the tracked, unclaimed Horadric Staff quest issues
`quest/horadric_cube` at
`quests/act2-horadric-staff#objective:obj-cube` and sets its own flag true.
Later flags, inProgress status, XP, points, rewards, clears, access, gear and
currencies remain exact. Inventory presents an inert localized retained tool.
Claim/Read/Recover share the synchronous lock through all rollback attempts;
mutate-then-throw observers restore both participating domains, and failed
restoration throws explicitly. This is not observer-wide or crash atomicity.

Save v13 admits exact owned objective tools; consumed Cube receipts are invalid.
Frozen v12 Book-only validation precedes the pure copy migration. Existing owned
and consumed Books retain their sources/effects. Import never infers a Cube from
a true flag; explicit canonical recovery repairs a missing in-progress receipt.
Dexie's schema does not change. The erroneous completion Cube reward is removed;
the Staff quest retains its separate 6000 XP claim.

## Validation

- Full unit: **8945 tests / 296 files PASS**, exit0,194.10s.
- Engine: **4304 / 111 PASS**, exit0,32.61s. Focused data/service/UI:55/4 PASS.
- Typecheck, lint, production build and all4 JS chunk bridge checks PASS.
- Final source812/build760 hashes match. The only post-freeze correction replaced
  empty test callbacks with expression-return undefined; it changes no runtime
  source or assertions. The correction and final source manifest are retained.
- Production browser: **2/2 PASS**, en/zh-CN,151.956s, retry0, no skips/flaky/page
  errors. An additional native Close/focus check passes1/1 in both locales,6.677s.

The full suite and engine exceed their documented15s/3s loop budgets; this slice
makes no suite-speed acceptance claim. The existing2.57MB art-manifest precache
warning remains; full offline/performance acceptance remains outside H1.

Causal evidence distinguishes failures from scaffolding: data3fail/4controls;
codec4fail/47controls; Recover's source visit fails unknown-area and seven cases
lack the not-yet-created action; UI4fail before controls; completed/claimed
owned feedback2fail/4controls. Initial wrong-project discovery, Ajv strictRequired,
missing fetch target schema field, stale v12 assertion, test typing and empty
callback lint failures are retained with their corrections, not counted as
independent gameplay regressions. No failed test is weakened or skipped.

## Production player proof

The exact committed earned preparation fixture has SHA256
`beb7a5f8852ce6f24ad849d02fa6a7244772bb7bf6a71df40c13f2bcab0e645b`.
Fixed Date1792497600000 retains native timers on every new page. Ordinary Import
changes only version12→13 before locale preferences. Complete Save-close-new-page
Continue preserves the preflight. No Staff quest is initially tracked.

Untracked Inspect grants nothing. Ordinary Quest Start creates false flags;
keyboard Recover changes exactly the owned Cube ledger and obj-cube=true.
All4057 unique owned gear IDs survive:4042 backpack,8 hero equipment,7 merc
equipment; zero new gear IDs. No allocation, equip, combat, farming, claim,
XP, clear or act unlock occurs. This remains a historical-C1 earned continuation,
not a fresh-current-runtime full campaign or a Dry Hills clear.

Both locales pass11 viewport sizes, including360×640,412×915,landscape,1280×800
and1920×1080, with44px Map controls and no document/main horizontal overflow.
Inventory has no tool action. Before/tracked/owned/legacy-migrated/repaired saves
survive exact Save-close-Continue; ordinary imports restore tracked/owned states.
Duplicate disabled Recover changes nothing. Native Close restores Inspect focus.
ActIII remains locked. No production test bridge is present.

A separately labelled constructed v12 tracked/true-flag/no-item clone proves
no import backfill, exact migration and one explicit repair. It is not an earned
campaign step and never replaces or modifies the genuine input fixture.

Versioned output fixtures:

- `fixtures/cube-earned-owned.json.gz`, SHA256
  `c83afd7ebc8f2f4dc67009baf68263250e3208c6c842e64de9188cff38d4f53d`.
- `fixtures/cube-legacy-flag-only.json.gz`, SHA256
  `be18f87d0e233d3d1d8c79036103158107197f536e80b31bf389abdd60b6a8c1`.
- Exact main and Close browser scripts are preserved as `cube-*.spec.ts.txt`.

Producer H1 final APPROVE/security PASS and independent QA-H1 APPROVE/security
PASS cover final source and browser evidence; no material findings. All readers
released; known handles are terminal.

Raw logs, reports, bilingual saves/screenshots, manifests and correction records
remain root-owned at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-cube-sytoegqp`
through H1/C2/umbrella consumers; root removes them after those consumers finish.
The root includes the exact artifact inventory and ownership receipt.
Exact task-owned dist, browser-output and close-browser-output are removed after
reader release. cleanup.json reports remaining[]/failures[] and the task preview
port closed. Required evidence remains retained at the exact root above.

Next: explicitly contract consumed component/output receipts, canonical shaft and
amulet sources, then assembly and Staff insertion. Duriel identifiers/quest-table
reward, Tainted Sun's documented permanent resistance reward, nonexistent Canyon
metadata and the ActIII access policy remain required separate decisions/work.
Cube acquisition completes neither Horadric Staff, ActII, C2 nor the full goal.
