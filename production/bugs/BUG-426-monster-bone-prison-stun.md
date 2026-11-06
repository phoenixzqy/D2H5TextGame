# BUG-426 — Monster Bone Prison applies Stun and leaves dodge intact

Status: fixed locally at HEADb5a0898 + uncommitted private-v1 work. Severity: high (combat identity).
Environment: HEADb5a0898 + private-v1 work, Node24.21.0; pure engine.
Reproduction: seed13 real BoneAsh/Diablo single-prison probes; native registry
has10–20Arcane/CD4/single-enemy/zeroMP plus genericStun. Locale promises no dodge.
Expected: landed native hit applies dedicated source-owned2000ms prison;
actions/channels lock and physical/magical dodge pools become0, normal85%accuracy
retained. Actual: genericStun, ordinary dodge remains. No viewport/locale dependency.
Evidence: aliases.ts monster.bone_prison definition; forthcoming native RED log.
Affected systems: engine-dev/content-designer/writer/qa-engineer.
Contract: docs/plans/decisions/P15-monster-bone-prison-v1.md. Preserve native
bar/order/range/CD/delivery and separate playerPrison/globalStun behavior.

Outcome: docs/plans/evidence/p15-monster-bone-prison.md records native/UI/browser/consumer/type/lint and exact frozen diagnostic. No numerical/campaign signoff.
