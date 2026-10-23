# D10 equipped combat adaptations

Continuation of the full private-v1 objective from `80f2909`. Leaf, Infinity
and Dream add their authored damage increases to ordinary learned increases.
Phoenix multiplies the bearer's existing mana-recovery baseline by1.10; zero
stays zero, and selected Meditation shares the pre-item baseline. Bramble
reflects actual direct physical HP loss only when its bearer survives, using
the approved RNG-free thorns mitigation and ordinary damage/death events.
Reflected-dead attackers stop later targets and effects. Both hero and merc
factories and next-wave refresh use canonical equipped sources; replay retains
its original snapshot and carried resources/statuses/cooldowns.

Infinity, Dream and Bramble have their approved runtime effects locally. Leaf
and Phoenix still need their active-skill integrations. Hand of Justice/Blaze
and Death/Chain Lightning also remain open; authored grants alone do not make
these four actives execute.

BUG130 exposed a missing staff base, making Leaf unreachable. The approved
single early nonmetal/two-handed staff and normal ActI loot pick now supply a
real qualifying base. Ordinary capacity still rolls0–2, Tir→Ral requires an
actual two-socket instance, and Leaf's level19 equipment requirement remains.
Adding the pick changes future selection proportions; no measured balance or
retroactive change to historical earned results is claimed.

Evidence root:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-runeword-combat-n9x0uhgk`.
Root retains indexed diagnostics for ongoing integration and removes them after
their consumers finish.

- Causal RED/GREEN logs retain missing runtime/modifier, staff availability and
  bilingual display reproductions. Separate fixture mistakes were corrected
  without changing source rules or weakening assertions: real Infinity base,
  actual backpack ownership, elapsed DoT interval and existing floating-point
  damage rounding. No timeout, skip or lint-suppression policy was weakened.
- Engine5292/151files pass in40.17s; focused132/11files pass in12.84s. Meaningful
  controls cover additive/duplicate/removal/immutability, actual damage for
  hero/merc across seven types, derived burn rates, reflection mitigation and
  RNG tail, dead-attacker control flow and native wave removal/replay/carry.
  The staff test samples512fixed seeds through real ordinary materialization,
  observes capacities0/1/2, forms Leaf and checks canonical metadata/level19.
- First standard full `npm test` run alone:10947pass/1failure/2existing skips,
  238.44s. BUG131 is the old exact74-base catalog assertion after the approved
  staff addition; its correction explicitly requires74non-staff rows plus one
  two-socket staff, retaining every row's socket ceiling check. The two catalog
  files pass40tests in2.76s. Corrected standard full `npm test`, run alone,
  passes10948tests/401files with2existing opt-in skips in259.42s,exit0.
- Final typecheck/lint and production build pass. Existing bundle/PWA warnings
  remain, including the2.57MB manifest asset outside precache limits. Seven
  JavaScript build files contain zero forbidden test-bridge tokens.
- Production browser10/10 pass in119.48s:en/zh-CN ×360×640,412×915,640×360,
  1280×800,1920×1080. Zero retry/skip/flaky/unexpected/report errors; observed
  page/console errors and warnings are empty. Cases inspect all five combat
  words, but equip/Save-close-new-page-Continue and remove/Continue only Phoenix.
  They assert exact player/inventory/map/merc/formation equality at each reopen,
  unchanged learned allocations, retained identities,44px controls/no overflow.
- Root independently audited all30 attached JSON saves for native19, all five
  owned item identities, unchanged learned ranks, equipped Phoenix then exact
  removed backpack. Mobile en/zh screenshots visibly show the full bounded
  reflection description. `browser-save-audit.json` records save checks.
-1035source/test/config and760build hashes match the final matrix freeze with
  drift[]. Fixture-only lint edits after the pilot are separately recorded;
  the final matrix freeze includes them. Independent read-only snapshot review
  `qa_save_review` returned CLEAR for this combat scope, without running tests.
  The later BUG131 catalog-test-only change is separately audited in
  `post-matrix-catalog-audit.json`; no production/browser inputs changed. Final
  typecheck/lint pass after that correction; the final1035source-input freeze
  has drift[]. Independent QA also returned CLEAR for the strict catalog-test
  correction, without running tests.

Constructed browser inputs do not prove earned acquisition→craft→equip→fight,
earned ActII–V,213-skill completion, endgame,30–50-hour pacing or C2–C4/G0–G7.
BUG129 remains open for four active integrations. No push, PR, merge or
deployment is claimed. Disposable build/browser/review-snapshot outputs were
removed after their consumers finished, with remaining[]/failures[] verified in
`cleanup.json`; retained diagnostics are indexed in the evidence root.
