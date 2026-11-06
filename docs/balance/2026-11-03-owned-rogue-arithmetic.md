# Owned Rogue damage comparison

2026-11-03. Analytical evidence for BUG611; no gameplay change selected.

The remaining preparation hypothesis was whether the earned level-71 physical
trainee would supply stronger opening and singleton hits than the selected
level-71 Cold Arrow Rogue. The audit projects both actual owned actors through
`mercToCombatUnit`, holding the selected Rogue's ten canonical items fixed.
Those items have **not** transferred to the trainee. The saved fielded actor,
all save domains and exhausted ordinal 1594 remain unchanged.

Both projections have a 400 ms unmodified action period. Equipped attack is
727 for Cold Arrow and 726 for the trainee. The Cold Arrow projection's complete
stats match the retained paid-equipment result. These are fresh factory
projections, not preceding-wave life/mana, cooldowns or statuses.

The audit uses all ten authored Act V archetypes at hypothetical level 70 and
ordinary tier. It invokes native registered effects and `resolveRolledDamage`
for connected min/max rolls, both noncritical and critical. Cold Arrow shares
both base and flat attack equally across physical and cold damage; each
component then receives its own resistance and flat mitigation. No RNG,
scheduled battle, old wave, encounter population or DPS estimate is involved.

## Connected noncritical hit examples

| Ordinary archetype at level 70 | Cold Arrow, neutral | Trainee Basic Arrow, neutral | Cold Arrow with own Inner Sight and earned Amplify 1 | Trainee Basic Arrow with earned Amplify 1 |
| --- | ---: | ---: | ---: | ---: |
| Frozen Terror | 199–208 | 543–553 | 436–449 | 914–929 |
| Ancient Barbarian | 212–218 | 67–72 | 357–370 | 438–448 |
| Baal Minion | 475–489 | 538–548 | 713–731 | 909–924 |
| Baal | 25–27 | 288–298 | 245–257 | 659–674 |

The Baal archetype is deliberately ordinary here, not a chapter-boss fixture.
Status columns are isolated sensitivities, not assertions about curse/debuff
uptime. The trainee has no own Inner Sight source.

The selected Cold Arrow Rogue also owns the same physical Basic Arrow
definition; its equipped projection has one more point of Attack than the
common-gear trainee. Native `chooseSkill` confirms Cold Arrow when all skills
are ready, Basic Arrow when Cold Arrow is cooling, Inner Sight when both arrows
are cooling, and ordinary fallback when all three are cooling. The trainee
chooses Basic Arrow when ready and ordinary fallback while it cools. Thus the
headline Cold Arrow's weaker hit on cold-resistant enemies does not establish
weaker complete-party DPS. Connected-hit endpoints alone cannot resolve
cadence, target choice, control, status uptime, survival or actual wave carry.

## Decision and validation

Do not select or equip the trainee on the strength of this arithmetic. Physical
hits can help some enemies, while physical resistance changes that comparison;
the existing selected actor already has a physical option and defense utility.
This closes the assumption that a generic companion swap is an established
progression correction. It does not rule out a later independently evaluated
adaptation. The separate [Corpse Explosion mitigation audit](2026-11-03-corpse-authored-mitigation.md)
still establishes a pack-damage scaling mismatch that a companion swap alone
does not correct. The next gameplay decision must explicitly address both
pack damage and first-kill/singleton damage, preserving the intended identity.
No further rotation or companion trial follows from this report.

All 2,147 production inputs and pinned earned-save/readback references
authenticate before and after the native audit. Independent Python readback
checks all 100 rows and 560 component endpoints from raw skill, monster and
mitigation data plus the recorded native actor stats. Its first version
incorrectly interpreted `DamageOutcome.raw` as pre-resistance damage. The exact
failed reader and receipt remain; v2 checks the native floored post-resistance
reporting semantics and passes without changing any final-damage assertion,
producer output or gameplay code. Equipment aggregation itself is native,
not an independently reimplemented stat derivation.

The memory-only launcher exits 0 in 2,563.329 ms; its 400.975 ms driver is
included in that total. The passing independent reader takes 111.850 ms.
No tests, prior acts, completed browser checks or combat comparisons rerun.
No admissions, training, RNG draws, save writes, rewards or balance acceptance.
The launcher is absent and no disposable cache or bundle was created. Original
closed gameplay-family ceilings and terminal controllers remain unchanged.

Evidence closure:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p15-owned-rogue-arithmetic-v1-closure.json`
SHA256 `acbad5c9cddd5af123f58fb5734bf2f5f1d89d2e5916749e55fe85eb4659c4ac`.
Root retains this required evidence packet and the current human2 worktree
through private-v1 umbrella review, and owns eventual cleanup/release.

Act V remains 13/19 main quest actions, formal balance acceptance remains
0/210 cells, and BUG611/private v1 remain incomplete. BUG592 also stays open.
Browser works; CI is excluded; no user answer is pending.
