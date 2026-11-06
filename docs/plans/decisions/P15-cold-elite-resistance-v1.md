# P15 — Cold Enchanted resistance repair

2026-11-05. Tweak implementing monster-spec §9's existing **+50% cold resist**.
Root sole implementer/self-reviewer; BUG784 retains two native causal REDs.
This changes resistance, not the skill/cadence or affix selection policy.

## Contract

Add optional sparse `resistanceBonuses` to elite-affix data and monster factory
options. Each of the six existing resistance keys accepts finite0..100 percentage
points; unknown keys/types are rejected. Cold Enchanted authors `{cold:50}`;
other current affixes omit the field. Missing/empty bonuses mean zero.
The selected metadata is authoritative, not an affix ID/name or Frost Nova skill.

Native construction forwards this metadata only for actual affix carriers.
For each type, compute `clamp(base + rareAllBonus + affixBonus, -100, 75)` once.
Factory rejects invalid supplied bonuses before consuming RNG. Preserve IDs,
life/attack/defense/MR/speed, skill order, inputs and RNG consumption. Ordinary
Frost Nova users receive no bonus; the rare all-type bonus still applies once
and only to the rare leader under the existing native policy.

No save field/migration, new skill/status/UI, spawn/cardinality/rate/reward
change or D07 Lightning resistance change. The old Frost Aura requirement is
not satisfied by this resistance repair and remains open; current Frost Nova
continues. Magic Resistant has no supported coefficient and is outside this delta.

## Verification and limits

Two causal REDs must become GREEN. Focused controls cover actual cold damage,
base vulnerability/rare addition/cap, sparse/default/custom metadata, rejected
values before RNG, deterministic/input-preserving construction, and actual
manual/idle Den/Rocky Waste plans affecting exactly affix carriers. Validate
the actual strict schema and affected factory/speed consumers; scoped types/lint
and bounded en/zh Chromium mobile/desktop runtime proof. No broad suite,
completed campaign, diagnostic budget renewal, earned progression, statistical
balance or30–50hour pacing credit.

Plan review: ready; the upstream data→consumer→factory channel repairs the
missing defense without per-ID combat exceptions or a global Frost Nova bonus.
Security check: pass; authorized local gameplay work, no credentials/network/
dependency/permissions/CI/save-format/publication changes. Preserve inherited
changes, original checkout read-only, no commit/push/worktree release while the
umbrella goal remains active. Packet ownership/cleanup recorded with BUG784.
