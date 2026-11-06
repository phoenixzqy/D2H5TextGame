# BUG-418 — Boss casters lack authored ordinary curves

Status: fixed locally; earned numerical/campaign acceptance pending.
Severity: medium; owners engine-dev/content-designer, QA/game-designer.
Environment: HEADb5a0898 + private-v1 local work, Node24.21.0.

Reproduce: build Bishibosh/BoneAsh/DarkElder/Summoner/Mephisto/Diablo/Baal
from native catalog atL12boss. Apply native ManaBurn to expose ordinary actions.
Expected: explicit role-specific ordinary progression; calibrated Blood Raven
basic and chapter overrides keep their independent authority.
Actual: all eight selected rows have no Attack/Growth and inherit legacy32/+5;
caster ordinary139 ignores the already-adopted low-melee13/+2 convention.

Repair/acceptance: P15-boss-caster-numeric-v1; seven low-melee pairs plus
explicit compatibility32/+5 for Blood Raven. All lists/payloads/other fields
stay fixed. This is provisional authoring, not earned numerical acceptance.

Outcome: sixteen arrays authored; final17files/624PASS, strict latest types and
scoped lint PASS. Independent implementation/evidence review APPROVE. Frozen
608fights/arm keeps148/459/1outcomes but materially reduces seven ManaBurn
logged-DPS cells; all have0victories. All96controls identical. Complete evidence:
[bounded result](../../docs/plans/evidence/p15-boss-caster-numeric.md).
