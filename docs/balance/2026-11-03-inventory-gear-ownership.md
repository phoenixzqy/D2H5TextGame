# Gear state ownership and live quest projections

2026-11-03. Local fix retained; independent umbrella review and BUG592's broader
performance acceptance remain open. Private v1 is incomplete.

InventoryScreen subscribed to backpack, stash, equipment and player above the
four global inventory panels. Each gear update recreated those panel elements,
including fresh quest graph validation unrelated to gear. Gear state now belongs
to InventoryGear, alongside its paging and selection state. Materials, crafting
and legacy quarantine retain their own live subscriptions.

QuestItemsPanel now explicitly subscribes to quest receipts, cleared sub-areas,
current act and difficulty as well as quest progress and its quest-item ledger.
These are the inputs used by its live queries and act eligibility. Zustand's
shallow selection stabilizes only the selected store references; no query result,
catalog or validation result is cached. Existing action-boundary revalidation
and failure handling are unchanged.

Six before-fix regressions fail for the expected reasons in en and zh-CN:
gear-only updates repeat counted validation, clearing the act-unlock input leaves
assembly enabled, and receipt-only corruption leaves a counted row visible.
The filtered RED run excludes 24 other cases; those are not passing assertions.
After the fix all 30 affected pagination/quest-panel cases pass, with no failures
or exclusions. Scoped strict TypeScript and explicit unignored lint pass.
The updated gear-refresh expectation is justified because no panel quest query
reads gear; tests additionally prove independent quest-ledger/progress refreshes.
Actual recipe inputs, receipt refusal without getter execution, material/crafting
updates, locale, book read/retry, focus and restoration behavior remain covered.

| Profiled transfer | Retained stable-card baseline ms | Gear ownership ms |
| --- | ---: | ---: |
| Desktop/en, one observation | 203.831 | 171.059 |
| Mobile/zh, observation 1 | 962.281 | 413.433 |
| Mobile/zh, observation 2 | 923.412 | 433.043 |
| Mobile/zh, observation 3 | 937.327 | 445.222 |
| Mobile median | 937.327 | 433.043 |

Mobile median improves 53.800%; desktop improves 16.078%, satisfying the fixed
local selection rule. The original baseline is authenticated and reused without
replay. Both use Chromium 147.0.7727.15 with real tooltips, desktop 1280×800/en/1×
CPU and mobile 360×640/zh-CN/4× CPU, CPU profiling, and the same click-to-two-frames
boundary. These development localhost observations on a shared host do not
establish production or representative-device budgets.

Every context imports the earned 8,540-backpack/499-stash save through ordinary
controls and transfers its first item. Complete exported and native IndexedDB
saves equal the independently modeled single transfer. Surviving card DOM
identity remains; the last backpack item is reachable with 39 final-page cards.
No page/console errors or horizontal overflow occur. No combat, purchases,
training, destruction or campaign advancement occur.

In the first mobile CPU sample, inclusive MaterialsPanel/QuestItemsPanel samples
fall from 48.948/147.196 ms to zero. Crafting still updates from its own gear
subscriptions (23.354→35.210 ms inclusive). Baseline stringifySave has 211.263 ms
in the measured interval; the candidate has no sample there. The shorter
interaction can end before debounced save serialization, so this is not evidence
that serialization was removed or made cheaper. Native persistence is checked
separately after the interaction. Mobile longest tasks remain 277/284/297 ms;
BUG592 stays open.

All 2,147 baseline production inputs authenticate before edits. Exactly the two
components and their two tests differ afterward; gameplay data remains exact.
Check/browser processes are terminal; both exact owned cache paths are absent.
The browser run costs 82,804.100947 wall ms and zero admissions/combat; it does
not consume or renew the closed CE comparison-family allowance.

Evidence closure:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/bug592-gear-ownership-v1-closure.json`
(SHA256 `ee77320f6dcda1ccb496955ed254b9ebba40fd07fca1c6b6f125350db66cfdb2`).
It indexes the prospective plan, exact configs/commands, before/after source
snapshots, six actual RED failures, 30 GREEN assertions, four CPU profiles,
complete-save browser report and two screenshots. Root retains this required
packet and human2 worktree through umbrella review and owns eventual cleanup
and release. This self-review does not substitute for independent acceptance.

The preceding goal turn was status-only/no progress; this turn delivers a
verified production correction. Act V remains 13/19; formal balance remains
0/210. BUG611, remaining campaign, all builds/economy/Hell/pacing/retry and final
release gates remain open. No completed acts, training or passing checks were
replayed. Browser works; CI stays excluded; no user answer is pending.
