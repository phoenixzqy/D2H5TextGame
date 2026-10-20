# P04a07d — Production quest claim/save wiring

Input `6ecfd80`, claimed human worktree2, `feat/playable-foundations`.
Node24.21.0/npm11.19.0, Playwright1.59.1 with pinned Chromium headless147.0.7727.15/revision1217. Status: accepted production claim/save wiring; producer APPROVE / ADEQUATE and QA APPROVE / ADEQUATE.

This covers the production UI for the real authored canonical Andariel reward.
Each isolated context creates a fresh Sorceress through UI, exports a save,
then imports the same save with **only canonical quest objective completion**.
It does not earn Andariel victory or establish C1/campaign acceptance.
Ten cases cover zh-CN/en at360×640,412×915,640×360,1280×800,1920×1080.
The dedicated config extends the guarded production runner, lives outside debug
E2E discovery, uses an isolated output directory and strict own preview port4597.
The actual production bundle has no `window.__GAME__`; no store injection,
combat/power/gear/currency or seed substitution is used.

## Observed RED and oracle amendment

Initial frozen spec `90678989…`, config `ce92915c…`: all10 cases failed solely
claim height40px; all5zh cases additionally failed canonical name/description/
objective localization. All hard payment/inventory/map/reload/once-only assertions
completed. English renders correctly by authored default fallback; absent English
canonical keys are a source fact. Original assertions, sources and failed results
are retained. Structured BUG-051/052 were filed before runtime changes.

Independent QA/producer identified that clicking Save alone does not await
`flushSave`; autosave could hide manual Save failure. They approved exactly one
additive hard localized `Saved` / `已保存` status assertion before reload.
Strengthened spec `f269ae6d…`, unchanged config; all10 strengthened cases reproduced
the same25errors (5zh×4,5en×1), with the added Save confirmation passing. Both
reviewers independently audited all30save attachments and source-backed oracles
before approving the smallest fixes. No assertion was removed or weakened.

Original host `fc-list :lang=zh` returned nothing, and screenshots rendered CJK/
emoji as tofu. These initial images cannot establish Chinese visual readability.
The stronger RED and GREEN use task-local official Noto CJK/emoji font files and
`FONTCONFIG_FILE`; no app CSS/font/dependency change. URLs, hashes and failed
initial font-fetch attempt are retained in the outcome packet. Strengthened
zh-small crop demonstrates working CJK/emoji while still showing the real English
quest fallback. Font files/cache/config are disposable task environment assets.

## Root fixes and acceptance

Only four quest-local action minimums40→44px, plus the canonical
`byId.act1-sisters-to-the-slaughter` name/desc/obj1 in both locale files. Writer/
narrative approved exact copy; English matches authored source; the distinct
Andariel bounty remains intact. Shared Button, reward/claim/save behavior and
quest/monster/TC data are unchanged.

The frozen browser assertions require canonical localized copy; exactly one
named gift chip with no raw metadata; enabled ≥44px claim; localized feedback/
disabled once-only claim; +8000cumulativeXP/progression-only points; exactly one
Coif19 with no other inventory/currency or map changes beyond claimedflag;
localized three fixed unique stats in inventory; successful manual Save then
reload with exact player/inventory/map; no second payment, overflow or console/
page errors. Screenshot review covers gift/item readability and clipping.

Related807/60 and full2825/147 pass,0pending/todo; typecheck21.860s and
lint42.324s/purity53 pass; initial explicit ignored-PWA-file lint4.882s pass.
Related32.654s/full40.880s exceed existing5s/15s budgets; thresholds unchanged.
Initial plain targeted lint failed because PWA paths are ignored; explicit
`--no-ignore --max-warnings=0` passed and the failed attempt remains recorded.
Production10/10 pass46.208s,0skipped/flaky after guarded build and all unit/simulation processes exited. All strengthened assertions and config remain frozen; additive visual source amendments are recorded below. Root inspected all20 GREEN crops: quest chips/copy and desktop inventory detail are readable; mobile inventory screenshots sometimes contain a tooltip overlay covering the detail. This required source-backed classification/reproduction and prompted the visual amendment below. Passing hard assertions do not establish absence of occlusion. Initial GREEN and all images remain preserved.


## Additive visual evidence and capture correction

Root/QA screenshot inspection found documented item hint overlays in initial
mobile detail crops, plus a landscape feedback crop meeting the fixed footer.
Neither observation established a new runtime defect. Producer/QA approved
preserving initial GREEN and adding actual mobile tap, normal neutral detail
title tap/click to dismiss the hint, hard tooltip absence, full `ratio:1`
title/all3stat viewport assertions and fullviewport title/stats/feedback captures.
All prior settlement/save/copy/geometry assertions and original crops remain.
No DOM/style hiding, force, state mutation or Escape dismissal is used.

First additive visual run9pass/1fail55.977s: `End` scrolled English landscape
to the lastAct/Baal rather than the canonical quest, causing feedback viewport
ratio0. This is a capture action error, not an app defect; failed source/report/
log/image remain. Both reviewers independently approved replacing only the
scroll actions with native target `scrollIntoView` center/nearest/instant,
preserving every assertion and ratio threshold. Corrected run10/10 pass50.467s,0skipped/flaky; report
`92b97f625a5c1e78356de1c5c1d699ee5d22d413dba4e3efe72b3e7929e525c6`.
Producer and QA each independently inspected all30 corrected viewport captures,
plus prior quest crops. Root inspected critical mobile/landscape captures.
Feedback, localized title and all3fixedstats are readable without hint/footer
occlusion. Landscape title and stats use separate scroll positions; this does
not claim the entire panel fits simultaneously.

Browser source `12b0e430…` passed typecheck but explicit lint found
`no-confusing-void-expression` in the native scroll callback. Both reviewers
approved only block-bodied callback formatting. Final source `d1374ebc…` keeps
the identical scroll call and all assertions. Final typecheck10.787s and explicit
PWA lint5.578s pass. Browser was not repeated for braces alone; both exact sources
and their diff are retained. Runtime remained unchanged since full unit validation.

## Artifacts and remaining scope

[Outcome packet](fixtures/p04a07d-outcome.json) retains exact commands, results,
source/report/log hashes, exact failed assertions, per-case geometry and decoded
save snapshots, frozen original/strengthened tests/config/plans, font provenance
and original/fixed runtime snapshots. [Browser crops](fixtures/p04a07d-browser/)
retain55images: initial font-limited/stronger RED examples,20initial GREEN crops,
onefailed End capture and30corrected viewport captures. Root owned RAW `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-andariel-browser-j0mql7lv`
and task-created `dist` / `node_modules/.vite`; both independent consumers explicitly released retention.
Playwright owns preview/browser lifecycle. Final packet includes18commands/logs,50browser cases/148decoded save snapshots (failed visual enlandscape stops before paid/restored),
24source/plan snapshots and production bundle hashes. Both final audits APPROVE / ADEQUATE verified every command/log/report/source/
save/image/bundle hash before closing edits (packet SHA326d1365…). Exact D RAW,
dist and .vite were removed through verified portable APIs after processes exited;
absence verified, original main checkout clean. Two hash-verified font files moved
by copy into root-owned next RAW `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-den-discovery-n0stepbb`;
root owns their later cleanup after that task's consumers release. Root worktree
claim continues for full v1.

Earned boss/campaign, C0–C4/G0–G7/fullv1 remain open. No push/PR/merge/deployment.
