# Corpse-and-curses staged stat preparation

2026-11-03. The [staged growth policy](../plans/decisions/P15-corpse-hybrid-stat-growth-v1.md)
is implemented and its earned native reset is verified. Preserve 2 Vitality /
3 Energy through level 23, then use 2 Vitality / 3 Dexterity from Decrepify's
existing level-24 unlock. Energy increases mana capacity without increasing
spell damage; this identity depends on physical opening kills and boss damage.
Only campaign preparation changes. Production formulas, skill numbers, equipment
and existing player allocations are unchanged by this policy.

## Implementation and affected checks

Five campaign paths add the optional authored stage, forward it to profiles and
allocate chronological five-point blocks through the native allocation API.
Ordinary growth preserves historical investment. Batched earned levels and an
explicit paid stat reset reproduce sequential allocation; leftover points remain
available. Other 13 intended identities retain their prior policy; the optional
corpse-decoy preparation inherits the stage.

Four behavioral RED cases preceded implementation. Six focused new/profile
cases pass; two affected existing Bone growth cases pass after replacing their
obsolete fixed-distribution oracle with explicit staged expectations. Scoped
strict TypeScript and explicit unignored ESLint pass. The stale-oracle failure
and initial redundant-assertion lint failure remain in the evidence packet.
These already passing checks were reused during earned-save verification;
no full suite, earlier-act campaign or browser run was repeated.

## One real earned reset

Restore a disposable copy of the independently verified level-71 earned save.
Malah's native town stat reset refunds exactly 350 invested points and consumes
one of three actual free stat-reset allowances. Skill-reset allowances stay at
three; the authored `wishstone` balance stays at 1,703. One native allocation
spends the refunded 350 points: 144 Dexterity, 140 Vitality and 66 Energy.

| Value | Before | After |
| --- | ---: | ---: |
| Raw Dexterity | 25 | 169 |
| Raw Energy | 235 | 91 |
| Attack | 222 | 294 |
| Attack speed | 145 | 289 |
| Physical dodge | 25% | 53.8% |
| Mana capacity | 806 | 616 |

Raw Strength/Vitality remain 15/155; maximum Life remains 1,259. Current Life
and mana remain 130/87. The intermediate reset correctly reduces maxima to
979 Life / 517 mana without healing. Three spare skill points, every learned
rank, the Attract / Corpse Explosion / Confuse order, all equipment, currencies,
mercenaries, quests, timestamps and challenge ordinals remain exact. Repeated
preparation allocates nothing and preserves the byte-exact exported save.

A separate Python reader reconstructs the entire post-reset and final save,
the actual entitlement payment, 350-point budget, quest bonuses and derived-stat
arithmetic. Equipment aggregation is an explicitly identified native input,
not an independently reimplemented aggregation. The native combat projection's
actual `stats` field agrees with the reconstructed derived values. All 2,147
production inputs and five campaign candidate hashes authenticate unchanged.

The original driver completed reset/allocation/export/idempotence, then failed
on an incorrect assertion of nonexistent `CombatUnit.coreStats`. Preserve that
failure; a read-only projection validates the actual API without another reset
or allocation. Reader v1 then failed in receipt construction on the plural
currency key; reader v2 reads the authored currency key and passes. No native
payment or combat was repeated. Combined native drivers take 731.133 ms and
combined launchers 5,363.268 ms, within the original 10/15-second ceilings.

## Remaining work and retained evidence

This verifies preparation, not opening-kill, singleton, campaign, fairness or
pacing viability. No battle, admission, training, quest action or balance cell
ran. Act V remains 13/19 main quest actions, normal ordinal 1,594, formal balance
0/210 accepted. BUG-611 and BUG-592 stay open. Closed comparison/controller
allowances remain closed. The next campaign decision must account for the
physical-support tradeoff and reduced mana capacity without replaying rejected
experiments or treating this candidate as an earned victory.

Evidence packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Use the `p15-corpse-hybrid-stats-v1` stem, especially `earned-readback-v2.json`,
`earned.native-export.json`, the retained failed receipts and final closure.
All launched processes are terminal; the in-memory bundles create no cache.
Root retains this packet and human2 worktree through umbrella review and owns
eventual cleanup/release. No install, CI, commit, push or publication occurred.
