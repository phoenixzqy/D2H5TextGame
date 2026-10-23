# Worldstone Remnant — D14 v1

Status: approved implementation contract, 2026-10-23. Assigned game/technical
contract owner `/root/design_contracts`: GD-D14 APPROVE; producer: proceed with
P18a. This is not balance, earned-campaign, browser or full-P18 acceptance.
Sources: [GDD §10](../../Diablo2TextGame.md), [P18](../plans/work-plan.md),
[F17/F18](../plans/feature-coverage.md), [D03/D14](../plans/design-decisions.md).
The full seven-class/213-skill, five-act, 30–50 active-hour objective remains.

## 1. Overview

One repeatable manual-only dungeon, `endgame/worldstone-remnant`, uses existing
combat, Act V monsters, item materials and sockets. It is separate from Normal
and Nightmare campaign replay. Entry is free. No new currency/service, endless
mode, movement/range stat or independent HP/damage/resistance multiplier.
Names: 世界之石残境 / Worldstone Remnant. All visible copy uses i18next keys.

## 2. Player fantasy

Challenge and Discovery: adapt damage mix, mercenary choice, defense and sustain
to a known threat, then turn repeated victories into equipment improvements.
Autonomy comes from choosing a modifier and build; Competence from an explicit
finite challenge and useful, predictable completion income. The chapter story
retains its campaign authority; clearing this dungeon cannot rewrite it.
No separate pillar document currently exists at the prescribed path; this
contract uses the GDD and binding project invariants rather than inventing one.

## 3. Detailed rules

### Admission and identity

Unlock exclusively calls
`hasAct5CampaignReward(questProgress, questReceipts, questItems)`. Claimed Eve
plus the validated actual source graph is required. Level/current act, titles,
clear flags and loose quest claims do not substitute. Native entry also needs
a hydrated current hero, valid ownership/state and no conflicting run, restore
or transaction. Validate and stage before mutation; refused entry spends no
ordinal. Exactly one modifier is selected before admission.

Captured context is immutable `{kind:'endgame',
dungeonId:'endgame/worldstone-remnant', modifierId:'ashen'|'glacial',
attemptOrdinal, seed}`. Ordinal is the zero-based pre-entry counter. Seed uses
the existing hash/seedable RNG and canonical dungeon, hero, ordinal and modifier.
Modifier choice cannot change during a run.

### Four authored waves

All monsters are native level90. No replay projection, random elite fitting or
chapter-boss override. All members are `trash`, except the final Ancient uses
ordinary `boss` tier. Maximum four enemies simultaneously; fifteen originals.

| Wave | Original members |
| --- | --- |
| `worldstone-remnant/w1` | 2 barbarian-savage +2 overseer |
| `worldstone-remnant/w2` | 2 death-mauler +2 modifier enemies |
| `worldstone-remnant/w3` | 2 succubus +2 modifier enemies |
| `worldstone-remnant/w4` | 1 ancient-barbarian +2 modifier enemies |

Every monster ID has prefix `monsters/act5.`. `ashen` uses blood-lord: actual
75 fire resistance and existing fire breath/ignite. `glacial` uses
frozen-terror: actual75 cold resistance and existing frost aura/chill. Both
skills already resolve through `DEFAULT_SKILLS`/aliases; no skill repair is
needed. These are resistance and incoming-threat checks, not new immunities.

### Rewards and achievement

Ordinary qualified won-wave rewards use existing Act V/Normal XP/loot and
`loot/trash-act5`. A completed four-wave clear also pays the explicit cache:
ashen→one `gems/ruby/flawless`; glacial→one `gems/sapphire/flawless`. This cache
is separate from random kill-material quality caps. Every valid repeat pays.
No entry/reward implies Hell/Nightmare entitlement.

After at least one clear of each modifier, achievement
`achievements/worldstone-adapt` is eligible for explicit Claim. Claim pays one
perfect ruby and one perfect sapphire, and owns cosmetic selectable title
`titles/worldstone-adapt` (裂境行者 / Riftwalker), exactly once. Counts establish
eligibility; the claimed flag establishes reward/title ownership. Existing
socket effects and three-to-one fusion consume these materials.

### Original outcome authority

Bind each wave to its original hero/enemy identities, canonical plan, ordinal
and modifier, and advance only in order on original authoritative recordings.
Require original hero alive and every original enemy dead. Reject lookalike,
substituted, duplicate, missing, stale, mixed-attempt or replayed outcomes.
Displayed text and generic archetype counts are not proof. A loss/draw/abandon
invalidates the partial sequence, pays no completion cache/count, and retains
previously settled real wave rewards. Retry is a new attempt with current legal
configuration. Reload/import preserves durable rewards but discards active
recordings and partial sequence.

Final ordinary rewards/cache/count share the settlement rollback boundary;
achievement materials/claim share another guarded atomic publication. Pure
preparation returns proposals only; it never writes stores or grants items.
Native settlement owns acceptance and guards reuse. An observer exception must
restore every participating owned slice, while attempting all restorations.
Private weak identity seals on library-issued transient progress and bindings
reject structural copies and manufactured empty-member proofs. They establish
neither committed entry nor genuine battle outcomes. Proposal generation does
not consume the seal; native recording acceptance owns exact-once publication.

## 4. Formulas and persisted state

Native monster stats use existing base/growth, level90 and tier construction.
No independent difficulty factor. `seed = hashSeed(JSON.stringify([
'endgame-run-v1', heroId, dungeonId, modifierId, attemptOrdinal]))`.

Durable namespace: `{attemptOrdinal:0, clearCounts:{ashen:0,glacial:0},
achievementRewardClaimed:false}`. Values are own closed data fields. Ordinal
and counts are safe nonnegative integers; `ashen+glacial <= attemptOrdinal`.
Claimed implies both counts≥1. Without campaign authority all values are empty.
Achievement availability/title ownership are derived, not redundant flags.
Accepted entry increments ordinal once; completion increments the bound
modifier count once. Refuse ordinal exhaustion before entry. Modifier selection
and original-outcome receipts remain process-local.

Current save19 stays active during P18a. Dedicated integration freezes19 and
introduces20 with empty defaults, no inferred proof/clear/cache/title, and no
other gameplay changes. Reject reserved future state before historical
normalization. Do not add this title to Act V's closed `questTitles` map;
widen centralized selected-title ownership only in its integrated slice.

## 5. Edge cases

Locked, invalid/unknown modifier, malformed/unsafe state or busy native entry
refuses without mutation. Empty/synthetic/mutated plans and unknown references
refuse. A qualifying last wave alone, duplicate original IDs, extra/missing
original members, dead/substituted hero, living original enemy, mixed attempts,
loss/draw, reordered or duplicate settlement cannot grant completion. Material
overflow or failed count/claim publication restores the complete transaction.
Free entry avoids a currency retry soft-lock. Repeated same modifier earns its
cache but does not replace the other achievement requirement. Saves never
reconstruct an unfinished run. Active recordings retain their frozen modifier.

## 6. Dependencies and data flow

Closed JSON/schema/Ajv loader → pure admission/immutable plan → production
monster factory/recording → native original-outcome binding → shared settlement
→ durable progress/materials → persistence and bilingual controls. Separate
campaign/endgame origin from Act V/Normal reward context. Existing
`replayProfileId ?? 'normal'` campaign dispatch and its Nightmare final branch
must become explicit before dungeon entry is exposed. Dungeon outcome dispatch
grants no quest, campaign clear/transition, idle unlock or raw offline reward.

UI shows earned lock reason, level, real modifier effects, free entry, cache,
counts and achievement availability/claimed status. Reuse combat playback and
return/retry; title uses existing nameplate. All controls zh-CN/en, keyboard and
focus accessible, ≥44px, mobile360×640 plus desktop. Do not expose internal save
or development steps in product copy.

## 7. Tuning knobs

| Knob | Category | Default / rationale | Range |
| --- | --- | --- | --- |
| Native level | curve |90, above authored Normal finale |1–99; changes need reviewed earned evidence |
| Wave composition/count | feel/curve |4 waves/15 enemies, resource carry +final check |1–20 waves;1–20 members each |
| Modifier archetypes | feel |existing resistant fire/cold threats |closed validated monster IDs |
| Completion materials | curve |one relevant flawless gem |positive safe closed ledger |
| Achievement condition | gate |at least one clear of each modifier |the two authored modifiers |
| Entry cost | gate |free, no retry resource lock |empty in this version |

All gameplay numbers live in validated JSON or existing canonical monster data.
Defaults are provisional, not selected to make prepared fixtures win. Level90
balance, time-to-afford and build viability need actual earned trials.

## 8. Acceptance criteria and delivery order

P18a: approved contract, closed content loader and pure admission/projection,
immutable original-wave progression/completion proposals, strict state checks.
Positive/negative tests must prove real campaign authority, deterministic
projection, modifier resistance/skill differences, source immutability,
schema/reference closure, ordered original wins and no duplicate completion.
Pure tests establish no native grant, persistence or browser acceptance.

Next integrate save20/migration and live ownership; native entry/ordinal and
settlement/cache rollback; achievement Claim/title; visible bilingual controls.
Do not leave the foundation disconnected at full-P18 acceptance.

P18 acceptance requires production evidence of two repeat clears, both modifier
interactions, useful reward consumption, defeat/retry and exact reload on
desktop/mobile. Earned unlock and multi-build high-difficulty validation remain
required. Prepared scenarios prove functionality only. Player trials must show
understandable choices, fair failure and useful rewards, with manual a11y.
Full C2–C4/G0–G7, all classes/skills and campaign pacing remain accountable.
