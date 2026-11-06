# Quest objective validation dispatch — 2026-11-02

Status: schema optimization retained locally. BUG592 and full private v1 remain open;
accepted balance remains0/210.

Only `src/data/schema/quest.schema.json` changes from authority69: dispatch
objectives by their required known type before validating the existing closed
payload. Both deliver variants and all three interact variants retain their
original unions. Every other definition is byte-value equivalent. Fresh loader
validation, compiler options and transaction guards remain in place.

The original/candidate external screening agrees on5,862documents;15alternating
warm Node pairs reduce median validation1.260→0.235ms. A separate1,013-case
corpus covers all19closed payload variants (59accepted/954rejected), with no
acceptance mismatch or input mutation.394affected loader, quest-item, inventory
panel and Golden Bird tests pass. Both real generated browser validators match
all1,013cases and current schema metadata. No unrelated suite or campaign replay.
This JSON-only edit needs no additional TypeScript/lint compilation; strict Ajv
compilation and actual Vite browser generation are verified instead.

Both browsers import the same genuine level72/Hell1043/8,540-item successor.
Complete native IndexedDB and public import/export values agree before and
after inventory. There are100visible cards, no horizontal overflow, page errors
or console errors. Browser checks use normal performance timers and a fixed Date.

| Profile | Baseline first opening | Candidate first opening | Baseline warm median | Candidate warm median |
| --- | ---: | ---: | ---: | ---: |
|1280×800/en|463.513ms|439.830ms|420.885ms|417.139ms|
|360×640/zh-CN,4×CPU|2355.980ms|1749.737ms|1149.292ms|1052.077ms|

Each first opening has a CPU profile; each warm median uses five unprofiled
openings. Mobile inclusive `loadQuests` samples196.482→51.882ms and
`QuestItemsPanel`218.891→110.240ms overlap and must not be added. Shared CPU
activity and different JIT histories limit causal attribution of total wall
timings. Long tasks and ~one-second repeat opening remain; this does not accept
production budgets, Web Vitals, balance or pacing.

Independent readback re-enumerates/hashes all2,141production and106campaign
inputs. Only the schema changes; campaign and gameplay content stay exact.
Authority70 production hash is
`bdec7ea112846fa42ed46d01e8bd5edb0a3a9b46ff1fb99418004b0ff5729563`;
data hash is`9a10343c0606d028d2c9b5738c45c983fddd322c5946abbb809909f41d3f47e8`.
The earned successor SHA256 stays
`aa7f9ed5196513e1a0045c59624550c815876b745d5e48c4512129859ca8ed76`.

Evidence retained under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`:
`bug592-quest-dispatch-{probe,corpus,affected,baseline,candidate,readback}-v1`
reports/scripts/logs/receipts, schema snapshots, four CPU profiles and four PNGs;
`p15-campaign-harness-source-audit-v70.json` freezes the verified source.
The artifact index records exact paths/hashes. All consumers are terminal;
both exact Vite caches and the observed baseline browser profile are absent.
Candidate browser closure reported no error; its temporary profile path was
not captured before closure, so independent path absence is not claimed.
Inherited Bow artifact closure remains outstanding. Root retains this packet
and the active worktree through umbrella review and owns eventual cleanup.

Next return to unresolved build progression using retained diagnostics. Full
scope remains14fresh build populations/holdouts/funding fairness, recruitment/
Hell economics, defeat/retry/manual-idle,30–50active-hour calibration, BUG592,
integratedG0–G7, two-hour soak/review and later owner playtest. Browser works;
CI excluded; no pending answer or external blocker.
