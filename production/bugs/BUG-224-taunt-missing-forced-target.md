# BUG-224 — Taunt does not force the marked enemy to attack its caster

- Status: reproduced; target/lifetime contract and repair open.
- Severity: High — advertised target control is absent.
- Owner: root, engine/data/UI; independent design/QA and earned balance open.
- Build: `3bef78ad` plus frozen basic/AOE presentation/tests; Taunt unchanged.
- Environment: Node24 native combat; no browser viewport; both locales promise
  forcing enemies to attack the caster.
- Seeds:7/19/41/97; legal native L30Barbarian ranks1/2/20.

## Reproduction

1. Legally allocate Howl1 → Taunt1/2/20 and prioritize Taunt.
2. Supply declared synthetic million-HP/100MP pools and one living allied merc.
   Hold the merc from the start; the hero and enemy act at1700ms/2000ms.
3. Taunt marks the only enemy for1700–2700ms. The caster stays alive and
   unstunned throughout that interval; its synthetic hold starts at2701ms.
4. Inspect the enemy's actual2000ms attack recipient. Verify immutable input
   and exact same-seed replay; write all12observations before intentional failure.

Expected: during the paid finite interval, an eligible marked single-target
hostile attack selects the living caster. Define replacement, caster death and
friendly/area-skill boundaries before implementing the target-control contract.

Actual: all12cases cast once and pay3MP at rank1/2 or2MP at rank20. Seeds41/97
at all three ranks still select the merc and remove100HP: six counterexamples
out of twelve. Seeds7/19 select the hero but do not prove forced targeting;
the ordinary weighted selector can select it without Taunt. Inspection confirms
the hostile selector does not consult the `taunt` marker.

Evidence: `warcry-probe.ts`, `warcry-observations.json` and
`next-warcries-active-caster.log` in the [four-attack packet](../../docs/plans/evidence/fixtures/barbarian-basic-aoe/packet.json)
to retain. Both the initial held-caster diagnostic and stronger active-caster
reproduction remain recorded. No repair, functional credit, genuine campaign
action or remote action.
