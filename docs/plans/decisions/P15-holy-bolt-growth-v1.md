# P15 — Holy Bolt damage growth candidate v1

Scope: BUG-535, the unfinished earned Holy Bolt caster campaign. Root is the
sole writer. This is a numerical tuning candidate; final independent balance,
early-rank, all-act and holdout acceptance remain open.

The rank20 native Duriel trace and200 fixed tuning trials demonstrate that the
current primary spell is capped far below the required boss throughput. Keep
the combat pipeline and boss gates. Change only Holy Bolt's authored
`scaling.damagePerLevel` from5 to55. Rank1 stays50–70; rank20 becomes1095–1115
before ordinary resistance, hit/crit and source modifiers. At the earned hero's
cadence, expected capped single-target throughput reaches the existing20–50s
boss band rather than exhausting the60s cap with most boss HP remaining.

This explicitly supersedes only the retained5/rank number in
`D04-paladin-active-attacks-v1.md`; that packet's functional contracts still
apply. Preserve15MP,1s internal cooldown, unlock6, cap20, single-target Arcane,
50% actual-HP-removed self healing, RNG, mitigation, save format and all other
skills. No schema extension or fixed localized damage text is required.

Before: retained native Tomb456, plus100 seeds for each of Hammer-first and
Holy-Bolt-first on the exact native boss input. After: repeat that same fixed
tuning set with only the JSON coefficient changed. Publish wins/deaths/draws
and victorious timing; failed durations do not improve TTK. A fresh whole-area
qualification from the retained earned24/96582/next457 save is mandatory before
retaining further rewards. Do not replay Arcane or any earlier earned content.

The coefficient is a starting candidate, not an accepted full-game balance
result. Large improvement from a failed baseline is intentional; its impact on
early ranks, healing, other acts, gear choices and cross-build pacing must stay
visible in P15. Final fixtures must be frozen before disjoint holdouts.

Author review: small upstream data change addresses capped spell damage;
no per-boss exception, free gear, level injection, skipped test or softened
victory condition. Schema and dynamic previews continue to consume the same
field. Security review: local numeric first-party data only; no new input,
credential, dependency, network, CI, permission or persistence boundary.
