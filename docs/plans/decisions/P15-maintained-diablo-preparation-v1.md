# P15 — Maintain earned Diablo preparation

Status: native next-admission recovery verified; maintained implementation local;
final fresh integration pending.

The Act IV checkpoint continuation earns40 through324 native Great Marsh
victories without replaying Acts I–II or the Act III quests. Plains765/Fallen
Angel Claim and River766/Hellforge services pass. Chaos767/seed3430922576 wins
six waves, then Diablo draws60s with6588HP remaining; hero455HP/7mana survives.
All save/export, economy, inherited quest/point and training audits pass.

Reuse the earlier BUG458 mastery findings. One native next-admission retry from
this actual failure save consumes its remaining free skill reset, conserves50
paid points and all stats/ownership, and allocates mastery20/Blizzard20/five
support ranks1/FrostNova5. Casting order remains Static/Blizzard/IceBlast.
Chaos768 wins all seven waves, Diablo53.6s/hero572HP34mana. Actual Terror Claim
and Act V unlock pass. Native retry4.227s, wrapper10.306s; no farming, earlier
quests, synthetic seeds, extra trials, grants or engine/data changes.

`prepareNovaChaos` applies this earned reset at the maintained pre-Chaos boundary
after Hellforge and all three seals. `runActFour` optionally returns the updated
profile and uses it through the final Claim. The native runner retains prepared
profiles immediately inside callbacks and only recovers an interrupted Act III
policy; its final report must preserve the newer Act IV allocation.

Four focused regressions cover point/ownership conservation, unavailable free
reset, callback timing/profile continuity and failure before Chaos admission.
Scope verification to these cases and static checks of changed campaign files.
Reserve fresh five-act integration for final acceptance; existing failed native
and static-check evidence remains retained. Next Act V starts from the successful
earned Chaos768 export using the continuation driver's post-training save
boundary, so preparation need not be repeated after a route failure.
