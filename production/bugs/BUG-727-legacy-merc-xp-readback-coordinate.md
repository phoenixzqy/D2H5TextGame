# BUG-727 — Distinguish mercenary XP grants from observed coordinate deltas

- Severity: Medium (retained-output verifier).
- Status: Locally fixed in retained V3 reader; no commit/production edit.
- Owner: root / QA tooling; no production change.
- Environment/build: WSL Python reader, `feat/playable-foundations` uncommitted private-v1 worktree. Browser/viewport/locale not applicable; no new combat seeds.

## Reproduction and evidence

1. Run frozen `reader-v2.py` in `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-zeal-act4-remaining-g9z4__7p` over unchanged native output.
2. Observe terminal mercenary level assertion failure; `readback-attempt2.log` and `.json` retain exit 1.

Expected: consume Prayer's explicit saved L31 threshold 4,873,191 before using the current polynomial curve, verifying each native XP grant and observed delta.

Actual: the verifier adds `earnedDelta.mercXp` to saved experience as though it were credited XP. `earned-state.ts:115` defines that observation as the difference between current-curve cumulative coordinates. At a legacy-threshold transition it differs from credited XP by the historical cost adjustment.

## Root cause and correction

`mercStore.ts:337` preserves the explicit saved threshold; BUG709 and its existing regression case specify this behavior. Production share is floor(75% of each awarded hero-XP bundle). V3 must derive every credited bundle, consume the saved threshold, calculate each subsequent authored threshold, compare each observed coordinate delta and the complete final progress, and retain separate credited/coordinate totals. The unfielded Rogue must stay exact. Preserve both prior readers/failures and all native outputs; no gameplay replay or production change.

Regression coverage: existing `src/stores/mercStore.test.ts` case `preserves a legacy threshold until consumed, then carries XP into the new curve (BUG-709)`, plus the unchanged retained native output that exposes this reader error.

Validation: `remaining-readback-v3.json` passes over unchanged native output; frozen reader SHA256 `d5053c1293e597f202cf08e3be34274ae99b302d710bc34b0023171b51a12e6b`. Original negative cases remain. See [qualified Act IV evidence](../../docs/plans/evidence/p15-zeal-earned-act4-completion.md).
