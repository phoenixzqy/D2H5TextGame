# Crafting subscriptions follow the selected action

2026-11-03. Local BUG592 correction retained; private v1 remains incomplete.

The retained cell-comparison CPU profile attributes36.196ms inclusive to
CraftingPanel during one gear transfer. Material-only recipes subscribed to
all three gear containers and rebuilt translated recipe controls twice.
Unconditional hooks now return null for containers unused by the selected
action: material-only recipes need none, socket/caster actions need backpack,
salvage needs backpack and stash, and recovery needs quarantine. Switching
actions reads current contents immediately. Material/currency/hydration/locale
and native preview/confirmation validation remain live. No gameplay, save,
public API or persistent cache change.

Six material-only native-transfer regressions fail before the source fix.
The initial affected two-file run has53passes and one incorrect new Chinese
literal. Correcting 拥有 to the actual 持有 and guarding a new fixture removes
that expectation error and lint failure. Only four affected recovery/balance
cases rerun; all pass. There are54distinct affected cases with passing evidence,
not57. Final scoped strict types and explicit two-file lint pass. Failed
receipts remain retained; filtered cases are not counted as passes. No full
suite, engine tests, campaign or completed earlier-act checks are repeated.

| Profiled native gear transfer | Retained baseline ms | Candidate ms |
| --- | ---: | ---: |
| Desktop/en, one observation |116.473|120.201|
| Mobile/zh, observation1 |295.064|238.477|
| Mobile/zh, observation2 |265.389|246.584|
| Mobile/zh, observation3 |291.562|247.062|
| Mobile median |291.562|246.584|

The frozen selection passes: mobile median improves15.427%; desktop remains
within10% of baseline. One candidate round, no baseline replay or timing retry.
Chromium147.0.7727.15,1280×800/en/1×CPU and360×640/zh-CN/4×CPU use the same
profiling and click-to-two-frames boundaries as the retained baseline. Four
contexts import the complete historical earned8540-backpack/499-stash save
through ordinary controls and transfer one item. Complete exported and native
IndexedDB saves match modeled successors exactly. Surviving card identity,
last-item access and no horizontal overflow/browser errors pass. Both final-page
inventory screenshots have been visually inspected; they do not establish full
crafting visual/accessibility acceptance. This historical performance save is
separate from the current level71 Necromancer campaign.

Mobile longest tasks remain114/114/118ms. These development/shared-host timings
do not establish representative-device or release budgets, and the timed
interaction can finish before later debounced saves. BUG592 remains open.

All2147baseline inputs authenticate from unchanged files or exact before
snapshots; exactly CraftingPanel and its target-work test change. Candidate
manifest matches disk and gameplay data is exact. Browser child1123962 exits0
after84408.526wall ms and is confirmed absent; exact test/Vite caches are absent.
No combat, training, admissions, rewards or closed allowance renewal occurs.

Evidence closure:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/bug592-crafting-subscriptions-v1-closure.json`
SHA256 `a6e3438f1d993c9f8e0a3b4a062353218ccd2e7e002aa2a36e77bb368bcc6108`.
It indexes exact sources/diff, frozen plan/configs/driver, failed/passing receipts,
four CPU profiles, complete-save browser results and screenshots. Root retains
this required packet and human2 through umbrella review and owns eventual
cleanup/release. Self-review does not replace independent signoff.

ActV13/19, formal balance0/210 and BUG611 remain unresolved. Next gameplay work
must address intended-build progression and singleton damage under a defensible
contract; no exhausted controller or rejected tuning family is reopened.
