# P18d — Explicit endgame Claim, title and native UI

Date: 2026-10-24. Local implementation after `ff47a50`, branch
`feat/playable-foundations`; delivered in local commits `299f94f` and `fd99436`.
No push, PR, merge or deployment.

## Delivered behavior

- Bilingual map panel projects earned campaign lock, the two authored trial
  modifiers, completed counts and once-only explicit achievement Claim.
- Claim uses the shared action lease, validates current eligibility, grants
  exactly one perfect ruby and sapphire, and publishes the Riftwalker title.
  BUG140 corrects reference-verified rollback and independent recovery
  notifications when store observers throw; unverifiable restoration locks
  saving and further Claim before releasing the lease.
- Current save20 title validation accepts Riftwalker only with its claimed
  achievement. Historical v17–19 title maps remain frozen. Town controls and
  the nameplate use the current title projection.
- Combat admits the explicit modifier request, presents captured native origin,
  retains exact publication recovery, suppresses campaign/idle continuation,
  and issues fresh attempts after terminal defeat/victory. BUG141 releases
  retained encounter authority on explicit Return before the next entry.
- BUG142 corrects canonical Blood Lord/Frozen Terror priority starvation by
  placing their existing elemental skill before Strong Melee. This also
  changes those monsters' Act V campaign appearances. AI, cooldowns, stats,
  membership and dungeon construction are unchanged.

## Causal controls and current gates

BUG141 records RED3/12 then combined combat/endgame/map GREEN94/5. Independent
Claim/UI review and terminal residual rereview are clear. BUG142 records native
RED2/2, then GREEN2/2 with real elemental damage, Ignite/Chill, melee cooldown
fallback, deterministic replay and unchanged inputs. Final typed focused2/2
and scoped lint pass; independent BUG142 source/test review is clear.

Complete current engine suite: 5449 tests /161 files pass. Complete current
unit suite: 11203 tests /419 files pass, with two existing skips, in360.61s
(`claim-ui-layout-full.log`). Typecheck and full lint pass for the final source.
Engine/full unit durations exceed their stated3s/15s budgets; no timing-budget
acceptance follows.
The first final lint found a redundant unsafe `expect.any(Number)` matcher in
the new test; the matcher was removed while retaining the positive-damage
assertion, and scoped lint passes. A superseded full run was stopped
with SIGINT to its verified task-owned Vitest PID after the later layout
correction; its partial output is preserved and does not count as a passing gate.

Production build with `VITE_E2E` unset passes. All four JS chunks contain zero
forbidden test-bridge symbols. Existing large-bundle and oversized manifest
precache warnings remain; no performance/PWA acceptance follows.

## Constructed production-browser screening

Evidence root:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-endgame-native-sapkemp7`.
Exact files, ownership and disposables are tracked in `artifact-ownership.json`.
Root retains diagnostic evidence through Claim/UI/full-v1 consumers and removes
it when those consumers finish.

`claim-ui-preparation-manifest.json` declares the prepared character's inherited
constructed final-campaign entitlement, L90/core100 and native sword/cap fields
with deliberately out-of-range one-million attack/life power. Derived stats
are recomputed through production composition and both imported inputs pass
native save validation. No test skill, browser store mutation or test bridge is
used. This establishes functional behavior, not earned unlock or build viability.

`claim-ui-elemental-screen1-results.json` passes English360×640 with zero
page errors, console errors/warnings or retries. Actual UI actions verify:

- Fresh-character lock, unlocked projection and keyboard radio selection.
- Partial four-wave attempt discarded after Save→close→new-page Continue,
  preserving spent attempt ordinal and zero clears/cache.
- Native four-wave Ashen, repeat Ashen and Glacial clears; actual Fire Breath
  plus Ignite and Frost Aura plus Chill in production combat logs.
- Clear counts2/1, next ordinal4, repeat caches and unchanged campaign map.
  Ordinary wave loot may also drop the cache's gem; exact cache quantities
  are proven separately by native unit controls.
- Explicit once-only Claim, exact +1 perfect ruby/sapphire, selected Riftwalker
  nameplate and exact exported save equality across page closure/Continue.
- Spend the claimed ruby in the native socket action, equip that cap through
  Inventory, and persist actual maximum Life1062 = base1012 + ruby50.
- Weak constructed character's native defeat, fresh retry and Flee with no
  clear/cache credit; no idle-loop or next-area control in the dungeon.
- No horizontal overflow; measured panel/terminal buttons and radio labels
  have at least44px targets. Screenshots retained for inspection.

The prior screening failure assumed ordinary loot could not duplicate the cache
gem; its original report remains preserved. The prior melee-only passing screen
does not establish modifier mechanics; corrected screening above does.

Source/config/test/design hashes are in
`claim-ui-elemental-source-freeze-corrected.json`; build hashes are in
`claim-ui-elemental-build-freeze.json`. The sole post-build change is the
documented test-only unsafe matcher removal, recorded in
`claim-ui-elemental-freeze-delta.json`; production runtime is unchanged.

## Remaining acceptance

BUG143 was found during independent screenshot review of the functional screen:
the sticky idle strip obscured text and Claim controls. The browser regression
fails at mainBottom583/tickerTop467 before correction. ScreenShell now reserves
a non-scrolling footer and Map places the ticker there. Focused UI29/4 and the
corrected production build pass. The browser harness also corrects its prepared
imports to preserve each case's locale and gates zero-console results.

`claim-ui-layout-matrix1-results.json` passes10/10 across English/Chinese and
360×640,412×915,640×360,1280×800,1920×1080, with zero retries/page errors/console
warnings or errors. Every case repeats the functional checks above, requires
main.bottom≤ticker.top and captures lower Claim/actions screenshots.
`claim-ui-layout-matrix-audit.json` independently validates all130 attached
native saves, all40 exact Save/Continue pairs, locale preservation, unique owned
item IDs and all three original prepared items, plus actual equipped Life1062.
Final source1086/build760/input4 hashes have no drift. Current freezes are
`claim-ui-layout-{source,build,input}-freeze.json`; four JS chunks have zero
bridge markers. Earlier screening freezes remain historical evidence.

Independent source/harness and final matrix evidence review are ADEQUATE
(`claim-ui-layout-reviews.json`): all10 cases/130 saves/40 durable pairs,30
boundary records and representative screenshots were reviewed. All readers
released. Final source/input rehash after full-unit completion has zero drift.
All registered disposable paths are verified absent; build hashes were checked
before verified build cleanup. Raw diagnostics remain root-owned at the exact
evidence path above through unfinished full-v1 consumers. No earned endgame, legal multi-build difficulty,
full Act V pacing, ordinary-clock playtest, comprehensive manual accessibility,
performance/PWA or full P18/C2–C4/G0–G7/full-v1 acceptance is claimed. Earned
campaign continuation remains in Act II; prepared later-act checks do not
replace that requirement.
