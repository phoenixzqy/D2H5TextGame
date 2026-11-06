# BUG-625 — Retain and reconcile bounded Den acquisition losses

Status: Fixed and verified in working tree (uncommitted). Severity: Medium.
Owner: root (campaign tooling).

## Reproduction

Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, working candidate
`p15-den-acquisition-v2-source.json` in the root-owned external evidence packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/`.
Environment: native Node/Vitest campaign; viewport and locale do not apply.
Creation timestamp: `1793469600000`; native ordinal-derived seeds, no seed override.

1. Select an intended Barbarian with `den-bounded-v1` acquisition and
   `act1-training-v1` recovery.
2. Settle a post-quest Den farming loss and continue within its training bounds.
3. Finish the bounded run and execute the screen recovery audit.

Expected: retain the acquisition interval, cumulative XP, result and interruption;
independently reconcile its actual waves before accounting for its farming losses.

Actual: the route retains helper journal rows but no structured checkpoint. The
native report/screen omit this interval. Both new reports are written, then
`assertCampaignRecovery` fails with `Retained nonwins do not reconcile with
recoveries and terminal stop` (Double Swing 2 vs 1; Double Throw 3 vs 1).

## Evidence and correction

`p15-den-acquisition-native-v1/` retains both reports, logs and full journals.
Double Swing reports `act1-complete`; Double Throw stops at `Den acquisition
retry-limit`. These are provisional until whole-save/journal readback passes.

Retain an interrupted-or-complete checkpoint at the route boundary. Bind the
exact opt-ins/request/interval and reuse `auditCampaignTraining`; only its
verified nonwin ordinals enter the recovery audit. Test missing/tampered evidence,
overlap and technical/budget interruption. Re-audit the existing native journals
without replaying combat, rewriting original reports or weakening assertions.

## Verified result — 2026-11-03

The route retains the request, ordinal/XP interval, helper result and terminal
interruption. `acquisition-audit.ts` requires both opt-ins, claimed quest and a
prior complete living Den clear, binds the entire farming interval, and reuses
`auditCampaignTraining`. The native runner retains its audit; the screen adds
only independently verified acquisition nonwins to existing recovery accounting.

Six checkpoint tests first failed against the original route. Final affected
verification comprises 41 recovery, nine training and 31 recovery-audit cases
(81 distinct cases, with unchanged earlier passes reused), scoped strict types
and explicit six-file lint with zero warnings. Cases cover missing/forged bounds,
intervals, counters, XP/rewards, overlapping recovery, target/stop continuation,
technical/budget interruption and the retry-limit terminal loss.

Independent whole-save/journal readback passes for both original histories.
`bug625-retained-audit.json` then runs final audit code against those histories:
Double Swing's acquisition loss is ordinal 48; Double Throw's are 47–49. Original
recovery assertions still fail, final assertions pass, and missing/forged
checkpoint evidence is rejected. No combat was replayed. Original candidate
reports and failed screen exits remain immutable; this is not a fresh successful
screen execution or population acceptance.

Candidate authority: `p15-den-acquisition-v2-source.json`. Final audit authority:
`bug625-final-source.json`; exactly six campaign paths differ and all 2,149
production/provenance inputs remain unchanged. The retained auditor is terminal;
its exact task-owned Vite cache is removed and verified absent. Root retains
required evidence and the umbrella worktree through review. No commit was created.
