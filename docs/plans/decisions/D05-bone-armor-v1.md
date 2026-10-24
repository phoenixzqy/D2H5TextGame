# D05 — Finite personal Bone Armor

Root plan review: ready. Security check: pass. Local deterministic engine, schema,
store and bilingual presentation only; no dependencies, network, permissions, CI,
save-format change or remote action. Independent design/QA and earned balance
acceptance remain open.

The authored passive/self skill unlocks at level1, cap20, with
`scaling.passiveStatsPerLevel.boneArmorAbsorb:12`. Preserve that tuning. This
supersedes the stale fixed100 shield in skills-spec and both locales. Exact
allocation aliases use their maximum valid positive integer once, clamped to cap;
wrong class, missing/malformed ranks and legacy markers supply no shield.

At a fresh area-run entry, the living eligible Necromancer receives one personal
pool of12 per rank (rank20:240), without changing HP, mana, equipment-derived
stats, costs, cooldowns or RNG. The existing full-health challenge-entry policy is
separate. All ordinary incoming direct damage types, RNG-free reflection, Static
Field and pooled periodic damage consume the pool after their existing mitigation.
Damage events report HP damage separately from absorption. Dodge consumes nothing;
absorption does not prevent landed-hit status applications or Frozen Armor contact
retaliation. Reflection based on actual HP lost excludes absorbed damage. Shatter
execution still kills by exhausting shield plus life. Periodic lethal timing must
include shield capacity, retaining exact shared-boundary/death ordering.

This pool lasts until consumed or the run ends. It neither regenerates nor
refreshes between waves; allocation/equipment changes cannot refill it mid-run.
Learning/upgrading/respec affects the next fresh run. Residual statuses carry
normally; explicit replay retains its original input pool and gives no income.
Save/load retains allocation only, with no transient shield or derived HP bonus.

Represent the pool as an immutable copied permanent `bone-armor` status with exact
source binding and `{rank,remaining}` payload. Reject malformed/duplicate payloads,
foreign/dead/nonhero owners and amounts beyond captured authored capacity.
Complete status observations own playback lifetime and remaining amount. Both
locales explain the actual value, run boundary, damage scope and lack of healing;
Skills current/next values and the positive combat chip agree.

Acceptance: causal baseline failure; rank1/10/cap/aliases and invalid sources;
actual direct/periodic/mitigation/dodge/reflection/Shatter/expiry boundaries;
native learning, cross-wave carry, repeated replay and full save roundtrip;
bilingual Skills/combat UI and production desktop/mobile allocation/Continue.
Integrated unit/engine/types/lint/build checks are required. This completes only
Bone Armor's bounded functional path, not Energy Shield or other shield skills.
