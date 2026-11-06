# BUG-511 — Match optional Act V fixture observations to the production observer

Status: fixed locally, uncommitted; corrected fixture8/8pass. Severity: Low, stale test data.
Owner: root / qa-engineer. Environment: WSL, Node24;
feat/playable-foundations, base b5a0898806bfba369a2d84a1b6c41d0bbb057fce.
Browser/locale/viewport/seed: not applicable to constructed accounting fixtures.

Reproduction:
1. Run tests/campaign/act5-main-audit.regression.test.ts explicitly in the
   bounded campaign workspace. Four cases fail with raw action48 versus63.
2. Its fixture appends every ordinary wave to the quest-settlement stream,
   including unchanged Frigid and mandatory Throne guard quest graphs.
3. tests/campaign/quest-settlement.ts:playCampaignQuestWave actually appends
   only changed quest graphs or the explicitly verified repeated Throne proof.
   The auditor intentionally rejects other unchanged settlement entries.

Expected: constructed optional-route evidence follows the production observer's
emission contract. Actual: it synthesizes records that production never emits.
This predates BUG510: the archived before-auditor contains the same unchanged
checkpoint predicate and no refusals occur in these fixtures, so routePosition
equals raw index for every entry. The4failures are not caused by retry mapping.

Fix the fixture producer only: append actual graph changes; retain all area's
ordinal progression and every changed optional/Throne proof. Preserve negative
corruption assertions and the auditor's restricted unchanged-Throne contract.
No game behavior or audit acceptance rule needs changing for this fixture bug.

Evidence: root packet bug510-resume-green-v1.json/log retains77cases,73pass,
4failed; all10new retry cases,27Act IV cases and32minimum Act V cases pass.
Before fixture bytes are retained separately before applying the correction.

Security check: pass. Correct a disclosed constructed fixture to the observed
native emission contract; no test skipping, assertion weakening, forged native
proof, CI change, install, credentials, external write or deployment.

Fix: tests/campaign/act5-main-audit.regression.test.ts uses isDeepStrictEqual
to omit unchanged graph observations, matching playCampaignQuestWave. All
negative corruption assertions and production audit rules remain unchanged.
Retained bug511-main-audit-green-v1.json records8/8pass; scoped types/lint pass.
Only this failed file was rerun; the other69 passing cases were reused.
Before fixture bytes and explicit old/new method bindings are retained in the
root evidence packet. No game-source change or gameplay acceptance replay.
