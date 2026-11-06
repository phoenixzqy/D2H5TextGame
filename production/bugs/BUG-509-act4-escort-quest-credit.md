# BUG-509 — Match Act IV quest victory roles to the authored encounter

Status: fixed locally, uncommitted; new native proof/claim acceptance passed.
Severity: High, blocks Fallen Angel quest claim.
Owner: engine-dev; root executes locally. Environment: WSL, Node24;
feat/playable-foundations, base b5a0898806bfba369a2d84a1b6c41d0bbb057fce.
Browser/viewport/locale: not applicable to deterministic native store evidence.
Run seed1666473292; ordinal882/index4. Exact wave seed retained in the fixture.

Reproduction:
1. Resume earned Double Throw35/next882/35actions after BUG507 corrected
   Izual's ordinary escort roles and BUG508 corrected driver policy timing.
2. Natively clear all five Plains waves. Actual boss recording has only
   barbarian.double_throw. Izual and both original ordinary guards die;
   original hero survives173.89HP/44MP at44187.569ms.
3. Attempt Fallen Angel claim. It returns not-completed; no Izual proof exists.
4. captureAct4Encounter rejects the original trash-tier guards because its
   shared tier variable requires boss for every non-chapter encounter member.
   hasOriginalAct4Victory independently repeats the same incorrect assumption.

Expected: the exact authored one-boss/two-trash encounter, with all original
members dead and original living hero in an accepted native victory, grants
the existing Fallen Angel objective/proof. Invalid identities, tiers, partial
kills, replacements and untracked victories must still be rejected.
Actual: the real clear awards ordinary loot/XP/area clear but no quest credit.
Root cause: quest authority hardcodes one role for every member; BUG507's data
correction exposed this stale assumption. Preserve Hephasto/Diablo's existing
roles, original-member authority, eligibility, save schema and reward rules.

Evidence packet:
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1
- p15-barbarian-double-throw-izual-continuation-v2.json and.raw.jsonl.gz:
  actual five-wave victory, refused claim, exact successor and inline audits.
- p15-barbarian-next-plains-policy-v2.json: independently predicted identical
  per-wave resources/timing, including the actual882 boss victory.
- Repository regression/fixture paths will be recorded after focused validation.

Preserved successor: level35/120991XP/next883/36canonical actions; the36th
entry is the refused claim and must remain in lineage.49new items and107native
salvage removals/27470XP stay earned. Never manufacture the missing proof or
repeat paid preparation/Starts. A new accepted native victory on corrected
source may be required by the existing pre-event proof contract.

Security check: pass. Finite per-member role validation at the existing native
admission/settlement boundary; no weakened identity/eligibility checks, save
grants, credentials, CI, permissions, network writes or deployment.

Fix: ACT4_ENCOUNTERS now declares immutable per-member tiers, checked both
when capturing the original encounter and validating its final dead members.
Izual is boss/trash/trash; Hephasto retains four boss members and Diablo retains
one chapter-boss. Original source, identity, multiplicity, living-hero, killed
member and pre-event eligibility checks remain enforced. No save grant or schema
change. The existing engine test fixture now uses each authored member role
instead of constructing Izual's ordinary guards as bosses.

Regression: src/engine/map/act4-izual-credit.test.ts, using the exact native882
fixture at src/engine/combat/fixtures/act4-izual-quest-credit.json. Reconstructs
the original enemies without replaying combat, accepts the actual retained
victory, rejects substituted boss guards both at input and final settlement,
and rejects living/replaced/duplicate/missing guards. Red:4cases/3failures.
Green:41/41 across this regression, engine/map/act4-admission.test.ts and
stores/act4-admission.test.ts. Includes native quest publication, duplicate
refusal, source binding/replay and rollback. Scoped strict types and exact-file
lint pass. Earlier acts, completed campaigns and broad suites were not rerun.

Retain the exact old-source882 earned successor; it still has no Izual proof.
The engine correction does not retroactively grant one. Before a new native
continuation, its auditor must explicitly support resuming the retained no-op
refused claim; the current fixed-route auditor only accepts terminal failures.
Do not launch prepared v6 continuation until that verified audit path exists.

Subsequent native acceptance: after BUG510 verified refusal-resume accounting,
p15-barbarian-double-throw-izual-proof-v1.json admits exact35/next883 once. All
five Plains waves win; Izual dies with738.89HP/154MP remaining at28.509s. The
new original victory grants Izual proof and Fallen Angel Claim succeeds while
the old refused action remains in full history. River884 then clears, awards
original Hephasto proof, recovers hammer, consumes Soulstone through Shatter
and Claims Hellforge. Chaos885 W1–W5 win, W6 defeats; Diablo not reached.
Full inline quest/economy/export audits pass, including resumedRefusals1 and
one Izual/Hephasto proof each. Current35/221361XP/next886/45action successor
supersedes the old frontier. Do not replay Plains, River, Claims, seals, Starts
or paid preparation. Preserve the earlier missing-proof save as history.
