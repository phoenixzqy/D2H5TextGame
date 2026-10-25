# D04 — Native Fire Blast cone mismatch reproduction

2026-10-25. Reproduced only; no targeting patch or whole-skill credit.
[BUG207](../../../production/bugs/BUG-207-fire-blast-cross-instead-of-cone.md)
records the issue before a cone contract/implementation.

The [Assassin Fire packet](fixtures/assassin-fire/packet.json) retains
`scratch/fire-blast-cone-repro.ts`, `scratch/fire-blast-cone-observed.json`
and `scratch/next-fire-blast-cone-repro.{log,json}`. The diagnostic exits1 after
asserting exact one action/payment, immutable replay and target HP conservation.
Its final assertion identifies the cross/cone promise mismatch, not a unit-suite
failure. It runs against the final frozen1383source snapshot; no source mutation
occurs between probe and the current Assassin Fire committed-blob audit.

Native L30/rank1/seed7 Fire Blast hits row-major3×3 targets1,3,4,5,7. Direct
HP295 plus periodicHP84 equals total final loss379. Final HP by target0–8 is
`[2000,1934,2000,1927,1917,1922,2000,1921,2000]`; mana100→75. Both locale
source descriptions and skills-spec.md promise cone, while data/grid/schema
implement cross. Numeric cone geometry needs an explicit contract before code.

Held enemies, later caster hold and resources are synthetic. This establishes
actual targeting, not earned balance, trap lifecycle or whole-skill acceptance.
Genuine retainedL33/next402/Baal-uncleared state/digest remains unchanged.
