# BUG-578 — Grant the authored first-clear wishstone reward

- Status: Implemented and verified; full P15 economy acceptance remains open.
- Severity: Medium; the missing non-kill faucet delays recruitment.
- Build: feat/playable-foundations, tree c25592b0ef005eebacaea970b5f9443a153a1fd4aed1881db22976d4896c9636.
- Environment: Node 24.21.0 production settlement; browser/locale not relevant.
- Reproduction: finish all waves of a fresh ordinary Blood Moor run at seed7,
  then repeat with the same seed and spawn ordinal. The difference in wish
  income is zero; no first-clear component is authored or credited.
- Expected: drop-tables §9's five-wish first-clear reward, separate from kill
  income, exactly once per selected difficulty ledger.
- Actual: only kill income; the retained pilot's net wishes equal all wave
  kill wishes, with no first-clear or quest wish contribution.
- Evidence: retained 18-journal currency readback and native source at
  combatHelpers.ts final victory/markCleared boundary. Frozen regression added
  before implementation; this is a constructed wiring fixture, not balance.
- Root cause: native settlement records the clear but has no first-clear
  currency term or authored amount.
- Owners: root as engine/content/QA writer. Contract:
  P15-early-recruitment-budget-v1. No save format change is proposed.
- Fix: required safe-integer JSON amount 5, added to the native final-wave
  reward bag once per frozen Normal/Nightmare/Hell clear ledger. Existing
  clear flags suppress retrospective grants; direct progress writes pay nothing.
- Validation: final/intermediate/repeat/loaded-clear/profile-selection/defeat,
  unsafe-sum and mutate-then-throw rollback checks pass. Optional Countess and
  both endgame modifiers remain outside this faucet.160 distinct affected
  assertions across eleven suites, scoped strict types and explicit lint pass.
  Authority23 and the early-recruitment report retain evidence; no campaign replay.
