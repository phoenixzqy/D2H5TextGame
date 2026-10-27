# BUG-322 — Keep bounded combat logs readable with touch and scroll-away

Status: Fixed locally in `4d0397d8` and `3b226e8d`; regression, integration, browser validation and evidence retention complete.
Severity: Medium (readability/interaction; combat continues).
Owner: frontend-dev / QA; root owns integration and evidence retention.

## Reproduction

Original runtime `3f96a1d7`; follow-up boundary at `4d0397d8`.
Vitest1.6.1/jsdom with the real CombatScreen and stores; production bundled
Chromium, en/zh-CN, 360×640 through desktop. No combat RNG seed is required.

1. Append through public addLogEntry until the log has200entries, then append
   a replacement that changes its scroll height.
2. Hold multiple local touches, then end/cancel one while entries arrive.
3. Scroll upward and release pointer/touch pause before the queued scroll event.
4. For the review boundary, move only8px upward, release, deliver the delayed
   scroll event, then append another entry while the reader remains away.

Expected: pinned logs follow capped replacements. Hover, local touches and
manual scroll-away pause independently and display the localized generic hint.
An established reader-away state remains paused until the physical bottom;
active input/release must not silently restore the24px following tolerance.

Actual before correction: capped replacements were missed, touch pause was
absent and the hint omitted manual pause. A later source review found that
release cleared gesture state, letting a delayed near-bottom scroll repin.

Workaround before correction: read farther above the bottom and pause combat.
Affected systems: frontend combat presentation; no engine/data/save change.

## Root correction and regression proof

`CombatScreen.log-scroll.test.tsx` exercises the full component and real stores;
only absent jsdom layout geometry is supplied. The actual200entry cap is checked.
Initial seven causal tests fail before correction. Additional mixed-input,
stationary-anchoring, delayed-wheel and native-keyboard regressions precede their
corrections. `4d0397d8` follows the log array, tracks local touch identifiers,
separates pause reasons, preserves reader input intent, disables native scroll
anchoring on this managed container, and supplies its localized accessible name
and keyboard focus indication. Original failed and interrupted attempts remain
in the retained raw archive; partial checks are not passes.

Independent read-only review then finds the8px release boundary. Eight new tests
fail after delayed touchend/cancel and mouse/pen pointerup/out/cancel, with26
controls passing (original20939 terminal1/consumed;13.75s Vitest). The minimal
shared predicate in `3b226e8d` requires distance≤1px when already unpinned,
including after release clears gesture. Original66455 terminal0/consumed passes
34/34 (14.58s Vitest,15.774s wrapper). Both frozen1812input/HEAD checks are exact;
only the source predicate/comment changes between RED and GREEN. Each new case
also verifies later entries preserve position and physical-bottom return resumes.

Independent source re-review approves `3b226e8d` with no findings, resolving the
previousP2. That reviewer ran no tests, builds or browser QA; runtime results are
separate evidence, not independent runtime acceptance.

## Browser geometry counterexample

The new continuously timed native8px check initially fails because row replacement
shrinks the container before pointerleave: the trace moves from scrollTop8703 /
distance8 to scrollTop8691 / distance0. Requiring positive distance after native
height clamping rejects the physical-bottom resume contract. The original failed
driver, screenshot, DOM and trace are retained. Independent read-only source/spec
analysis agrees with this interpretation; it is not independent runtime QA.

The same production build now uses ordinary public combat Pause to stabilize
geometry for the native8px release check, then resumes live rows. Existing full
continuous-timer mouse/wheel/keyboard/touch assertions remain. Synthetic component
regressions prove delayed-event ordering; native ordering is claimed only where
the actual recorded trace establishes it. Final browser12078 finishes0/consumed:10/10 cases pass, both locales × five
required sizes,300.757s, zero page/console errors or retries, source and genuine
input unchanged. Seven representative screenshots are individually viewed;
whole-app localization/a11y/physical-device acceptance remains open.

## Integration validation and retention

Previous `4d0397d8` exact-source integration:19961passing/941files/two existing
opt-in skips; full types/lint/build and10locale/size native cases pass. This does
not validate the follow-up predicate. Current `3b226e8d` freezes2694inputs;
production build and unchanged five-regex bridge guard pass (six JS chunks,
23.033s), and full typecheck passes181.621s. Lint/purity17603 finishes0/consumed334.408s; current native browser10/10 passes.
Original full-unit18391 finishes0/consumed:19969 passing tests across941files,
two existing opt-in skips (EARNED_ECONOMY/EARNED_NATIVE_CONTINUATION),1518.59s
Vitest/1520.813s wrapper. All2694 frozen inputs and execution HEAD stay exact
through the checks. The configured test-time budget remains exceeded.

All947 validation archive members (930files/17directories including the root)
pass streamed readback and original-file hash verification before exact cleanup.
Remaining[]/failures[] and raw-root absence are verified. Archive SHA256
`20bfcbfa273baf88a328ef08d0067bcdd4b16c46b666d94c8c4608c766ec3134`.
All recorded task PIDs are absent and preview port59319 is closed. The exact
two-file disposable retainer utility and its directory are also removed and
absence verified. Root retains these exact sidecars through independent/full-v1
consumers, then removes them after release:

- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-log-release-validation-9chckk2b-raw.tar.gz`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-log-release-validation-9chckk2b-raw-manifest.json`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-log-release-validation-9chckk2b-retention.json`

The specialist packet is released: all15members/14files/one directory are
archived, read-back/original-hash verified and exactly removed. Remaining[]/
failures[] and raw-root absence are verified. Archive SHA256
`a757869100cedaabb7101e982f11c4530b256167857059b82eabff35c897616c`.
Root retains these exact sidecars through independent/full-v1 consumers:

- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-combat-log-release-_kps_wgs-raw.tar.gz`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-combat-log-release-_kps_wgs-raw-manifest.json`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-combat-log-release-_kps_wgs-retention.json`

Original correction evidence has4974archive members/4876files/98directories
(including root), all streamed/read-back verified and original-file hashes checked
before exact cleanup; remaining[]/failures[] and raw-root absence are verified.
Root retains these exact sidecars through independent/full-v1 consumers, then
removes them after release:

- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-combat-log-h1uy0hmu-raw.tar.gz`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-combat-log-h1uy0hmu-raw-manifest.json`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-combat-log-h1uy0hmu-retention.json`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-combat-log-h1uy0hmu-retainer-interruption.json`

The original quadratic retainer65632 was interrupted130 before deletion; it is
not a pass. Indexed recovery85826 terminal0/consumed reuses the closed archive,
verifies every member and source file, then removes only exact owned members.
Recovery scratch is removed. Archive SHA256
`231cb88aed238c38f0eaec6e5d3075bac5d504bdf274de6bc9607c09b849697c`.

## Acceptance

The full-unit integration and validation-packet retention are complete. Original
failures, source/input freezes and seven inspected browser screenshots remain in
verified archives; exact released task outputs are cleaned. The200entry cap,
bilingual generic hint, native keyboard behavior, combat and save contracts are
preserved. Browser copies are diagnostic only. This local resolution cannot establish
whole-app G5, physical-device/screen-reader/contrast QA, timing budgets or fullv1.
