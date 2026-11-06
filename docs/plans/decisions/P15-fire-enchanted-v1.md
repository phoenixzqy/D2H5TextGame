# P15 — Fire Enchanted

2026-11-05; BUG786. Monster-spec §9 requires a distinct Fire Enchanted
modifier. Preserve Extra Fire Damage and its active Fire Ball; append
`elite-affix/fire-enchanted` with +50 percentage points fire resistance,
using the existing 75 cap after rare-tier bonuses.

Author `monster-fire-enchanted-explosion` as on-death, all-enemies, zero MP/CD,
fixed 50 base fire damage. No Attack scaling, Ignite or corpse payment.
Ordinary spell dodge, critical hits, mitigation and absorption apply.

Reuse the private native Doll death transaction. After effective starting IDs
settle, capture original living, unowned hostile monsters whose marker resolves
to the exact frozen native skill. Shared-affix rare minions qualify. Bind each
native payload once; a Fire Enchanted Doll retains both independent explosions.
Replaced skills, initially dead/friendly/owned/orphan-only/later entrants cannot
gain authority. Authentic Conversion suppresses hostile bursts; a fabricated
status alone does not. Close simultaneous deaths before bursts and preserve
nested FIFO recovery/corpse tails and sticky hero defeat. Both skill aliases
remain excluded from active selection even if the registry is replaced.

No new combat formula, RNG draw, save field or migration. Security check: pass;
local engine/data/i18n only. Plan review: ready with Doll coexistence and rare
minions explicit. Root self-review only. Verify affected native/schema cases,
scoped strict types/lint and four bilingual mobile/desktop CombatLog fixtures.
No broad suites or spent campaign/pilot/sample/retry budget renewal. See
[verification and limits](../evidence/p15-fire-enchanted.md).
