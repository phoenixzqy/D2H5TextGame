# BUG-424 — Four monster self buffs are permanent markers without their effects

Status: fixed locally at HEADb5a0898 + uncommitted private-v1 work; authored self-buff repair. Severity: high (combat identity).
Environment: HEADb5a0898 + private-v1 work, Node24.21.0.
Reproduce: expose Enrage/Shout/Teleport/Thorns on their real native consumers.
Expected: finite damage/Defense/magical-dodge/reflection per the adopted contract.
Actual: one permanent marker, no promised stats; Thorns JSON instead describes an
unrelated5–15area attack. Native bars reach several buffs but their effect is absent.

Contract: docs/plans/decisions/P15-monster-self-buffs-v1.md. Preserve all bars,
curves and generic/player buff consumers. Author a bounded private paid-wave
state; bare markers/replaced skills/player copies grant no numeric authority.
No save/dependency/network/CI changes. Numerical/campaign acceptance pending.

Outcome: docs/plans/evidence/p15-monster-self-buffs.md records native/UI/browser/consumer/type/lint and frozen raw comparison. No numerical/campaign signoff.
