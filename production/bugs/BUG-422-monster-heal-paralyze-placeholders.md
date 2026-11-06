# BUG-422 — Monster Heal and lightning status payloads are placeholders

Status: fixed locally; numerical/campaign acceptance pending. Severity: high (combat identity).
Environment: HEADb5a0898 + private-v1 work, Node24.21.0.
Reproduce: an injured Cantor with Heal exposed adds heal_self without HP
restoration; LightningBolt/ThunderStorm/Lightning land without promised Paralyze.
Expected: real self healing and finite lightning disruption using the shared
existing consumers. Natural priority may still starve Heal; do not reorder bars.
Actual: Heal is a marker buff, and three elemental native actions omit statuses.

Contract: docs/plans/decisions/P15-monster-heal-lightning-v1.md. Preserve native
direct hits/CD/targets/projectiles and all monster lists/curves; author exact
zeroMP/rank-one JSON. No new engine primitive or save/dependency change.

Resolution: Fixed four authored payloads using existing consumers; no combat primitive/save change.
Full results and limits: docs/plans/evidence/p15-monster-heal-lightning.md.
