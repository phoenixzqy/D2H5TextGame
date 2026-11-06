# P12b — Live crafting readiness

Verified 2026-11-04 on `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus
inherited human2 changes. This implements advisory readiness before Preview;
full private v1, P12b acquisition/economy and independent acceptance remain open.

The form now reports precise participating material/currency deficits and
native progression, target, hydration, battle and transaction restrictions in
English and Chinese. Resources, target custody, hero/merc ownership, golem
reservations and native map authority refresh a subscribing child; target-list
preparation remains isolated in the parent. Final native validation still runs
when preparing and committing an action.

## Native authority and transaction behavior

`validateMaterialActionSelection` shares selection validation with preparation;
`validateLiveMaterialAction` shares native preflight and current context.
Readiness creates no request, result, random roll, durable receipt or mutation.
Malformed participating balances are refused before reporting ordinary resource
shortages. `MaterialActionShortageError` carries all material/currency deficits.
Existing confirmation, cancellation, stale revalidation, exact-once commit,
rollback and saved action ordinals remain authoritative. No recipe, cost,
balance, dependency or save-format change is made.

Wave/restore/quest/material guard acquire/release notifications are coalesced
and observer exceptions isolated. This includes the final private guard release
after async import. Recorded-wave holder notifications independently refresh
readiness after settlement ownership changes. Item debit remains covered by the
active wave, without separate notifications.

[BUG716](../../../production/bugs/BUG-716-crafting-readiness-map-dependencies.md)
adds explicit subscriptions for every native map dependency. Its constructed
direct-store title replacement exposed stale advisory state in both locales;
the native validator already refused correctly. Sanctioned player title/quest
transactions and import already notified guards, so this is defensive
consistency, not evidence of an exploitable supported player flow.

## Scoped verification

The initial seven affected files pass **236/236** distinct tests. A follow-up
runs the readiness and unchanged target-work files: **30/30** pass, including
two new bilingual title invalidation/recovery cases. After narrowing the test
fixture from an arbitrary title to the valid-but-unowned Baal title, only those
two cases are repeated and pass. The union is **238 distinct passed cases**,
not 268. No unrelated act, earned transaction or campaign is replayed.

Final strict scoped TypeScript passes for the twelve changed source/test files,
their transitive imports and the existing Vite declarations. Explicit twelve-
file ESLint finds only two test callback issues; their correction passes the
single affected test-file lint. Original failures are retained: missing Vite
ambient declarations in the temporary configuration, nullable test export,
overly broad title fixture and void callback shorthand. No strictness or native
validation is weakened. The accidentally launched full compiler failed and its
log is retained; this slice's scoped pass is not a full-project type pass.

The existing producer independently reviewed the bounded implementation and
the subscription follow-up: **APPROVE, no material findings**. That review ran
no checks and preceded final corrected compiler/lint completion; command
results below are the implementer's evidence. Security review passes: local
native validation/UI only, with ownership/transaction checks preserved and no
credential, network, permission, CI or dependency changes.

## Real browser evidence

Installed Playwright drives Chromium in WSL against the production-mode Vite
source app, without a test bridge, injected state, clock changes, combat or
farming. This is source-browser integration, not production bundle/PWA signoff.
The unchanged earned source is
`d2-earned-crafting-vlpcc4z5/continued.native-export.json`, Save33, action899,
185 backpack/318 stash, Normal complete; SHA256
`02cf24871b400ce8aaef8fe7176e0797e478c69a70baea8187dd1583d94ebdd5`.

English and Chinese checks cover Normal's Um→Mal progression refusal, missing
target→owned target recovery, affordable gem crafting, exact missing perfect
amethyst quantity, and one ordinary El Preview/Cancel. Both languages render
at 360×640, 412×915, 640×360, 1280×800 and 1920×1080. All ten measured layouts
have no document/panel horizontal overflow; measured visible controls are at
least44×44. The inspected English mobile and Chinese desktop screenshots show
legible statuses/buttons. These bounded measurements do not prove whole-app
accessibility, safe-area/PWA behavior or long-session performance.

`browser-report.json` completes with zero browser errors/warnings. Separate
`final-readback.json` compares native exports and rechecks geometry. Player,
inventory, map, mercs, formation and endgame remain equal before/after; imported
inventory equals the source, action899 and latest receipt stay unchanged.
Export metadata is outside gameplay equality. Browser checks preceded the final
subscription-only extension; its refresh behavior is covered by the final
component regression. Existing earned gem/Lore and recipe-family transactions
are not repeated and receive no additional economic/campaign credit here.

## Evidence and cleanup

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-crafting-readiness-1k5oazhx`.
It retains baselines, original failed checks, test JSON/logs, final scoped
validation receipt, observer/server scripts, native exports, ten screenshots,
source hashes and cleanup/readback records for unfinished umbrella review.

Browser session16773 and server session9758 exit0; verified task server4089239
is absent. Final check sessions50724/5331/1926 exit0; preceding sessions are
terminal. Exact task-owned browser-profile/vite-cache are removed and verified
absent. Scoped configuration contents are archived before removing the active
temporary config. Root retains the required packet and owned human2 worktree
through umbrella review, then owns exact deletion/release. No install,
commit/push/publication, CI restoration, broad test suite or campaign replay.

The previous status turn verified failed compiler results and cleaned the
browser server/caches; this turn changes source, completes scoped verification
and records closure. **14/14 intended Act I,11/14 five-act Normal,formal0/210**
remain unchanged. Zeal, Javelin and Double Swing acceptance; economy/pacing;
higher difficulties/endgame; PWA/device/a11y/performance; soak and independent
acceptance remain open. No user answer or browser-launch hold is pending.
