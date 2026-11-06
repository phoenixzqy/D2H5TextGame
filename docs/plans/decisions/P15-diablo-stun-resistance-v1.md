# P15 — Diablo Stun resistance v1

2026-11-05;root,solo. Bounded mechanics implementation for BUG758.

monster-spec§10’s Diablo Stun75%(reduced) means duration reduced by75%, leaving
25%. This specific boss rule takes precedence over combat-formulas§13’s generic
50%boss Stun/Freeze reduction. It is not a75%random rejection roll and does not
multiply an additional0.5. Stun remains accepted; no new application RNG.

Author stunDurationMultiplier0.25 on Diablo, a closed-schema optional coefficient
in(0,1]. Copy the primitive from MonsterDef to wave-local CombatUnit in the
factory. For boss/chapter-boss Stun, authored coefficient replaces the generic
duration multiplier. Timed durations floor positive fractions to≥1ms; legacy
whole-turn rounding remains≥1turn. Refresh retains existing no-stack semantics.
Baal/other bosses retain0.5, Diablo Freeze retains0.5, Chill stays unchanged.
No persisted field/save migration; no base stats, wave/reward or attack changes.

Native manual/idle chapter construction and playback plus focused duration
regressions verify this contract; no campaign replay, exhausted budget renewal,
pacing/balance sign-off or independent/owner acceptance is implied.
