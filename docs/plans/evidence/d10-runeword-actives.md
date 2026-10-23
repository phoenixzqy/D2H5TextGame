# D10 equipped active skills

Status: implemented and validated locally; earned crafting/campaign acceptance
remains open. Continues the full private-v1 objective from2317d54. This card
does not accept earned crafting/campaign, C2–C4 or any complete G0–G7 gate.

Leaf now grants real Fire Bolt rank3; Hand of Justice grants real Blaze rank5;
Death grants real Chain Lightning rank5. Each uses its existing authored
damage, MP, cooldown, targeting, status and combo tags. Phoenix grants the
separate JSON/schema-validated `item.redemption`: floor10%maxLife self-heal,
0MP,4s cooldown and one ordinary action, without resurrection/corpse use/RNG.
The existing Phoenix regeneration effect remains independent.

Authoritative equipped hero/merc sources project explicit ranks and priorities
at wave creation. The highest legal learned/granted rank wins, capped by the
source maximum; learned class/level/recursive prerequisites and integer ranks
are checked. Equipment never allocates points or creates permanent learned
ownership. Missing grants append in fixed slot order; explicit order wins.
Unequipped stored entries remain dormant. Hero cleanup retains tails beyond
nine rows and never automatically persists appended grants. Merc edits retain
the exact unique permutation/signature/lifecycle guards. A shared canonical
weapon resolver supplies both factories. Next-wave changes refresh availability
without changing frozen playback or refilling resources.

The new authored item row joins the central loader and localized cast catalog.
Its runtime registration copies validated values into a frozen definition.
Bilingual inspection shows granted name/rank/payment/cooldown; both priority
editors use the authored name and mark unavailable entries. Existing save19
and learned allocation shapes remain unchanged.

Evidence root:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-runeword-actives-33rokgzu`.
Local commits: pool `3a708ba`, authored engine `cb15c5b`, wave integration
`c970b1d`, UI `3a23329`, browser harness `97edc9a`. The final full gate ran
before these commits on the identical1055file source/config manifest; commits
add no source changes. Documentation is updated afterward.

Root owns retained diagnostic logs, manifests, reports, screenshots and observer
source. Task-owned build/browser/review staging has been removed and absence
verified; `browser-cleanup.json` records remaining[] and failures[]. No push/PR/deployment.

- Causal missing-feature RED7fail/7controls; UI priority RED8fail/17controls;
  display RED8fail/26controls. Fixture mistakes are retained separately and
  corrected without source-rule changes or weaker assertions.
- Integrated engine5343/155files, UI59/4files and wave/factory39/4files pass.
  Tests cover ranked real hero/merc casts, payment/cooldown/target/status/tags,
  legal learned maxima, aliases/prerequisites/caps, no forged Redemption,
  RNG-free Redemption, actual equip/removal, frozen replay, next-wave
  rank/order/weapon refresh and preserved HP/MP/status/cooldown/carry.
- First standard full `npm test` alone:11004pass/23fail/2existing opt-in skips,
  407files,466.56s,exit1. BUG132 preserves286historical non-item rows plus one
  item row and literal en/zh Redemption cast names. BUG133 updates the governed
  canonical select/explicit empty weapon expectations while retaining every
  replay/ownership assertion and adding learned-allocation checks. Corrected
  compatibility145/3files pass. No tests/limits/skips were weakened.
- Four unchanged timeout cases reduce to passing isolated files:entry-order file13,
  24merc-equipment and1restored-mode tests. The later full attempt retains
  11026pass/1module-entry timeout/2existing skips in287.59s. These failed
  outcomes are preserved; isolated passes did not certify the full gate.
- Final typecheck, lint, explicit browser-test scoped lint, production build
  and4-chunk/five-pattern test-bridge scan pass. Existing bundle/PWA warnings
  remain, including the2.57MB asset manifest outside precache limits.
- Vitest1.6.1 creates its shared pool from root configuration. The prior UI
  project maxThreads4 did not bound it; move minThreads1/maxThreads4 to root.
  Diagnostic lifecycle observation confirms max4online/final0 workers across
  five files/346tests,18.80s. Technical-director review READY. The standard
  final run has no observer/preload: `npm test` passes407files/11027tests with
  two existing opt-in skips,340.55s,terminal exit0 (`full-bounded-final.log`).
  Final typecheck/lint also pass with the corrected pool configuration. The
  15s full-test budget remains unmet; a complete per-timeout CPU profile is
  not established. No isolation, discovery, timeout, assertions, skips or
  coverage thresholds were weakened.
- Production en360×640 pilot passes; final en/zh-CN×360×640,412×915,640×360,
  1280×800,1920×1080 matrix passes10/10,zero retries/skips/flaky/errors.
  Prepared Paladin70 and hired Rogue inspect/equip the four actual words;
  priorities append without allocation or automatic storage mutation, explicit
  edits persist, removed grants remain dormant. Phoenix hero Continue, transfer
  to merc/reorder/Continue and removal/dormant/Continue use ordinary UI.
  All40 attached JSON saves are independently audited for exact participating
  state, four unique items and learned allocation. Browser combat, earned
  acquisition and crafting are not claimed. Priority screenshots show partial
  scrollable editors, not every row simultaneously.
- Independent browser evidence review ADEQUATE for this prepared-character
  proof:10passes/40saves, ordinary actions and three screenshot attachment
  matches checked. Reviewer did not independently reread live source hashes or
  run full unit/browser tests. Root's final audit verifies1055source hashes
  unchanged through the final full run. Since the browser, only the two
  test-runner configs changed; runtime/data/UI/harness did not. All760 build
  hashes matched before staging cleanup. Reports retain embedded attachments.
  See `matrix-browser-report.json`, `browser-save-audit.json`,
  `browser-evidence-review.txt`, `final-source-audit.json` and cleanup records.
- Independent frozen source review CLEAR for all four integrations, and
  follow-up CLEAR for the three compatibility-test corrections. These are
  source/test reviews without reviewer-run tests or browser/full-head claims.

Constructed browser fixtures do not establish earned materials→craft→equip→
fight→Continue, an earned ActII–V clear,213-skill completion, endgame or
30–50-hour pacing. Those remain required parts of the unchanged full goal.
