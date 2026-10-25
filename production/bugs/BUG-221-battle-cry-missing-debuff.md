# BUG-221 — Battle Cry pays for a marker without its advertised debuff

- Status: reproduced; numerical/lifetime contract and repair open.
- Severity: High — neither advertised enemy Attack nor Defense reduction works.
- Owner: root, engine/data/UI; independent design/QA and earned balance open.
- Build: `5d5524b6` plus the frozen Concentrate/Berserk/Stun batch; Battle Cry unchanged.
- Environment: Node24 native combat; no browser viewport; en/zh-CN advertise
  reduced enemy Attack and Defense.
- Seeds: 7/19/41/97; legal native Barbarian L30 ranks1/2/20.
- Affected systems: registered debuff, actual incoming/outgoing mitigation,
  finite status lifecycle, playback/carry, truthful bilingual skill details.

## Reproduction

1. Legally compose Howl1 → Taunt1 → Battle Cry1/2/20 and prioritize Battle Cry.
2. Declare synthetic million-HP pools,100MP,200Attack/100Defense. The hero has
   100Attack Speed; its allied merc and enemy have50Attack Speed.
3. Hold the hero after1701ms so one paid cast resolves at1700ms. Inspect actual
   landed enemy/ally attacks at2000ms, inside the marker's1700–2700ms interval.
4. Verify immutable inputs and exact same-seed replay. Write all12observations
   before deliberately asserting the missing benefit. No state becomes earned.

Expected: the paid cry's defined Attack/Defense reduction changes eligible
landed damage during its finite interval. Existing prose does not establish
numerical potency; record an explicit contract before repairing it.

Actual: all12cases cast once, paying6MP at ranks1/2 or4MP at rank20. Every
landed enemy attack still removes100HP. The ally also removes100HP in9/12cases
(the other three miss). The marker exists, but no advertised reduction appears.
This is an isolated native mechanic observation, not paired full-schedule RNG
or earned balance evidence. The generic marker has no mitigation consumer.

Evidence: the complete probe, observations and intentional failed assertion are
retained in [the attack-batch packet](../../docs/plans/evidence/fixtures/barbarian-attack-defense/packet.json)
as `battle-cry-repro.ts`, `battle-cry-observations.json` and
`next-battle-cry.log`. Root owns follow-up; no separate agent or remote action.
Battle Cry receives no functional credit. Genuine L33/Ancients complete/Baal
uncleared remains unchanged.
