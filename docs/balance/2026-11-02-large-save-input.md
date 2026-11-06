# Large-save input recovery

The large-paste stall in BUG592 is fixed in the working tree. Native validation,
reload and inventory rendering remain separate performance work. This does not
complete G1/G5, the two-hour soak or full v1.

The input is the genuine earned level-70 / Hell961 export with 7,413 backpack
items and 7,533,133 bytes of JSON. Both browser runs use Chromium 147, the same
logical Date, and the same retained export; they do not play combat or grant
items. Desktop is 1280×800/en. Mobile is 360×640/zh-CN with 4×CPU throttling,
which is a synthetic workload rather than a physical-device benchmark.

| Mobile operation | Before | After |
| --- | ---: | ---: |
| Paste preparation, action to visible state | 38.868 s | 0.280 s |
| Longest task during paste | 25.622 s | 0.185 s |
| Native import after preparation | 11.504 s | 2.892 s |

Only the new import measurement has CPU profiling enabled. These are single-run
dev-server diagnostics including automation overhead, not acceptance percentiles.
The large reduction in paste cost comes from cancelling native insertion before
the browser lays out the JSON. The full payload is kept outside the rendered
text field, including normal selection replacement. A compact, localized source
panel replaces the large editor; Import remains an explicit action. Smaller
pasted text stays editable. A file chooser prepares the same payload directly.

Desktop file preparation takes 1.531 s including Playwright's binary transport;
this is not a claim about user file-picker or disk latency. Its native import is
0.680 s. Both public input paths preserve the complete known earned save in
IndexedDB and public export. No horizontal overflow or page errors occur, and
the prepared confirmation control meets the 44px touch target. UI screenshots
are retained with animations disabled.

The 14 new bilingual input tests cover large-paste prevention/exact text,
selection replacement, explicit confirmation, small editing, file reads,
read failure/retry, pending controls, clearing and native rejection feedback.
Together with 11 existing Settings tests, 25 distinct affected cases pass.
The corrected final import suite passes all 14 cases; scoped strict types and
explicit lint pass. Earlier matcher/type setup failures are retained and are
not counted as feature failures or successes.

The importer, schema and ownership validators are unchanged. CPU captures show
that native save decoding/validation remains the largest sampled application
work during import. They also retain the separately slow inventory first-page
path (about 2.56 s on the throttled view). The samples include native/idle work;
phase timing and warm/cold behavior need isolation before another optimization.
Do not weaken graph validation or delete protected items to improve timings.

The canonical earned successor and all source-income evidence remain unchanged.
There are no new campaign admissions or accepted balance cells. The source
transition consists of the dialog, its Settings integration, focused tests and
six strings in each locale. No engine, save schema or game data is changed.

Required evidence remains in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`,
using stems `bug592-input-*` and `bug592-browser-input-v1*`. The latter includes
full source freeze checks, both native browser roundtrips and CPU profiles.
Root retains this packet and the active worktree through full-v1/umbrella review
and owns cleanup after those consumers finish.
