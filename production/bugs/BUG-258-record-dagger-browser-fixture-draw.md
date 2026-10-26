# BUG-258 — Record the Dagger browser fixture's actual draw

Status: fixed locally in `56da8adc`; final production4/4 passes with explicit draw/no-victory.
Severity: Medium — a new acceptance fixture incorrectly assumes a full-area win.
Date: 2026-10-26. Root author only; independent acceptance remains open.

## Reproduction

- Source: `ea7c43f3`, plus the two new uncommitted Dagger browser paths.
- Build: official production build of `be7195f6`; subsequent source edits are
  test-only. The bridge check passes and all762build files were preserved.
- Browser: Playwright Chromium,1280×800 desktop, English, fresh isolated context.
- Recipe: public character creation, explicitly synthetic level30/Dagger19,
  one actual allocation to20, huge HP/MP cap, Attack100 and only Dagger slotted.
  The ordinary map UI chooses the production seed; this browser recipe does not
  override or establish a fixed combat seed. No earned character is used.
1. Run `tests/pwa/poison-dagger-acceptance.config.ts` with the task-owned build.
2. Import/equip through public controls and enter Catacombs.
3. Observe the real Dagger cast, enemy Poison chip and positive enemy periodic
   damage. Then wait for the fixture's assumed `victory-panel`.

Expected: the test records the actual outcome of its explicitly synthetic
fixture while proving the D04 public cast/periodic/save/offline requirements.
The D04 contract makes no single-skill Catacombs victory or earned balance claim.

Actual: the browser reaches wave5/6, renders `The battle ends in a draw.` and
provides ordinary Return to map/town controls. No victory panel exists, so the
90s visibility assertion fails. One case failed and three did not run; command
exit1 in116.246s. The page snapshot shows Dagger casts, positive periodic damage
and the draw. The screenshot was individually inspected. No product defect or
winning alternative is established by this synthetic route.

## Evidence and correction plan

Root retains `canonical-public-browser.log`, `public-report.json`, original
spec/config, failure screenshot, page snapshot and full trace under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-poison-dagger-ujbpvvn4`.
Original log SHA256:
`14dde0613d05456fcdfc5851ab598e72dd025d9fde243e3395245caa5815ebf2`.
Root owns retention/read-back and exact cleanup through BUG256/BUG258/full-v1.

Plan review: ready to replace the unsupported win assumption with explicit
draw-heading/no-victory assertions and the real Return to town control. Preserve
all allocation, actual-cast, positive enemy periodic HP, seven-domain save pairs,
activated-service-worker offline and geometry assertions. Keep source data,
fixture equipment, combat, timeouts and retries unchanged. Retain the failed
attempt and run the canonical four cases; never report the draw as a victory.
Full campaign/all-build viability and pacing remain separate open requirements.

Affected systems: new public Dagger acceptance fixture; root owns this local
test correction. No delegation, runtime workaround, campaign replay, reward
injection or scope reduction is authorized by this report.

### Explicit lint scope

The repository lint configuration ignores `tests/pwa/**`. A targeted invocation
initially reports that policy as warnings. An explicit `--no-ignore` invocation
then finds a redundant `?? ''` on DOM Element.textContent in the new spec.
The native/causal/UI source paths have no remaining reported lint errors.
Preserve both lint receipts. After the live browser finishes, remove only that
redundant fallback (Element.textContent is a string), rerun explicit lint and
canonical browser checks, and retain the original browser result separately.

## First corrected browser batch

All four canonical en/zh desktop/mobile cases pass in282.366s with explicit
draw/no-victory and uncleared-area assertions, ordinary Return to town, eight
exact seven-domain save pairs and four actual offline Continues. No fixture,
production source, resource amount, timeout or retry changed. A final run after
removing the redundant DOM fallback and adding saved transient-power absence
remains required; no full-area victory or final acceptance is claimed here.

## Final verification

Frozen `bee044a8` full18100/834/two existing opt-in skips, final types/lint,
explicit PWA lint and final public4/4 pass. Original failures remain retained.
See [current evidence](../../docs/plans/evidence/d04-poison-dagger.md) for exact
results, source/build/save audits and visual limits. Independent/earned/full-v1
acceptance remains open; no runtime or test-limit workaround was introduced.
