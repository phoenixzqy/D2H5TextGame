# BUG-223 — Howl spends mana without disrupting hostile actions

- Status: reproduced; no-movement fear contract and repair open.
- Severity: High — the advertised crowd-control effect has no combat consumer.
- Owner: root, engine/data/UI; independent design/QA and earned balance open.
- Build: `3bef78ad` plus frozen basic/AOE presentation/tests; Howl unchanged.
- Environment: Node24 native combat; no browser viewport; en/zh-CN advertise
  frightening enemies into fleeing. This game's invariant excludes movement.
- Seeds:7/19/41/97; legal native L30Barbarian ranks1/2/20.

## Reproduction

1. Allocate and prioritize native Howl at the requested rank.
2. Supply declared synthetic million-HP/100MP pools. Hero100Attack Speed,
   enemy50Attack Speed, and one allied merc are alive.
3. The hero casts at1700ms. Keep it alive and unstunned throughout the actual
   Howl1700–2700ms marker; a synthetic hold begins only at2701ms to prevent
   later casts. Hold the merc from the start to isolate enemy targeting.
4. Observe the enemy's scheduled2000ms action. Verify immutable inputs and exact
   same-seed replay, and write all observations before the intentional failure.

Expected: an explicit no-movement fear/disruption contract must produce actual
hostile-action consequences during its paid finite interval. A decorative
marker or unrelated personal dodge change cannot fulfill the advertised control.

Actual: all12cases cast once and pay4MP at rank1/2 or3MP at rank20. All12enemy
actions proceed normally at2000ms and each removes100HP from the hero or merc.
No control, targeting disruption or other fear consequence is observed. The
generic `howl` marker is not read by the action-control engine.

Evidence: `warcry-probe.ts`, `warcry-observations.json` and
`next-warcries-active-caster.log` in the [four-attack packet](../../docs/plans/evidence/fixtures/barbarian-basic-aoe/packet.json)
to retain. The earlier1701ms-hold probe is preserved separately; the stronger
2701ms version proves the caster is not controlled during the marker.
No repair, functional credit, earned campaign action or remote action.
