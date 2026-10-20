# P13c01B — ordinary earned mercenary gear browser proof

Status: accepted after independent producer/QA final APPROVE/ADEQUATE.
Discovery protocol and its original failure remain below as historical evidence.
Input6e7cf7e includes accepted runtime0221cd3; A evidence and all prior specs
remain intact. Root owns plan, one new production spec, explicit config
allowlist addition, eventual evidence and closing ledger. No runtime/UI scope.

## Native route and source-derived literals

Fresh ordinary Druid named Earned Merc Gear, Date-only T0
2026-10-20T12:00:00.000Z before creation, native playback timers. Ordinary free
ActI Inner Sight hire/field (obtains merc, not earned-currency recruitment).
Stock Druid skill/combo/core/gear; no learning/spending/skill changes or manual/
injected summons. Although its combo lists Dire Wolf, the production registry
overwrites the default with requiredLevel18, so this L1–L2 route cannot summon
it. Expect no wolf: enemy targeting weights hero2/merc2 while both live.
No import/bridge/store/direct storage mutation/forced input/injected lifecycle/
boost/retry. Ordinary creation, autosave and Save remain native writes.
Guarded production build, no server reuse; native settings locale.

First BloodMoor freshordinal0:8L2trash, runSeed2330410254, W1seed349193407.
Skip requires all enemies dead and original hero alive; numeric W2 then native
Pause pressed=true and Flee before any extra reward. Source oracles: heroL2
XP60/565/stat5/skill2; mercL3XP120/304;5normal drops/75rune-shards.
Saved merc core12/22/16/14, life/max148,mana/max79,attack25,defense26,speed122.

Source-only hash/PRNG reconstruction hypothesizes these exact first-wave items
(order and persisted rolls are hard assertions, not after-output substitutions):

| ID | Base | Base roll |
| --- | --- | --- |
| it-8jv2k-1 | items/base/glove-leather | defense4 |
| it-3yxk7-2 | items/base/glove-leather | defense3 |
| it-96fga-3 | items/base/glove-leather | defense5 |
| it-5iwwr-4 | items/base/boot-leather | defense3 |
| it-3h1j3-5 | items/base/amu-tin | none |

All normal,level2/ilvl2,affixes[],generatedName{},identifiedtrue,equippedfalse.
Use first compatible leather glove (defense4), a fixed native first-selection
policy before discovery, rather than search/adaptation. Merc Equipment button,
gloves slot label, first compatible row Equip. Export proves exact first ID
transferred once to mercEquipment[mercId].gloves, equippedtrue/equipSlotgloves,
remaining4backpack items; full other save fields unchanged. Read native equipped
item details for identity/defense4, then close through ordinary controls.
Projected fresh defense30; saved merc baseline remains26. No direct effective
derived-stat UI exists; item details or successful equip alone are insufficient
to prove combat contribution.

## Bounded discovery, separate from acceptance

Run exactly one en/desktop pilot after independent plan/spec review. Enter fresh
BloodMoor ordinal1 at sameDate, W1has9L2trash. Skip→all dead/heroalive→numericW2
then Pause. Cumulative exact heroL2XP240/565 and mercL3XP255/304 after W1.
W2has10champions, seed3062484588. Resume at default speed and observe at most
30seconds for the first landed FallenShaman monster.fire_bolt against identified
merc (action line plus immediately following fire-damage line). Ignore dodges
and other targets, but never pick a later favorable landed hit to that merc.
Pause immediately, require pressed=true and wave2, require Turn1 retained and
fewer than200visible log rows (uncapped complete per-wave prefix), capture prefix,
witness, ally HP width and screenshot. Then Flee; require precisely the two
W1 awards (no W2 payout), canonical glove and unchanged saved merc baseline.
Save→Saved→readonly realIDB/export equality→close/newPage/Continue→full save,
locale, fielded identity, gear/details/XP equality; page/console errors[].

This pilot is discovery, not B acceptance. First-wave weak melee10–15 (maximum
crit22.5) always floors to1 against both26/30defense, so no W1mitigation claim.
Formation does not force targeting. Shaman Fire Bolt25–40,critmult1.5,fireRes0,
ActI penalty0 and armor input=defense provide a potentially sensitive W2 event:
noncrit max(1,floor(base−30));crit max(1,floor(base×1.5−30));
compare original baseline26. Noncrit raw25–27 is insensitive; raw28–40 and every
critical roll are sensitive. Pilot absence/earlyloss/insensitivity stays failed
discovery, with original assertions/outputs retained. No timestamp/loadout/
class/area/event switch or stronger retry inside this recipe.

Before the acceptance matrix, independently reconstruct the identified hit's
RNG prefix/base/crit and mitigation, including the production low-level skill gates and hero/merc target
weights, and reconcile actual event association.
Observed amount alone is not the oracle. Strengthen final spec with the reviewed
literal damage plus baseline counterfactual/source proof; preserve pilot source
and outputs and rerun the unchanged final spec in four locale/viewport cases.
If exact event cannot be reconstructed, do not claim mitigation/B acceptance.
Pause may include extra events; preserve full actual prefix, do not imply event
stepping (there is no step control) or fixed HP immediately after the witness.

## Validation, environment and limits

After approved source/spec, full U/T/L, forced PWA lint/fixtureTSC, guarded native
production build; no builds concurrent with fingerprint tests. Task-local pinned
Noto CJK font/config/cache as in B3, per-process FONTCONFIG_FILE; no system/user
font installation/shared-cache changes. Four acceptance cases en/zh-CN×1280×800/
360×640, retries0, bounded timeouts, screenshots/actual save/log attachments,
no overflow/errors. Existing UI touch-size/a11y/backlog claims stay limited to
observed facts; no new UI controls or broad UI acceptance is included.

Save/close/Continue follows combat, because manualChallengeOrdinal is module-
local and resets after reopen. No post-reopen combat in this card. Exact RAW/
dist/.vite cleanup after independent consumers release; preserve versioned
evidence/oracles/failures and all source/history. FullP13/economy/Den/W2victory/
C0–C4/G0–G7/fullv1 remain open. BUG047display is separate.

RAW=/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-merc-gear-browser-nwmmhz9p
Root owns eventual cleanup after all consumers release.

## Pre-pilot source-review corrections

Producer independently traced production registry overwrite/minLevel checks:
Druid Firestorm40–60 fire/all/cd2/mana20 with burn→ignite, otherwise basic attack;
no L1–L2 wolf. Rogue loadout is inner-sight/self-buff stub then basic-arrow15–25
and pierce-arrow22–35/all, otherwise basic; no healing. Shaman resurrect_fallen
is a buff stub, no spawned unit. No paralyze source in this BloodMoor roster.
Reconstruction must include carried W1 pools/statuses/cooldowns, deaths/orbs,
AOE actions, targeting draws and separate scheduler tieRNG.

Actual log names resolve via locale, not exported raw merc.name: en Rogue Scout
— Inner Sight / zh 罗格侦察兵 — 内视; Shaman Fallen Shaman / 堕落者萨满 plus
A/B/etc instance suffix, without champion badge. Skill display is Fire Bolt /
火弹, not monster.fire_bolt. Preserve these source corrections before pilot.
Original draft assumptions (wolf and fallback skill literal) were rejected by
source review without a browser run. Playback Date.now timestamps do not reveal
simulation clock. No acceptance claim comes from a discovery pass.
