# Single-pass live save export — 2026-11-02

Live export now calls the existing Map/Set-aware `stringifySave(snapshot, 2)`
directly. Previously it built a compact JSON string, parsed the full graph and
then pretty-printed it. The two-line persistence change removes that redundant
string and object graph. Projection, clock sampling, transaction guards, null
behavior, validation and save version remain unchanged.

## Measurement and correctness

Use the immutable earned level71/Hell1020 successor with8,235backpack items;
no campaign replay, purchases, grants, forced identities or source-save edits.
On the real decoded/store-projected snapshot, nine alternating warm Node pairs
measure old92.493ms→candidate57.208ms medians (38.15% lower). After applying the
change, a separate nine-pair actual-store check observes93.976→50.290ms
(46.49% lower). Each measured result equals the old pretty export byte for byte;
actual store export equals that same output. These are warm Node screening
measurements, not browser wall times or production performance acceptance.

The projected earned snapshot contains no native Maps. The initial probe failed
an incorrect fixture assumption before timing; the corrected probes record zero
Maps and separately check nested Map/Set serialization equality. They do not
insert synthetic content into the earned save. Keep the failed report as evidence.
The real current snapshot export is8,373,763UTF8bytes; its canonical version
has been normalized through the existing decode path.

87existing cases pass across persistence(17), materials(8) and offline(62),
covering exports, typed holdings, native inputs, failed writes, projection and
ownership guards. Scoped strict types and changed-file lint pass. No source
engine module changed. No unrelated/campaign suite or full integration checks
were rerun. Five-axis self-review finds no issue; independent review remains due.

Real Chromium147 dev-server checks at desktop1280×800/en and mobile360×640/zh-CN
perform ordinary file import, native export, fielding, explicit Save and reload.
Every downloaded export equals independently formatted expected JSON exactly.
Complete earned state, recruit71 and XP163574/403129203604 survive. Both profiles
have zero page/console errors and no horizontal overflow. Browser copies execute
no combat or purchases. Screenshots are retained. This is functional browser
verification; no production browser timing claim is made.

## Authority, artifacts and remaining work

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Evidence stems: `bug592-export-single-pass-v1` (plan/failed fixture assumption),
`-v2` (pre-change), `-v3` (actual candidate), `bug592-export-single-pass-checks-v1`
and `bug592-export-browser-v1`. Source authority52 rechecks2,141inputs; exactly
`src/stores/persistence.ts` differs from51, with inverse patch matching its
prior hash. Source hash: `e855830e49528b8a33ed48f13b982bc73b2eb82913677aaac10e361c64968faf`.
Authored data and both canonical/earned saves remain unchanged. Exact task-owned
Vite caches and typecheck output are absent after all consumers finish. Root
retains evidence, runners and screenshots through umbrella review, and owns
subsequent cleanup and worktree release.

BUG592 stays open: startup/reload validation and inventory/runtime budgets are
not established by this export optimization. Representative party/economy,
14-build fairness/holdouts, defeat/retry/manual-idle,30–50active-hour calibration
and integrated G0–G7/two-hour soak/independent review remain before owner playtest.
Accepted balance configurations0; full goal active. Browser works; CI excluded;
no pending question or external blocker.
