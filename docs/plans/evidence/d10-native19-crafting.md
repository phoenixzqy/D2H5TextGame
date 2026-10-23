# D10 native19 runtime and crafting UI — local implementation evidence

2026-10-23; `feat/playable-foundations`, source/test checkpoint `167aaba`
(base `12607ee`).
This implements a D10 slice. Full v1, C2–C4 and all remaining G0–G7 obligations
remain open. No public deployment, push or pull request is claimed.

## Implemented boundary

- Native19 migration, validation and persistence use ordered mixed socket contents,
  validated v18 quarantine and exact material action receipts/ordinals. Authoritative
  slot ownership rebuilds actor mirrors; unchanged historical caches stay unchanged.
- The live action adapter enforces actual ownership, unlocked progression, costs,
  capacity and reservations under the shared transaction lease. Shared authored
  requirements apply to both hero and mercenary ingress.
- English and Chinese crafting controls expose all nine action families and the
  98 data-backed recipes. Preview and publication use the same deterministic
  service. Retained request identity prevents repeated spending; failed complete
  rollback remains retryable and unverifiable rollback requires save recovery.
- Preview includes canonical plain inserts, completed-word packages, caster affixes,
  destruction warnings, preserved v18 capacity and recorded rune order. Critical
  and dodge ratios display percentages without changing raw values; attack speed
  remains whole points. Empty-save hydration cannot reopen damaged runtime state.
- Target search/paging preserves exact selections; confirmation traps keyboard focus,
  starts on Cancel and restores its opener. v16 quarantine remains inspect-only.

BUG120–124 track the reproduced defects and local corrections. The historical
lineage adapter authenticates exact original bytes and checks allowed empty
additions/mirror reconstruction; pinned hashes, recordings, policies and earned
outcomes were preserved. No original challenge was rerun.

## Validation

Evidence root:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-v19-materials-rh7euwd2`

- Initial complete crafting candidate: `crafting-full-unit.log`, 10825 passed /
  389 files / 2 existing skips, 346.05s; typecheck/lint/build pass.
- Initial production matrix: `crafting-final/browser-report.json`, 10/10 passed,
  English/Chinese × 360×640, 412×915, 640×360, 1280×800, 1920×1080;
  zero retries, skips, unexpected or flaky results. Every case completes ten
  actions and two exact Save → close → new-page Continue barriers. Browser console
  errors/warnings and page errors are asserted empty. Controls are at least 44px
  and document/dialog horizontal overflow is absent.
- Residual reproduction: `crafting-residual-red-corrected.log`, 14 failures /
  47 controls pass. Corrected related run: `crafting-residual-green.log`,
  108 passed / 7 files. Independent read-only residual source review: CLEAR.
- Corrected-source typecheck, lint and production build pass:
  `crafting-types-residual.log`, `crafting-lint-residual.log`,
  `crafting-build-residual.log`.
- Corrected production revalidation: `crafting-residual/browser-report.json`,
  English/Chinese 360×640, 2/2 passed in110.04s with zero retries/skips/flaky/
  unexpected results. Both cases additionally assert Um +5% critical and Eld
  +2% physical dodge previews, cancellation without spending, and all original
  ten actions/exact persistence barriers.
- Corrected full attempt: `crafting-full-unit-current.log`,10841pass/2fail/
  2existing skips across390 files. Both failures are unchanged5000ms import-order
  timeouts in `playerStore.experience-equipment.test.ts`; the unchanged isolated
  file then passes13/13 in2.992s (`crafting-import-order-isolated.log`). BUG125
  records this suspected load-sensitive failure without claiming its cause is
  proven. Final standard `npm test`, run after the other task-owned validation
  jobs finished, passes all390 files /10843 tests /2existing skips in306.02s
  (`crafting-full-unit-quiet.log`, terminal exit0). No tests, assertions,
  timeouts or discovery rules were weakened. The same corrected source/tests
  are committed at `167aaba`; BUG125 timing diagnosis remains open.

Source/build manifests preserve the earlier and corrected candidates separately:
`crafting-source-freeze.json`, `crafting-build-freeze.json`,
`crafting-residual-source-freeze.json` (813 inputs),
`crafting-residual-build-freeze.json` (760 files). Each bridge scan finds zero
forbidden tokens across four emitted JavaScript chunks. Original build drift was
empty before starting corrected validation.

Visual spot checks of the recorded en/zh 360×640 Steel previews and en1280×800
recovery view show readable effects, ordered contents and clear Confirm/Cancel
controls. Corrected en/zh mobile screenshots visibly show `+2%` physical dodge. Screenshots capture scrolled modal content, not the complete flow at
once. This is not manual screen-reader or performance acceptance.

## Limits and remaining work

The browser fixture is explicitly constructed v18 holdings imported through the
ordinary product controls. It proves functional migration/crafting/persistence,
not earned material acquisition, combat usefulness or campaign balance. The ten
approved runeword adaptations remain unimplemented in combat. Earned ActII remains
stopped at the retained Radament draw/Rocky Waste defeat. Prepared-character
ActsIII–V evidence does not establish earned campaign completion.

Full 213-skill verification, earned materials → craft → equip → fight → Continue,
endgame, 30–50 active-hour pacing and complete release gates remain open. Build
warnings for existing large bundles and the 2.57MB generated asset manifest's
precache exclusion remain; no performance or offline-completeness claim follows.

## Artifact ownership

Root retains diagnostic logs, frozen manifests, embedded input/continued saves and
screenshots under the exact evidence root above for the ongoing v1 task. These
remain root-owned until their integration/earned-proof consumers finish. Disposable
builds `crafting-final/dist` and `crafting-residual/dist` were removed only after
both owning browser processes and build commands finished. `crafting-cleanup.json`
records exact paths, zero source/build drift and verified absence. No disposable
build remains. Empty Playwright scratch trees `pilot-browser`,
`crafting-final/browser` and `crafting-residual/browser` were also verified to
contain only passed `.last-run.json` metadata and removed after their consumers
finished. The sibling browser JSON reports preserve all embedded evidence.
Shared caches and the claimed worktree are retained; root will
remove retained diagnostic evidence after the ongoing consumers finish.
