# P15 — Selected Act V champion elemental immunity

2026-11-05. Small content/mechanic completion for BUG775; provisional selection,
root sole writer. Independent balance and full-v1 acceptance remain open.

monster-spec§10 requires select Act V champions to have full elemental immunity,
while ordinary trash must remain susceptible. The catalog gives Blood Lord and
Frozen Terror champion identities with75% fire/cold resistance, but the native
planner also uses both archetypes as ordinary trash. Simply setting their
all-tier damageImmunities would violate the trash rule. The earlier boss-poison
decision established explicit immunity independent of the75% resistance cap.

Designate only actual `champion` Blood Lords as fire-immune and actual
`champion` Frozen Terrors as cold-immune. These two strongest single-element
catalog identities provide the existing§10 example without adding random
immunities. Their75% numeric resistance remains. Ordinary trash, legacy elite,
rare leader/minion and boss variants of those same archetypes retain their
previous susceptibility; no implicit champion inheritance. Other archetypes
remain unchanged. This supplies§10's missing selection, and supersedes only
these two champion rows' implication that75% resistance is their sole defense.

Author optional `championDamageImmunities` with the same closed unique canonical
damage-type array shape as `damageImmunities`. At the native factory compose
all-tier metadata first, then champion-only metadata exactly when tier is
`champion`; deduplicate/copy/freeze the resulting transient array. Absent or
empty metadata preserves the previous output shape. No ID/name/resistance
inference or changes to planner, counts, stats, skills, rewards, RNG, numeric
caps, save format or shared direct/periodic mitigation. Existing combat-card
labels expose the actual resolved list in both locales. Status/control acceptance
is independent: fire immunity need not reject Ignite; its damage is zero.

Native reachability: manual guards promote Frozen Terrors in Bloody Foothills,
Crystalline Passage and Ancients' Way. Blood Lords do not occupy a champion
guard prefix in any current manual Act V roster; they become champions through
idle promotion of earlier trash waves. The unmodified Arreat Plateau idle plan,
seed775/ordinal5/initial misses11, promotes its wave2 Blood Lords. Initial
seed775/ordinal450 checks wrongly required both archetypes in manual and idle
plans. The retained finite13-count-cycle planner diagnostic establishes the
fixture correction without combat, rewards or balance samples. Keep the two
selected identities and planner intact; assert the actual manual selection and
both idle selections, with ordinary variants still susceptible.

Acceptance: genuine factory/damage REDs, then unchanged GREENs; champion-only
scope, all nonchampion tiers, composition/no-duplicate/immutability, strict
schema invalid inputs; native manual/idle promoted and ordinary waves; matching
direct/periodic damage zero, physical/other elements positive, deterministic
input/recording/playback parity. Verify actual localized CombatScreen labels
for native units in browser at mobile/desktop sizes. Only affected regressions,
scoped strict types/lint/schema; no completed campaign or exhausted sample rerun.

Plan review: ready after explicitly scoping immunity by resolved tier and
retaining numeric caps/status acceptance. Existing CombatUnit/save/playback
metadata already represent resolved immunity; no schema migration is necessary.
Security check: pass; authorized local game content/engine/tests only, no
credentials, dependencies, networking, CI, permissions or publication changes.
Root owns exact artifact/process cleanup. Owner playtest follows implementation.
