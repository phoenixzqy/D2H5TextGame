# D09 — Chapter-boss ordinary equipment groups

2026-11-04. Implements `drop-tables.md` §5 under BUG680. Other v1 requirements
remain open. Original real-pool reproduction: all 15 boss/difficulty cases fail;
the existing mixed five-pick table cannot satisfy the ordinary/jewelry counts.

| Boss | Trash-source picks | Jewelry picks | Terminal level cap |
| --- | ---: | ---: | ---: |
| Andariel | 4 | 2 | 59 |
| Duriel | 5 | 3 | 72 |
| Mephisto | 6 | 3 | 87 |
| Diablo | 7 | 3 | 101 |
| Baal | 8 | 4 | 122 |

Replace the configured live chapter boss's mixed TC picks with these two
equipment-only groups, in that order. Trash groups use their act's trash TC,
raising each minimum level by five, literally as §5.1 specifies. Jewelry groups
use the matching jewelry TC without that offset. Both have noDrop0; replacement
sampling and ordinary MF/tier rarity probabilities apply. Trash sources already
include some jewelry; those choices remain eligible in the first group.

The source's terminal band alone extends to the explicitly authored boss cap
above, which matches the existing boss table's finite Hell envelope. Earlier
bands retain their upper bounds. This closes the Andariel trash 58/59 gap and
jewelry's Normal-only caps (including Baal's 75/78 gap), without reopening expired
low equipment bands or changing shared raw TC data. Item levels, affix/template
eligibility and material difficulty caps still use the actual live monster level.
No unbounded high-level fallback, level clamping or reroll loop is introduced.

The schema-validated policy is injected with production award pools. Missing,
empty, invalid or ineligible configured sources refuse the complete bag. Wrong
actual acts refuse before RNG. Other tiers, unconfigured tables and quest caches
retain their existing paths. Separate rarity guarantees and exact material
bundles still apply; optional unique attempts and first-kill rewards remain open.

These groups intentionally change live boss rewards and their shared random
stream. Do not replay/relabel historical earned evidence. Save format, wishstone
rules and shard formula stay unchanged. Constructed checks earn no campaign,
economy, pacing or balance acceptance.

Implementation plan: add strict schema/data/validated loader and precompilation
registry entry; prepare bounded source groups at award ingress; reuse existing
drop and item materializers; verify exact counts/source boundaries/MF, all actual
planned levels, quest/other-tier isolation and atomic native publication. Run
only affected loot/settlement checks, scoped types/lint and an isolated production
build/precache scan. Retain original failures and remove exact disposable output.

Plan review: **ready**. Finite terminal-band extension addresses actual source
eligibility; mixed materials are excluded instead of duplicating income; source
immutability, non-boss paths, failures and runtime schema packaging are covered.
Security check: **pass**. Local authored loot only; no new dependencies, network,
permissions, external execution or persistence contract. Proceed in the existing
claimed worktree, preserving inherited changes; no commit/push/publication.
