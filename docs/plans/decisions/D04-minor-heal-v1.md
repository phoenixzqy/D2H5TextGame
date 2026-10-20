# D04 v1h / P08a03 — authored Minor Heal recovery

Status: root design/technical contract; producer APPROVE / QA final ready.
Input8b1f497; implementation waits for P08a02 shared engine integration.
This is a bounded recovery primitive/one merc skill, not fullP08/P09/P13/C1.

## Problem, sources and choices

Actual src/data/skills/mercenary.json:341–359 authors mskill-minor-heal, active,
single-ally, cooldown4seconds, levels1–20, heal min30/max50/targetally, no cost or
rank scaling. Both skills locale descriptions promise ally life restoration.
Actual Acolyte Priestess has this signature/loadout. Registry instead loads an
inert self-buff minor_heal from MERC_STUB_SKILLS. Existing HealEffect supports
fixed/pct but treats ally as all allies and reports requested rather than actual
restoration. No JSON tuning change is needed.

New explicit selection policy: one living injured same-side unit, including the
healer, mercs and summons, with the lowest life/lifeMax ratio. Only positive
lifeMax,0<life<lifeMax qualify; ties retain battle insertion order. No targeting
RNG, enemy target or resurrection. This makes autonomous support useful without
new player controls. Pure-heal means a nonempty effect list containing only heal effects. These skills skip to the next skill/basic attack when
no eligible positive restoration exists, with no cast/resource/CD/healing RNG.
Mixed-effect skills retain their existing availability, resolving any heal only
against eligible recipients when its effect executes.

Minor Heal rolls one inclusive seeded integer30–50 for its one selected target
at each eligible cast. Rank1 and20 retain the same authored range and4sCD; no
invented rank growth, crit, combo, weapon or healing mastery. Zero authored cost
means even0mana may cast. Use live authoritative unit state for each effect,
clamp life at max, emit only positive actual HP increase. Fixed self/all-allies
and pct existing primitives retain their target scope/amount semantics, while
ally correctly selects one and all events report actual positive restoration.
Full/dead targets cannot consume a heal roll or produce a heal event. Positive
potential uses amount when present (explicit0 wins), otherwise range maximum,
otherwise floor(maxLife×pct). Potential0 is unavailable, including fractional
pct that floors0 and range[0,0]. Range[0,positive] is potentially useful; a valid
zero roll still consumes the eligible cast/CD, but emits no heal event. No
reroll or range rescaling. One lazy roll per executing ranged heal effect is
shared across that effect's eligible recipients, never one roll per recipient;
no eligible recipient means no draw. Minor Heal contains one ranged heal. Actual Minor Heal30–50 never has that zero-roll case.

Expose additive HealEffect.amountRange:[min,max]; precedence amount,amountRange,
pctOfMaxLife. Authored adapter emits range only; all data remains JSON-driven.
Range bounds are finite nonnegative ordered integers at the authored boundary.
Do not broaden all merc registration: exact Minor Heal production override loads
after existing merc stubs, preserving exact actualID mskill-minor-heal and all other skills. No new
canonical/underscore alias is introduced or claimed; this is the existing direct
registry identity, not a class-skill pattern alias. Pure
module imports actual mercJSON, no React/stores/registry cycle or tuning literals.
No save shape/migration, reward/economy/recruitment changes or new locale promise.

## Sequential reviewed slices

Root owns this control/BUG032/ledger/integration; workers own explicit child files
only, claim separate worktrees and preserve other agents' edits. Shared combat
and registry files wait for P08a02 integration; no overlapping implementation.

1. P08a03a authored registration (five files): engine/skills/effects.ts,
   new engine/skills/minor-heal.ts and minor-heal.test.ts, skills/registry.ts,
   skills/registry.test.ts. Behavior acceptance RED before mapper/override.
   Import existing authored fields, require exact row/valid range, immutable
   definition; exact production identity and factory loadout resolve it.
   Require exactly one authored row; reject missing/duplicates, unsupported
   trigger/target and negative/fractional/nonfinite/reversed range. Map authored
   cooldown/minimum-level/cost; immutable independently frozen output, repeated
   default loading, no old buff flags, unrelated merc/aura definitions unchanged. This alone does not
   fix gameplay and must not be labeled complete.
2. P08a03b runtime (four files): engine/combat/combat.ts, new
   engine/combat/healing.test.ts, combat/skill-resolution.test.ts, new
   stores/merc-healing.test.ts (actual loadMercPool→createMercFromDef→
   mercToCombatUnit→registry default rank1 path; rank20 engine fixture labeled). Genuine actual
   production RED and structured BUG032 precede runtime; central target/amount
   resolution also drives pure-heal availability, preserving mixed effects.
3. P08a03c ordinary merc/UI evidence requires a separately reviewed acquisition/
   encounter script with independent HP oracle and real save path. Existing
   playback heal stepping may suffice but must be checked, not assumed. No
   engine-only/full merc-recruitment/browser acceptance follows from a/b.
   Acolyte is a tavern recruit, excluded by current ordinary act-hire roster;
   loadMercPool/factory/import availability is not ordinary UI acquisition. A
   labeled imported/factory proof cannot certify earned recruitment. Any new
   obtain path requires its own acquisition contract/change, not this heal fix.

All source paths above under src/. If a correct boundary needs more files, stop
and review the decomposition; do not duplicate logic or weaken schema to fit.

## Required proof

Literal planned oracle (source-derived, not yet executed): seed1, priest acts
at400ms, hero100/200HP,priest180/200HP,enemy and hero perma-stunned, priest
stunned starting401ms. No earlier combat RNG; first.6270739406 produces43.
Hero ends143HP and priest180, with exactly one heal at400/amount43; no damage
from casting. Recorded/unrecorded repeated results/input immutability agree.
Rank1/20 production actualID/factory loadout both covered. Target40/100 beats
100/200; tied ratios follow insertion order; self/summon eligible; dead/enemy/
full excluded. With every other ally full,190/200 caps to200 with event10. Heal cannot rescue periodic-dead
hero at same boundary, or a dead healer act; control stun/CD/resource/priority
negative cases. CD interior and exact4400ms expiry after400ms cast (4000 elapsed), no-target next/basic/no-RNG,
all-allies/self/fixed/pct/current-state/clamp regressions. Include existing
registry, merc factory, periodic/deadline/summon tests as affected controls.

Each stage needs independent root+producer source/evidence review before next.
Run focused, engine/related, fullunit/typecheck/lint/build and changed-module
coverage. Record actual counts/times/warnings; existing timing budgets remain
requirements. Root validates final combined actual-registry/runtime head. Clean
only exact owned dist/.vite/coverage/scratch after consumers, verify and release
worker claims with git-worktree; no push/PR/deployment.

Security check: PASS. Trusted local deterministic content/combat support work;
no credential/network/dependency/permission or validation-bypass request.

Producer P08a03-MINOR-HEAL-PLAN-REVIEW APPROVE. Availability must share
target/positive-potential selection without RNG; explicit amount0 wins precedence.
Preserve existing summon availability; mixed-effect tests reread current state.

QA P08a03-QA-REVIEW CONCERNS resolved in this revision: nonempty pure-heal,
zero-potential/zero-roll decisions, shared lazy range roll, exact authored
boundary and four-file runtime/factory split now explicit. Required tests include
two sequential all-allies heals, buff-before-heal, mixed no-target resource/CD/
nonheal preservation and equal seeded fallback to removing heal priority.
Source-derived43HP oracle remains unexecuted until genuine RED.

QA final focused plan review: ready after amendments; no source/tests executed.
