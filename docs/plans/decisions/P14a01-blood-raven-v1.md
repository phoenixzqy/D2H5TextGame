# P14a01 — Blood Raven encounter completion

GD-DESIGN-REVIEW: APPROVE. TD-TECH-REVIEW: APPROVE. Root sole writer in claimed
human worktree2; implementation parent `c020dba`. Full v1 scope remains intact.

- Burial Grounds' three Bone Warriors author `boss:false`. Explicit `elite:true`
  wins over false; omitted flags preserve legacy wave-tier defaults elsewhere.
- Blood Raven alone: life100–140/growth10–14, defense10. This is a deliberate
  miniboss calibration, not a correction of alleged duplicated boss scaling.
  Preserve rewards, resistances, level, attack and global multipliers.
- Dedicated JSON Raise Dead first in priority: three real trash Zombies per
  ordinary scheduled cast, CD25s, at most six living per owner/template, partial
  batches allowed, no startup cast and no summon-death cooldown reset/refund.
  Unavailable summons fall through without action, cost or RNG. The25s choice
  resolves legacy five-turn prose only for this encounter.
- Dedicated JSON Fire Arrow35–55/CD2/zero mana; landed hits apply two ordinary
  Burn stacks,10% of settled damage per stack under current rounding,3s.
- JSON physical base arrow30–50: ordinary fallback with `skillId:null`, no mana,
  skill cooldown or additional action. Do not expose raw Attack139 in CD gaps.
- At10%HP sticky enrage doubles attack speed. Preserve base stats, phase progress,
  Chill/control rules and all unrelated actors. Zombies use existing archetype
  scaling and summon owner-death/reward exclusion.

L12 literal oracles: boss630–882HP/139ATK/40DEF/33MR; retained roll730HP.
Guards retained182/181/188HP,87ATK/52DEF/11MR,5%crit/1.5. Zombies105–147HP,
87ATK/29DEF/11MR. Inner Sight projects bossDEF30/guards39. Merc Attack43
noncritical Basic/Pierce vs debuffed boss29–39/39–55. Normal boss cadence1460ms:
Raise1460/Fire2920/base4380/next Raise27740; enragedAS260 gives420ms period.

Plan review: ready after distinguishing the physical base action and retaining
summon cooldown on death. Freeze real planner/factory/action RED before runtime
changes. Check caps/partial batches, immutable inputs/replay, Burn/enrage/control,
no startup, owner death, reward exclusions and omitted-flag compatibility.

Predeclared screen: retained Burial W4 ally snapshot; enemy rebuilt through
production planner/factories at seed grid0–999, all outcomes reported, no rewards
or winning-seed selection. Then run the original unique L12 route exactly once,
same frozen weapon/orders/ordinals, stop first nonwin. Dark Wood and conditional
Catacombs qualification keep prior rules; no farming, extra gear search/refills.

Security check: pass. Local content/schema/pure-engine changes and owned diagnostic
outputs only; no credentials/network/dependencies/permissions or publication.
