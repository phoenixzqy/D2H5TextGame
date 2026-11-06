# P16/P18 — Live endgame action readiness

Verified locally 2026-11-04 on `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`
plus inherited human2 changes. This closes [BUG717](../../../production/bugs/BUG-717-endgame-live-readiness.md)
against [D14 admission](../../design/worldstone-remnant.md). Full private v1,
earned endgame/balance and independent acceptance remain open.

## Behavior and authority

Enter and achievement Claim now reflect the live hero, hydration, active battle
or run, restore/transaction/recorded-wave ownership, complete native map validation
and endgame state. Refusals have localized, linked explanations. Exhausted entry
does not disable an independently earned Claim. Async ownership release and
native import recover controls without remounting.

`readEndgameReadiness` shares native preflight and entry/achievement evaluation.
It converts only typed ownership refusals to advisory busy; unexpected errors
still propagate. Reading creates no request, RNG roll, receipt, reward or ordinal
mutation. Native actions retain click-time revalidation and typed refusals;
Claim retains its guarded publication, rollback, persistence and overflow behavior.
The UI subscribes to every native validator input and existing immutable guard/
recorded-holder notifications. No new subscription infrastructure, gameplay data,
save version, dependency or authority bypass is introduced.

## Focused regression evidence

Corrected pre-change RED: six genuine bilingual enabled-control failures and six
filtered existing cases. The first attempt's leaked restore lease contaminated
its results; nested-finally cleanup corrected that setup before the genuine RED.
Both attempts are retained. Production edits followed corrected reproduction.

Final `verified.json` contains **32 actual passed assertions:18 store and14 panel,
zero failures/skips**. These include live hero/hydration/combat, native run abort,
multiple restore owners/material guard, ordinal exhaustion with successful Claim,
map-only difficulty invalidation and native import recovery, alongside existing
navigation/reward/overflow/rollback behavior.

The four remaining test failures were test boundaries: `abortSubAreaRun` does not
end combat, while CombatScreen calls both abort and `endCombat`; jsdom also lacks
IndexedDB. Tests now use the actual exit sequence and established save-adapter
stub. Real-browser import exercises actual persistence. Four test callback lint
errors were corrected with the required microtask awaits. No source behavior or
assertion was weakened to pass. Filtered reporter top-level totals counted skipped
cases as passed; final accounting uses individual assertion statuses.

Final strict scoped TypeScript and explicit four-file ESLint pass (terminal
sessions43952/98972). Test session98543 exits0. This is scoped verification, not
a whole-project type/lint/full-suite pass. No completed act, farming, earned
preparation, broad suite, build or campaign acceptance is repeated.

Existing producer's bounded five-axis review: **APPROVE, no findings**. It confirms
independent eligibility, complete subscriptions and preserved native transaction
authority. Review is read-only and runs no checks; command results are root's
evidence. Security check passes for local projection/UI with no new external flow.

## Real browser evidence

Installed Playwright drives WSL Chromium against the current production-mode
Vite source app, with no test bridge, injected state or clock changes. This is
source-browser integration, not production bundle/PWA/device/soak acceptance.

A fresh native character demonstrates locked Enter/Claim in both languages.
Settings imports the unchanged previously earned Normal-complete Save33 source:
`d2-crafting-readiness-1k5oazhx/source.native-export.json`, SHA256
`02cf24871b400ce8aaef8fe7176e0797e478c69a70baea8187dd1583d94ebdd5`.
Entry unlocks; unearned Claim stays disabled with its linked explanation.
Arrow-key modifier selection and Tab-to-entry focus work in English/Chinese.

`browser-report.json` completes12 layouts: both fresh locked360×640 views plus
unlocked en/zh at360×640,412×915,640×360,1280×800,1920×1080. No document/panel
horizontal overflow; visible buttons and enclosing radio labels are≥44×44.
Zero browser errors, warnings or failed requests. Native before/after exports
are equal across player, inventory, map, mercs, formation and endgame; imported
inventory equals source and attemptOrdinal remains0. Export metadata/preferences
are outside gameplay equality. No dungeon admission, combat or Claim is replayed.

Original element screenshots were clipped by the existing scroll container.
Supplementary captures use native scrolling and viewport screenshots: all six
checked control centers are unobscured across English mobile/Chinese desktop.
Both final Claim screenshots were visually inspected and show readable linked
explanations and reachable controls. The first supplementary script navigated
directly to a protected route before Continue and timed out; its original report
is retained. Correct native Home→Continue→Map passes, session29424. These bounded
measurements do not prove whole-app accessibility or real mobile safe-area behavior.

## Readback, retained evidence and scope

`final-readback.json` separately reconciles assertion statuses, twelve geometries,
six visible centers, native export equality, baseline copies and final source
hashes. Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-endgame-readiness-3znqjoal`.
It retains original failures, four source baselines, final checks, observer scripts,
native exports and screenshots for unfinished umbrella review. Root owns retention
and eventual exact cleanup. The input source packet is also needed until review.

Browser sessions16368/29424 and exact server4097014/session83709 are terminal.
The server was verified by its command line before SIGTERM. Disposable task-owned
browser-profile/vite-cache and the active scoped configuration are removed after
process completion; config contents are archived. `cleanup.json` records absence.
The human2 worktree remains owned for unfinished umbrella implementation and will
be released through the worktree skill when that work is done.

Previous checkpoint was status-only with completed check polling; this continuation
corrects tests and completes local implementation verification. **14/14 intended
Act I;11/14 five-act Normal;formal balance0/210** remain unchanged. Zeal/Javelin/
Double Swing acceptance, economy/acquisition/pacing, higher difficulties/endgame,
whole-app PWA/device/a11y/performance, soak and independent acceptance remain open.
No CI restoration, install, commit, push or publication; no pending user question
or browser-launch blocker. Full private v1 remains active and incomplete.
