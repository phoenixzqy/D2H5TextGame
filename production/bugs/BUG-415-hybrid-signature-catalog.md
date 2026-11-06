# BUG-415 — Generic fillers suppress hybrid monster actions

Status: bounded four-row source repair implemented and verified locally;
earned campaign/balance and listed identity/payload gaps remain open.
Severity: High. Owners: content-designer/engine-dev, game-designer/QA.
Environment: HEADb5a0898+private-v1 local work, Node24.21.0; deterministic
native engine, locale/viewport independent; factory7/battle13.

Reproduce: build Infidel/SaberCat/ThornedHulk/FrozenTerror from bundled JSON,
load default registry, run against passive unmitigated tank. Infidel, Saber
and Hulk repeatedly select generic CD1melee, suppressing Charge/Enrage,
LeapAttack and Thorns marker. Frozen uses FrostAura but fills its gaps with
generic StrongMelee. All four lack explicit ordinary attack/growth pairs.

Expected: preserve native signatures/order, expose ordinary cooldown gaps and
adopt provisional heavy/agile curves from P15-hybrid-signature-family-v1.
Actual: generic fixed attacks hide signatures and ordinary role progression.
Cause: shared BUG087 action-source/data-authoring gap; fix authored data, not
the selector. Existing Enrage/Thorns markers lack their intended effects,
FrostAura is active cold+Chill, and SaberCat has no native ranged fallback.
These mechanics/identity defects remain separate; this bounded change makes
no claim to repair them or accept earned campaign/balance.

Native RED, frozen matched evidence and final validation follow.


Initial19case RED:17intended failures/2passing native controls,9.227s. Added
seven Hulk challenge cases initially looked up generated challenge wave.id
using authored wN; allseven failed fixture lookup. Correct to source.waveId.
Context-red-v2:24intended numeric/list/ordinary failures and2passing controls,
9.023s; complete Hulk/native Frozen source/roster assertions reach intended
curve failures. Initial strict types/scoped lint PASS; external harness staticv1
has0diagnostics. Older Frozen priority oracle now expects ordinary/null in its
cooldown gap while retaining damage/status/endpoint/replay assertions.

Preflight found the external unchanged Disfigured control metadata incorrectly
copied40/+6.25 rather than actual32/+5; corrected harness/specs before any arm.
No production control was changed. Frozen recipe will capture the corrected
source after independent read-back approval.

Independent corrected preflight APPROVE; priority-red-v1 has1intendedFrozen
failure/1unchangedBloodLord control (7.989s). External staticv2 PASS before
freeze. Driver/recipe now frozen for single genuine baseline/candidate/compare.


## Final bounded result

Four lists/pairs adopted exactly as designed. Final26native cases pin actual
signatures, ordinary damage, ManaBurn, all seven Hulk challenge sources and
Frozen boss/Throne/L90 integration. The first green run exposed a test fixture
omission of existing ChillPhysicalx1.1; expected literal109/119 now preserves
positive119combo and actual ManaBurn109 controls. Green-v2:323PASS/4files;
final affected789PASS/17files, strict types8.723s/scoped lint10.804s PASS.
Independent implementation QA APPROVE; evidence audit found no material errors.

Frozen2200fights/arm:240wins/361defeats/1599draws→239/1961/0. All600unchanged
controls exact; selected generic actions39996→0, active21191→6950,
ordinary3303→9605. Material threat increase; no balance signoff. Source/recipe/
raw/hash/parity/owned-process/cache checks pass; no disposable live processes.
Inventory78authored/33pending, all111numeric acceptances unaccepted. Full cells,
failures, hashes and limits: [evidence](../../docs/plans/evidence/p15-hybrid-signature-family.md).
