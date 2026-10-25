# BUG-207 — Fire Blast selects a cross instead of its promised cone

- Status: reproduced; cone contract/implementation and whole-skill credit open.
- Severity: Medium — paid area targeting differs from the advertised shape.
- Environment: Node24.21.0, real default registry/native L30 Assassin, rank1 seed7.
- Owner: root; independent design/QA and earned balance remain open.

## Reproduction

1. Allocate actual Fire Blast rank1 with native playerToCombatUnit priority.
2. Put nine held2000HP enemies on the explicit3×3 grid, row-major target0–8.
3. Supply synthetic resources, allow one action, then hold the caster.
4. Record all damage/DoT, immutable exact replay, one payment and final HP.

Expected: the targeting honors the cone promised by skills-spec.md and both
locale descriptions. The spec does not define numeric grid cone geometry;
write an explicit faithful contract before patching, without relabeling a cross.

Observed: registered `aoeShape:"cross"`; actual target IDs1,3,4,5,7 form the
five-cell cross. Exactly one25MP payment, directHP295 and periodicHP84. Final
HP conservation/replay pass. A final intended diagnostic assertion exits1
because actual cross contradicts the cone promise.

Root cause: Assassin JSON authors cross; grid/schema lack a cone shape.
English: “Throws an explosive fire trap that bursts in a cone, burning enemies.”
Chinese: “投掷锥形爆裂的火焰陷阱，灼烧敌人。”
skills-spec.md row `assassin.fire_blast` says Cone/Cone fire trap.

See [native reproduction](../../docs/plans/evidence/d04-fire-blast-cone-repro.md).
This report precedes cone code/data repair. The separate Burn patch preserves
cross while repairing potency; it neither waives this defect nor credits the
whole skill. No earned campaign action or remote publication.
