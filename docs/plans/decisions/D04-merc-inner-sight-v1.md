# D04 — Starter Rogue Inner Sight

Status: GD/TD contract APPROVE; implementation and scoped validation complete;
producer/QA final whole-source/evidence/packet APPROVE. See P08a07 evidence.
Scope: exact free starter Rogue `mskill-inner-sight`, not Amazon's separate skill,
all mercenary skills, campaign clear or final balance.

Canonical `docs/design/gacha-spec.md` mercenary row specifies25% enemy defense
reduction for8seconds. Actual mercenary skill row supplies active/all-enemies,
CD5seconds, minLevel1/maxLevel20. Adopt explicit defaults: mana0 and flat25%/
8000ms/CD5 across ranks1–20 (no numeric growth source); no star-to-rank plumbing.
Use one distinct `merc-inner-sight` status, not Amazon `inner-sight` or obsolete
self-buff marker `inner_sight`. JSON owns potency/duration and explicit mana.

At every eligible native action, cast on currently living enemies in existing
order without damage/hit/dodge/chance/RNG draws. Recast after CD even if the
status remains active; refresh one record, expiry max(oldExpiry,cast+8000), no
stacking, preserve first active source. Expired/future records are replaced
through existing generic lifecycle. Source death does not dispel; target death
uses ordinary closure. All tiers receive full effect/duration. No spread/aura/
refund/new persistence. Existing status identity/source/clocks suffice.

At the shared active pre-hit damage projection, effectiveDefense is
`max(0, defense*(1-reductionPct/100))`. Keep fractions until existing final floor
and leave authoritative stats intact. Direct physical/fire/poison/thorns use
this ordinary armor path; cold/lightning/arcane keep magicResist. Hit chance,
dodge, resistance, combo multipliers and existing periodic rates are unchanged.
On-hit DoT potency may naturally reflect stronger ordinary direct damage.
Amazon/legacy markers remain inert and do not refresh this status.

Resolve exactly one authored row into a copied immutable definition and skill,
following the existing exact Minor Heal boundary. Reuse the closed skill schema
(statusEffect metadata; percent finite[0,100], positive duration and exact-row
positive cooldown), existing
DebuffEffect.durationMs and generic status engine. No broad importer/framework.
Replace only this stub binding after definition prerequisite and causal RED.

Source-derived oracles (unexecuted):100fixed direct damage/defense20 gives80
ordinary vs85debuffed for armor types. Defense21 projects15.75 and final84;
early flooring would incorrectly give85. Defense0 and minimum1 remain. Factory
Rogue AS122 has1524ms action period: firstcast1524, CDexpiry6524, recast7620,
status expiry9524→15620. Tests must use actual createMercFromDef→mercToCombatUnit
without replacing its skill/loadout/stats. Half-open boundaries, all targets,
rank1/cap, source death, no new RNG, replay/immutability and true no-status
controls discriminate behavior. Ordinary freehire/field/intro UI and localized
status naming/save/reopen follow engine acceptance without a stronger clear retry.

Root owns all edits/execution in the existing claimed worktree. Independent
producer/QA review and exact test freeze precede experiments; representation
missing-import RED is not a gameplay failure. Genuine native runtime RED and
structured bug report precede registry/projection patch. Incremental engine
checks, final full U/coverage/T/L then reader release/build/bridge and relevant
native production browser matrix. Preserve failures and independently review
post-freeze corrections. Durable evidence/review/commit, exact task cleanup and
separate ledger closure. No remote action. Full C0–C4/G0–G7/privatev1 remain open.
