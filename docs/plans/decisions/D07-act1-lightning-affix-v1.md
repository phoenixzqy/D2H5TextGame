# D07 v1c — Authored Act I Lightning-affix power

Status: accepted for implementation after design/technical/QA-plan approval; runtime validation pending.
Date:2026-10-22. Parent contracts: D04 independent magical mitigation and D07v1b
bounded elite groups. Reproducer/diagnosis: BUG-081, `fd7bdd7`.
This accepts neither first-act victory nor campaign pacing/C0–C4/G0–G7/full v1.

## Problem and authority

The retained native and matching production-service witness loses DenW2 with
112HPcarry:143rawLightning+17otherdamage,18HPorbs,30overkill. The last champion
Shaman remains36/297HP. All23wave-unit resource ledgers reconcile. This is one
bounded build/seed, not evidence all routes fail or a changed spell alone wins.

Three definitions conflict: live shared stub single-target40–60/2s/no status;
authored monster row all-enemies40–65/3s/Paralyze; old monster-spec §9 describes
+50%Lightningresist/25%on-hit. For actual promoted Act I Lightning affixes, this
record supersedes those alternatives and D07v1b's affix-skill preservation only.
It leaves the shared monster skill and other scopes under their existing policy.
Do not migrate the monster catalog globally as part of this fix.

## Exact behavior

1. Only actual Act I challenge promotions (forced guards and random idle
   promotions using `forceElitePack`) may specialize the built-in Lightning
   affix. Match its exact source identity, name key and `monster-lightning`
   source skill. Preserve the selected affix ID/name, replace only its skill ID
   with the new exact `monster-act1-lightning-affix` leaf. A custom replacement
   with another identity/name/source skill remains unchanged. Draw the affix
   exactly once, in the existing position; specialization consumes no RNG.
2. Retain active appended priority, single-enemy target, mana0, cooldown2seconds,
   no status/tag/resistance change and no on-hit/death proc. The cooldown is a
   minimum, not guaranteed cast cadence: authored skill priority, scheduler and
   existing control remain authoritative. Do not force melee actors to use it.
3. JSON damage at effective monster level L is
   `[12+2*(L-1),18+3*(L-1)]`, L>=1. Growth continues linearly above15; no cap,
   rounding to area level, player level, tier/ATK multiplier or allocated rank.
   Factory snapshots the already resolved actor level. This leaf's internal
   effective rank carries that level into existing `DamageEffect.perRank`;
   it is not an allocated player skill rank or new global level-scaling rule.
4. Use normal D04 magical mitigation, resistances, dodge/crit and actual RNG.
   Crit remains actor-controlled (champion/minion currently1.5×); no damage cap,
   forced miss, guaranteed survival or resource refill.
5. Existing skill data row `monster-lightning`, ordinary monsters, legacy plans,
   ActII–V, other affixes, dedicated/chapter bosses, D07tiers/counts/levels,
   targeting, acquisition, equipment, rewards and inter-wave carry stay outside
   the delta. Shared skill definitions must compare equal before/after.

## Power rationale and limits

The early-game reference covers L1–15. Anchor L15 at the existing40–60range;
choose L1at12–18 to preserve useful early threat without a40–60flat hit. These
anchors determine growth2–3, before changing runtime or inspecting new outcomes.

| Effective L | Normal unmitigated range | Max1.5×crit, floored |
| --- | --- | --- |
|1|12–18|27|
|3, earliest manual Moor champion guard|16–24|36|
|4, observed Den champion Shaman|18–27|40|
|6, early Moor rare minions|22–33|49|
|8|26–39|58|
|15|40–60|90|

Actual fresh Sorceress maxHP120 comes from createCharacter→createMockPlayer→
deriveStats(Vit10,L1):floor(100+10*2). The L6witness starts120/190; those two120s
have different meanings. L1maxnormal18is15%freshHP; L3maxnormal24is20%, maxcrit36is
30%, so the old25%aspiration is not uniformly met. L6rare crit49is40.8%of an
unchanged L1HP120; the unprepared route is not guaranteed safe.

Against the observed112HPcarry, three L4maxnormal hits81leave32HP after the same
18orbs/17otherdamage (14withoutorbs). Three maxcrits120would leave−7with those
orbs, so control/exposure still matter. This arithmetic is an exposure budget,
not a replay prediction: changed damage can alter survival, actions, targeting
and RNG. Champion Shaman authored HP spans234–360atL4 (observed297); high-end
life can demand more casts. No TTK/seed victory or wholeActI balance claim follows.
The40ordinaryMoorW1preparation ceiling and exact build/gear remain fixed for the
next earned screen. No campaign30–50h claim sets a first-spell numeric budget.

## Authorship and integration

Author the distinct row in `src/data/skills/monsters.json`, reusing existing
Lightning name/description/icon keys. Add a schema/type tuple
`scaling.monsterLevelDamageGrowth`, allowed and required only on this exact row;
other rows reject it. Schema enforces active/single-target/mana0/CD2/min1/max1,
damageLightning, cooldown const2 and no statuses/tags. A small exact leaf adapter validates one
row, requires finite ordered nonnegative integer base/growth ranges, copies and
freezes runtime values. It returns an immutable registered skill with JSON base,
growth and cooldown. Register this leaf without replacing the shared stub.

Planner specialization is pure and provenance-qualified. Factory level binding
requires that exact leaf in affix `extraSkillIds` and in the actual effective
skill order; a full order override suppressing it must not add its rank. An
ordinary authored skill with the same leaf ID alone is not an affix provenance
signal. No new global registry mutation, damage handler or mutable unit counter.
Data aggregation provides the existing translated Lightning name for both the
raw authored ID and its normal alias; no new user-visible copy is needed.

Two source slices: A schema/data/type/leaf adapter/unit tests plus the existing data-loader
catalog-count compatibility assertions in loader and bilingual log tests (seven source paths),
then B registry/planner/factory/integration tests/existing RNG oracle if proven
stale (five source paths). One integrated final full suite/T/L/B follows, with
focused RED/GREEN and static validation per slice. Diagnostic evidence is separate.
The loader and bilingual log catalog counts change283→284because one distinct authored row is added; keep
its complete catalog-equality/no-mutation assertions. Do not commit knowingly
failing required tests before their fix.

## Acceptance and negatives

- Genuine behavioral RED against original runtime, then unchanged assertions
  GREEN: Act I Lightning-only specialization, L1/3/4/6/8/15 damage endpoints and
  actual production damage/cooldown/target/status behavior. Use endpoint RNG or
  deterministic engine fixtures, not fitted outcomes/seed sweeps.
- Invalid/missing/duplicate source row and malformed/negative/nonfinite/inverted
  ranges are refused at authored boundary; schema restriction is tested. Caller
  input stays unchanged and output is independently frozen.
- Champion/rare-minion actor level, not player level/tierATK/allocatedrank,
  determines exact leaf effective damage; order overrides and nonaffix users
  receive no level binding. One chosen spell deals one hit to one existing target.
- Source controls cover other affixes, custom identity/name/source overrides,
  manual/idle promotion, legacy plans, all later acts, boss waves and one affix
  RNG draw. Existing planner oracle updates may change only the intentional
  specialized skill ID, retaining all count/order/level/RNG assertions.
- Existing name keys resolve in en/zh-CN for actual action events with no raw ID.
- Final source passes engine/full unit, typecheck, lint, clean production build
  and test-bridge scan. Report actual durations; known serial/performance limits
  remain open. Do not repeat broad runs absent new failures/source changes.
- A separate reviewed fresh native screen keeps the exact40earned ceiling/build
  and stops at first nonwin. Only actually reached Den clear→Akara→explicit claim→
  Save/new-pageContinue and mobile steps can become accepted. A failed result is
  retained honestly rather than retried/tuned until green.
