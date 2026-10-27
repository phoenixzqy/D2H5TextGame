# BUG-297 — Register authored Ice Shard and Frozen Orb missile skills

Status: Reproduced; source correction pending.
Severity: Medium — authored missile IDs fall through to ordinary Physical basics.
Affected systems: engine-dev,content-designer,qa-engineer.

## Reproduction
Build:ff9bbc21f256463044dfaacd9e63712aebdef4dc, native Vitest/Node registry,
locale-independent, no browser viewport. Seed7 applies to linked impact probes;
lookup itself has no RNG.
1. Reset/load the actual default registry.
2. Look up all13 authored missile IDs from the Slow Missiles contract.
3. monster-ice-shard and monster-frozen-orb return undefined and log fallback.

Expected: all13 explicitly authored missile skills resolve to registered damage
and flight. Preserve existing runtime damage/CD for the11 existing entries;
use original validated JSON only for missing entries, without duplicate aliases.
Actual: two rows exist only in JSON and cannot execute their stated Cold/Chill
behavior. The generic adapter is currently enabled only for playable classes.
No current monster actor references these two IDs in src/data/monsters; this
is a catalog contract gap, not evidence that earned campaign encounters fail.

## Evidence
Root-owned task:/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-amazon-support-ssrbktv_.
projectile-registration-missing-red.json/log and
projectile-registration-complete.test.ts:1failure/22controls,2.967s,
2490inputs/HEAD exact. Literal missing IDs retained in the original diff.
The earlier promoted test stopped at Ice Shard; complete collection identifies
exactly these two. A preceding bad ../skills/catalog test import is a harness
mistake, not a gameplay RED; corrected to actual ../skills/builders.

Root cause: catalog assembly never registers these authored rows. No workaround
for their stated Cold projectile behavior. Do not mask unknown IDs with a melee
substitute or change existing source tuning. Independent/full-v1 acceptance open.
