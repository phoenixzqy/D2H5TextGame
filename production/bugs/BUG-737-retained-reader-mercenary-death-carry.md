# BUG-737 — Retained reader must account for mercenary death carry

- Severity: Medium; rejects valid evidence, no demonstrated production defect.
- Status: Fixed and locally verified in versioned external reader v2; repository
  base b5a0898806bfba369a2d84a1b6c41d0bbb057fce, no new commit exists.
- Owner: root acting as qa-engineer.
- Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus existing human2 changes.
- Environment: WSL/Python retained-journal reader; browser, viewport and locale
  not applicable. Native run seed/ordinal are retained in the journal.

Reproduction:
1. Read the completed `bow-route-first-v1` packet under
   `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-act2-route-first-02brsjk1`.
2. Execute its frozen `bow-route-first-v1-readback-v1.py` (already reproduced;
   do not overwrite its original failure receipt).
3. At journal line694, admission120 Lost City wave index4, reader line231 fails
   its unconditional `len(mercs)==1` assertion.

Expected: independently require the selected mercenary at each new admission,
then carry exactly the preceding wave's living mercenary; a recorded death
must prohibit reappearance in later waves of that admission. Actual: reader
requires a mercenary in every wave, contradicting native cross-wave carry.

Evidence: journal line692 retains the Prayer mercenary's life0/death event in
won wave index3. Line694 contains only the surviving hero, who subsequently
loses. `src/stores/combatHelpers.ts` filters dead allies before next-wave carry;
`src/stores/combatHelpers.cross-wave.test.ts` already covers that rule. Original
`bow-route-first-v1-readback.log` and `-readback-exit.json` retain the failure.

Affected systems: external retained-output QA reader, owned by root. Correct
only a versioned reader; preserve plan, v1 reader, gameplay journal and all costs.
Include controls rejecting missing living mercenaries, duplicate/replaced IDs,
unearned revival and absent admission-entry mercenaries. No gameplay replay.

Resolution: `bow-route-first-v1-readback-v2.py` requires the chosen companion at
each admission entry, then carries exactly the preceding living companion with
its recorded life/mana. It also checks final identities and the selected Prayer
flag. Terminal exit0 and `-readback-v2.json` reconcile180waves, including the
single hero-only wave after the recorded death. Seven negative companion-carry
controls and nine admission-accounting controls reject corrupt evidence. Frozen
plan, v1 reader/failure, journal and native successor are preserved. Reader SHA256:
`f8bf83bec17c3c491fde6522a3fde7029b7a2359c3565315f4b6781eb7f1a687`.
See [Act II evidence](../../docs/plans/evidence/p15-act2-route-first.md).
