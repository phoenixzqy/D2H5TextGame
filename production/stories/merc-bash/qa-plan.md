# Native mercenary Bash QA

QA-PLAN: APPROVE — reviewed readiness, 2026-10-28. Native validation passes;
feature acceptance remains incomplete. Root owns implementation and evidence; producer
reviews independently. Contract: [D04](../../../docs/plans/decisions/D04-merc-bash-v1.md).
Base: `75cb704378c9c017c709bc6ed36a8cace9aa245f`.

| Criterion | Cases and evidence |
| --- | --- |
| Actual loadout executes the advertised combo | Frozen seed-7 real pool/factory/projection/default-registry primary retains Battle Orders, observes two attempts for one action at Attack 100/200, zero MP and immutable saved/input state. Native RED has two one-hit failures; unchanged primary GREEN passes. |
| Damage stays flat and ordinary | Rank1/20; literal fixed25 gives50total, +30% gives32perhit/64total; Attack0/200 unchanged; ordinary crit/resistance/Defense/minimum1; no Jab bonus. |
| Independent attempts and procs | Native seeds6/7/3/5/41/1 cover first/second/both/neither stun, missed first/second and mixed criticals with literal damage and proc positions. No proc draw on misses. |
| Finite status lifecycle | Actual status-state records, same-clock refresh without stacks, inclusive1700/exclusive2700 ordinary and2200 boss/chapter-boss; interruption at2000 and next ordinary action4000. |
| Payment and early termination | Carried cooldown just inside/exact1700; terminal action commits CD2000/MP0; target death retains original target; reflection kills caster between hits; intervening basics have no Bash stun. |
| Authored contract is closed and immutable | Missing/duplicate/wrong-ID/foreign metadata, malformed sequence/status/cost/scaling rejected; whole mercenary catalog validates; runtime base/sequence/status/tags copied and frozen; repeated default loads preserve player Bash and native Jab. |
| Public integration stays truthful | Real Battle Orders/Bash recording has literal finite stun, publishes through `stageRecordedBattle`, and converges through public playback for HP/MP/stats/statuses/buffs/enrage. Saved/input state and repeated native recording remain unchanged. Both locale descriptions state two hits, per-landed25% and1s/boss0.5s. |

Four new files supply65 cases: schema/resolver40, combat22, primary2 and public
lifecycle1. Focused256/10 passes. An ES2022 observation-helper correction changes
no fixture or numeric oracle; predecessor evidence is retained. Predecessor scoped
lint and types fail for the same action-event narrowing error. Both failures
remain retained. An erased RecordedBattleEvent predicate emits identical JS;
independent review approves it. Successor focused256/10, scoped zero-warning
lint, external build, project types, engine11260/420 and full lint pass;
ordinary units terminate21101pass/one failure (BUG373). Native trace proves the
fixture never casts Blaze: FINISHER misses41HP, then Bash22+20 ends at400ms.
Only hero Blaze priority changes; native payment/status/lifetime assertions
are added and every old replay/removal/resource/carry check remains. Temporary
observer removed; actual syntax/lint failures and exact predecessors retained.
Final targeted12/12 and scoped lint pass on2080map12bc7597; independent review
approves. Final ordinary units pass21102/993files, zero failed/pending/todo,
in1584.117326s; project types pass280.345979s and full zero-warning lint/engine
purity passes540.454492s. All2080inputs remain unchanged on final12bc7597map.
Engine/build production inputs and frozen Bash primary remain unchanged;
predecessor checks are not successor rerun claims. Final independent evidence
review and exact commit binding govern the local checkpoint; native checks do
not establish browser/earned/feature acceptance or a timeout cause/speedup.
[Evidence](../../../docs/plans/evidence/merc-bash.md)
records exact results, input lineage and remaining acceptance.

Use the reviewed ordinary unit boundary. Do not execute or discover diagnostic
workspaces, closed policies or earned/modes/rune/fusion/runeword matrices. No
protected retained-final fixture access/replay. BUG180/366 timeout recurrence
stops source continuation; passing workloads do not establish a timeout cause
or speedup. The actual native deadline stays60000ms; maxRounds is not a bound.

Browser at360×640/412×915/1280×800, zh-CN/en layout, keyboard/screen-reader/
contrast, actual recruitment/field/equip/save/reload, earned balance/campaign
and full-feature acceptance remain pending under terminal H3 failed-no-app.
No app/browser retry or replacement acquisition/lineage/gameplay experiment
follows from native tests. There is no save-format or persisted-state change.
