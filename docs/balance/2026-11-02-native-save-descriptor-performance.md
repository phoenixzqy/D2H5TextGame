# Native save descriptor inspection

BUG592 now checks each own property descriptor directly instead of constructing
a bulk descriptor map and then enumerating that map for every visited object.
Every guard invocation still walks the full graph, including inherited,
nonenumerable and symbol properties, Map keys/values and Set entries. Alias and
cycle handling is unchanged. Keys absent at descriptor lookup are omitted just
as the original built-in descriptor enumeration omits them. No trust is cached
across calls, and no validation call, migration, ownership check or transaction
is removed.

The focused RED has 13 safety passes and one resource failure: the 100-item
fixture materializes 303 descriptor maps. GREEN has 122 passes across four
affected descriptor/native-save/socket suites. The final 14-case guard suite
passes after lint-only callback braces; scoped strict types, explicit lint and
engine purity pass. No campaign, inventory, combat or unrelated suite is replayed.

An alternating 12-pair warm Node experiment on the exact earned raw JSON has
104.90 ms baseline versus 50.21 ms candidate median per complete guard walk.
That experiment motivates the change; the following browser proof measures the
actual final source. The final implementation preserves original enumeration behavior for absent
descriptors, with a specific proxy regression.

| Diagnostic | Before | After |
| --- | ---: | ---: |
| Desktop native import, action to visible state | 680 ms | 593 ms |
| Mobile native import, action to visible state | 2,892 ms | 2,428 ms |
| Mobile sampled inclusive descriptor checking | 723 ms | 376 ms |
| Mobile sampled inclusive decodeSave | 1,917 ms | 1,525 ms |

Before is the retained authority32 `bug592-browser-input-v1` capture. After uses
`bug592-browser-descriptors-v1` desktop import and the corrected v3 mobile import.
Both use Chromium147 and the identical genuine level-70 / Hell961 export with
7,413 backpack items. Desktop is 1280×800/en; mobile is 360×640/zh-CN at 4×CPU.
These are single-run development-server diagnostics with automation/profiling
overhead, not physical-device results or acceptance percentiles. Inclusive CPU
rows overlap and cannot be summed.

Both corrected v3 contexts preserve the complete save in native IndexedDB and
public export after import and after reload, with only the declared desktop
locale change. They explicitly Save that change and wait for hydration ready.
There are no page/console errors or horizontal overflow. The valid desktop
import measurement is reused; it is not replayed for another timing. No completed
paste, inventory or campaign baseline is repeated.

Two failed harness runs remain diagnostic evidence. V1 reloaded before the
500 ms locale autosave, so its final comparison differs only in the unsaved
locale. V2 assumes the initial import button is English, although the app starts
in Chinese; its selector times out before import. V3 uses the existing bilingual
selector, the ordinary Save action and explicit hydration readiness. These
failures are not counted as acceptance or as native-save regressions.

Cold reload remains slow: 3.394 s desktop and 9.915 s throttled mobile, including
startup and full hydration. The mobile profile includes substantial vendor
code-generation/parsing work as well as native decode (1.255 s sampled inclusive)
and IndexedDB writes. The reload endpoint now explicitly waits for ready; do not
claim a percentage improvement over older, differently gated reload captures.
Further startup/schema/normalization/storage work remains, as does inventory
rendering/assembly-definition work. BUG592 and full v1 remain open.

Only the descriptor helper and its new focused test change in game source.
Game data, schema files, save version, rewards, combat and campaign helpers are
unchanged. The canonical earned checkpoint and all income/defeat evidence remain
exact; no new admissions, grants or accepted balance cells occur.

All owned processes are terminal and the exact probe/browser/authority Vite
caches are removed. No repository-local temporary config or build is created.
Required evidence remains in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`,
under `bug592-descriptor-*` and `bug592-browser-descriptors-*`. Root retains that
packet and the active human worktree 2 through full-v1/umbrella review and owns
cleanup afterwards.
