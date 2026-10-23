# D10 Exile — equipped self-only Defiance adaptation

Local runtime checkpoint `2dd0865`, final source/test checkpoint `a2b008c`
(base `0456f35`); full v1 remains open.
Contract: `../decisions/D10-material-economy-v1.md`, approved runeword adaptations.
This increment implements Exile only; the other nine adaptations are still open.

## Behavior

Validated word data supplies rank5/+20% defense. The canonical grant resolver
requires a completed valid word in the authoritative matching equipped slot and
selects the highest rank for duplicate named sources. Item flags, actor mirrors,
bag/stash/quarantine and unknown map keys confer no grant ownership.

Hero defense multiplies after ordinary flat equipment and before existing Iron
Skin; mercenary defense multiplies the saved growth baseline plus the ordinary
gear delta. Neither path floors the grant result, accumulates it on recomposition,
heals carried HP/MP, learns a skill, or persists a separate grant cache. An
identifiable equipped native19 Exile repairs only the old defense cache at decode;
all unrelated historical caches and resources stay exact.

Equipment projects at each new wave and stays frozen for playback. The original
run-bound mercenary uses current owned equipment, or a separate captured bare
baseline if removed. Existing alive carry alone is updated and HP/MP clamp to
new maxima. BUG126 records dismissal/removal reproduction and correction.

Bilingual item tooltip and details explicitly describe the self-only defense
effect, and ordinary equipment comparisons use the same derived composition.

## Validation

Evidence root:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-exile-grant-8gn5xy3v`.

- Engine behavior RED preceded implementation (`exile-red.log`), followed by
  the initial engine run5247/147 passing before added cache/damage coverage.
- Cache/display RED and next-wave RED are retained separately. The subsequent
  engine attempt has5249 passing and one5000ms timeout in an unchanged merc
  zero-delta test; it is not claimed as a passing gate.
- BUG126 RED:2 failures/21 passing controls. Correction:38/3 passing including
  original Might identity/death lifecycle controls. Independent residual source
  review CLEAR; no tests run by reviewer.
- Corrected source typecheck/lint/clean production build pass (`exile-types-current.log`,
  `exile-lint-current.log`, `exile-build-clean.log`). The two lint iteration-style
  attempts remain logged; assertions were unchanged. Bridge scan has no forbidden
  tokens in4JavaScript chunks. Clean build manifest has760files; the preceding
  nonempty output had2stale chunks and was replaced only within the owned build.
- Corrected production en360×640 pilot1/1 passes in13.8s, including two exact
  equipped/removed Save-close-new-page-Continue barriers. Initial harness attempts
  expected a literal rather than unrounded481×1.2 and sought a nonexistent nav
  link rather than using the actual Character HUD; both were test errors and
  retained separately. Genuine detail width332/328px failure was diagnosed to
  the Close button's negative right margin (BUG127); corrected pilot preserves
  its44px hit target and passes the same strict layout assertion.
- The initial10/10 Exile matrix passed functional equality, but residual review
  identified an inherited Continue helper gap: new pages navigated at1280×720
  before caller-side resizing/listener setup, and the final page was unobserved.
  An explicit360×640 assertion reproduced this defect (BUG128). The historical
  matrix is preserved in `exile-browser-before-startup-fix-report.json`; it does
  not establish named-viewport Continue startup or absence of startup errors.
- Both Exile and crafting helpers now attach listeners, set the requested viewport
  and assert it before navigation, including both final reopened pages. Corrected
  production `production/browser-report.json`:12/12 pass in161.47s, comprising
  Exile en/zh×360×640,412×915,640×360,1280×800,1920×1080 and crafting en/zh360×640.
  Zero retries, skips, flaky/unexpected results or report errors. Every case
  asserts empty observed page errors and console errors/warnings. Both exact
  Save-close-Continue barriers and strict layout/44px assertions remain.
- Root checked all36 JSON input/continued-save attachments; Exile exports retain
  exact481×1.2 equipped defense,197 removed defense and13HP/17MP. Crafting ordinal
  progression remains7→10. Audits: `exile-browser-final-audit.json` and
  `exile-browser-save-audit.json`. Independent read-only QA independently checked
  raw results/exports and returned CLEAR for scoped BUG127/128 closure.
- Visual en/zh360×640 screenshots show the upper scrollable item inspection and
  usable Close controls. They do not show every effect line simultaneously;
  functional text/layout assertions cover the remainder. No manual screen-reader
  or performance acceptance is claimed.
- Final source/test typecheck and lint pass (`exile-types-final-quiet.log`,
  `exile-lint-final-quiet.log`). Added actual bare/geared-owner summon equality
  controls for skeleton, clay golem and Valkyrie; no summon runtime change.
- Final standard `npm run test:engine`, run alone after browser/type/lint commands
  finished:148 files /5251 tests pass in43.48s (`exile-engine-quiet.log`, exit0).
- Final standard `npm test`, run alone after all other task validation jobs
  finished:394 files /10868 tests pass /2 existing skips in351.82s
  (`exile-full-unit-quiet.log`, exit0). No assertions, timeouts, discovery rules
  or tests were weakened. The earlier overlapping timeout remains diagnostic
  evidence; BUG125's underlying timing diagnosis is still open.

Dedicated production browser command (not the global PWA allowlist):

```sh
CRAFTING_UI_ROOT=/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-exile-grant-8gn5xy3v/production \
PWA_PORT=4479 npm exec playwright test -- \
  --config tests/pwa/crafting.config.ts --grep 'Exile|all material.*360x640'
```

The final source freeze includes822 inputs (`exile-final-source-freeze.json`),
including both browser specs and their shared helpers. The clean760-file build
remains byte-identical; only tests/docs changed after that production build.

The declared constructed Exile browser fixture proves functional import,
equipment/comparison and persistence only. It cannot establish earned material
acquisition, earned campaign progress, encounter balance or release readiness.
Earned ActII–V, complete213-skill behavior, endgame,30–50 active-hour pacing and
remaining C/G gates stay open. No push, PR, merge or deployment is claimed.

Root retains59 exact task-owned evidence files under the evidence root above
for ongoing full-v1 integration and earned-proof consumers; root will remove
them after those consumers finish. `exile-artifact-index.json` lists every
retained path and ownership. `exile-validation-checkpoint.json` records the
commits and terminal checks.

After all owning processes and reviewer consumers finished, the exact disposable
`production/dist` and `production/browser` paths under that root were removed
and verified absent. `exile-cleanup.json` records zero822-input source drift,
zero760-file build drift and no live task processes before removal. An initial
cleanup guard stopped before deletion because twelve empty Playwright case
directories remained; every path was inspected, then only those empty scratch
directories and passed metadata were removed with the owned build. No cleanup
failure remains. Shared caches and the claimed worktree remain for the ongoing
umbrella goal; no source, Git history or diagnostic evidence was discarded.
