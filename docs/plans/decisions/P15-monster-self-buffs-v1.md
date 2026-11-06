# P15 — Four authored monster self buffs

Adopted2026-10-30 by root under complete private-v1 authorization, following the
read-only design recommendation. Provisional v1 tuning, no balance signoff.
Existing monster locale/spec and D05paid-buff conventions supply the precedent.

| Native action | CD | Duration | Self effect |
| --- | ---: | ---: | --- |
| Enrage |6|5000ms|+50%direct damage; no speed change |
| Shout |5|5000ms|+30%ordinary Defense |
| Teleport |3|1000ms|+50percentagepoints magical dodge |
| Thorns Aura |0|60000ms|50%physical HP-loss reflection |

All active/self/zeroMP/min1/max1, each consumes its ordinary scheduled action;
no recast while its own interval is active. Thorns zero-CD is a once-per-window
buff, governed by its active interval. Keep native bar order/cadence/curves and
the independent lowHPunit.enraged behavior. No movement, extra RNG, guaranteed
avoidance, physical dodge or periodic avoidance from Teleport. Enrage applies
to ordinary/active direct damage at impact, not reflection or existing periodic
integration; DoT can capture a larger directly dealt base under shared rules.
Shout does not modify magic resist. Thorns reuses existing living-wearer actual
physicalHPremoved reflection, including ranged physical; no recursion/traps/
periodic/elemental reflection. Keep existing mitigation/min-one conventions.

Normalize old JSON Enragepassive/CD0 to nativeactive/CD6. Normalize old Thorns
all-enemies/CD1/5–15attack to self/CD0 realreflection. New monsterSelfBuff JSON
metadata owns durationMs and percent; copied/frozen resolver objects. Thorns
copy must explicitly say physical damage, including ranged, rather than melee.
Update all four bilingual descriptions to seconds and explicit effects.

Use a small battle-private map captured only after actual payment of one exact
immutable native registered source by a living enemy monster. No generic
BuffEffect.statMods/duration activation, player rank authority or saved timers.
Private map prevents imported/borrowed/bare markers from granting potency;
source eligibility excludes mercs/heroes/summons and requires a real catalog
consumer. Authentic Conversion keeps the original monster identity; its self
buff stays personal, with hostile/reflection checks still shared. Death clears
paid windows before any resurrection, which must pay again. Each window is
half-open, copied with its authored potency at cast. UI receives presentation-only
monster-prefixed status observations with exact expiry; strip them on new battle
input so neither an imported marker nor an earlier result pays for a new wave.

QA: native RED; source validation/immutable copies; real native/probe bars;
finite expiry/no-active-recast/cooldown; Enrage damage without speed/periodic
recalculation; Shout physical Defense only; Teleport typed dodge through the
ordinary RNG; real physical ranged/melee HP-loss reflection including shields/
lethal/no-recursion/trap controls; replaced source/foreign unit/marker rejection;
recorded/plain/replay and input isolation; status playback/locales. Scoped
consumers/types/lint then a bounded frozen diagnostic, no outcome-based reruns.

Frozen diagnostic before mutation:160fights/arm, fourL20native/probe pairs ×16
seeds0–15 plus Tainted/DarkArcher ×16. TreeheadWoodfist,AncientBarbarian,Summoner
useboss tier; ThornedHulk trash. Probes expose exactly the selected buff. Same
synthetic2000HP/80AttackheroAS100/zero defense/resists/dodge/crit/no skills and
60s/1000actions. Controls full recording equal; modified cells may change RNG.
Record damage/reflection/actions/casts/outcomes/victoryTTK and source/input/raw
hashes, no earned/reward/pacing/balance claim.

Root plan/root-cause/security review: scoped private map avoids globally
activating permanent player/stub marker behavior. Use existing direct damage/
Defense/dodge/reflection and scheduler/status presentation paths. No new save,
install, credential, permission, remote write or publication. Existing isolated
claim/evidence retained. Browser resolved, CIexcluded; no user decision needed.
