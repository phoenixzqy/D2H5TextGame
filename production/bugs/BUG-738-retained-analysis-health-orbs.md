# BUG-738 — Include health orbs in retained life accounting

- Severity: Medium; the external analysis rejects valid recorded combat.
- Status: Fixed and locally verified in versioned external analysis v2;
  repository base b5a0898806bfba369a2d84a1b6c41d0bbb057fce, no new commit exists.
- Owner: root acting as qa-engineer.
- Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus existing human2 changes.
- Environment: WSL/Python retained-journal analysis; browser, viewport and locale
  are not applicable. Native seed and ordinal remain in the journal.

Reproduction:
1. Read the completed `bow-route-first-v1` packet under
   `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-act2-route-first-02brsjk1`.
2. Its preserved `bow-route-first-v1-analysis-v1.py` fails at line32 in terminal
   tool session46740 (exit1); it created no analysis JSON. Do not replay combat.
3. Inspect ordinal156, wave5: hero starts419HP, receives285 recorded damage and
   160 skill healing, consumes a5% health orb at32870.503ms, and finishes317HP.

Expected: account for the capped health-orb restoration as well as `heal` events.
Actual: the assertion computes419+160−285=294HP, omitting23HP from the orb.
`src/engine/combat/orbs.ts` applies `floor(lifeMax*restorePct)` capped at maximum;
`combat.ts` emits `orb` separately, while `commitHealing` emits actual skill HP.
This is an external analysis defect, not a demonstrated production defect.

Affected systems: root-owned retained-output analysis. Preserve v1 and version
the correction; require ordered event reconciliation and controls rejecting
missing health orbs, changed healing/damage and changed terminal life. Keep the
native journal, save, plan and all paid costs unchanged.

Resolution: `bow-route-first-v1-analysis-v2.py` reconciles ordered damage,
actual skill healing and capped health-orb restoration against final life.
It also verifies the retained report/journal hashes against the passing v2
readback. Terminal exit0,1.224seconds; final life419+160+23−285=317HP, with
minimum268HP. Four controls reject a missing health orb, altered skill healing,
altered damage and altered terminal life. The original failing script remains;
no new gameplay occurs. Analysis SHA256:
`23ff13cb016c900ba124de3422e7b57ebd76c081380d71881a8ec26b180b84b8`.
See [Act II evidence](../../docs/plans/evidence/p15-act2-route-first.md).
