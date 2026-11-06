# BUG-735 — Give monster Charge its user's Attack component

- Severity: Medium; signature loses pressure as monster Attack grows.
- Status: Fixed; affected tests, scoped strict types/lint and desktop/mobile native playback pass.
- Owner: root acting as engine-dev/content-designer/qa-engineer.
- Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus existing worktree changes.
- Environment: WSL/native TS; browser/locale not applicable to retained repro.
- Seeds: retained screen1; constructed regression13.

Reproduce: inspect [retained corrected screen](../../docs/plans/evidence/p15-duriel-corrected-paired-screen.md),
native Duriel Attack220versus Charge60–90,then native `monster-physical.ts` and
closed schema. No combat replay required. Actual: fixed damage ignores Attack,
can become weaker than ordinary attacks. Expected under the
[new design delta](../../docs/plans/decisions/P15-monster-charge-attack-v1.md):
60–90plus100%current Attack before normal mitigation. Earlier fixed-only decisions
are historical; this is an explicit design delta,not a recovered approval.
Root cause: authoring/native adapter/schema,not shared damage arithmetic.
BUG731 remains open for first-clear acquisition/mitigation/challenge balance.

Resolution: JSON authors100%Attack; the closed schema requires finite/nonnegative
Charge tuning while retaining fixed-only exclusions for the other four skills.
The adapter passes it into existing shared arithmetic. Both translation paths
describe the result. [Verification](../../docs/plans/evidence/p15-monster-charge-attack.md):
169 affected cases, final strict types/lint and two native Chromium viewport/
locale checks pass. Initial failed schema/type/lint logs are retained. Synthetic
native probes include early ActI users; no balance acceptance is claimed.
