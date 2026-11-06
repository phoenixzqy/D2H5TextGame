# Act II resource policies: Javelin recovered; corpse-focused boss output remains open

Javelin Amazon24 now clears both retained Tomb/Duriel cases with four source-owned
unused points allocated to Impale4. The corpse-focused Necromancer24 clears all
five packs in both cases after a cheaper opening and a declared Decrepify window,
but both boss fights still draw. Preserve those failures. These are conditional
survival/resource diagnostics, not accepted build balance or original build identity.
No production code, game data or authoritative player save changes.

## Javelin: use the available single-target skill

Exact source:`p15-javelin-act2-arcane-tomb-native-v1.json`,24/XP49062/normal
ordinal241. Baseline LightningStrike20-only already clears all packs, but Duriel
splits48.676s victory/60s draw with281HP remaining. The source legally owns the
PowerStrike prerequisite and four unused skill points. Spend those four points
once via native allocation, retaining each export, to learn Impale4. Paid ranks
26→30/free4→0 conserve30points; core, gear, merc, stat3/skill1 reset allowances,
ordinary currencies/materials and all other progress remain exact.

Keep LightningStrike-only for all five packs. Before settling the installed
fifth pack, choose Impale>LightningStrike for the next staged boss. All five
prefix combat/event/metric streams remain identical to baseline. Reward payloads
and RNG-derived item-id prefixes agree; cross-process serial suffixes differ.
Within each new trial all actual item IDs/custody and native awards reconcile
exactly. No award or preparation is replayed to repair a checker.

| Seed | Boss entry HP / MP | Duriel | Final HP / MP | Minimum boss MP |
| --- | --- | --- | --- | --- |
|1|477 /228|41.884s victory|358 /24|1|
|8|477 /196|39.620s victory|480 /13|0|

Impale casts18/17, LightningStrike14/13; five basic attacks each. Both boss
times are in the proposed20–50s band. Seed8 still observes zero mana. This
resolves this small pair, not population sustain, first-attempt, within-three,
recommended-power, pacing, holdout or final acceptance. No extra JavelinII
trial is justified by the now-resolved survival diagnostic.

## Corpse-focused Necromancer: separate mana, burst and boss output

Exact source:`p15-bone-act2-arcane-earned24-continuation-v1.json`,24/XP62882/
normal ordinal242,29paid ranks/one unused point, zero free skill resets.
BoneSpear is unlearned; the route remains CE-focused and does not prove a
second Bone build. No allocation, reset, gear, core or merc change occurs.

The original CE>Decrepify>AmplifyDamage order enters the fourth pack with9/8MP
and dies both cases. CE>Weaken replaces the repeated20MP Decrepify/15MP
AmplifyDamage overhead in packs with learned6MP Weaken. Mana recovers, but:

- Seed1 still dies in pack3 at1.620s despite268MP entry. Its carried Weaken
  cooldown is2236ms, so the hero makes two basic attacks before the lethal
  same-clock Physical burst. This is no longer a lack of mana.
- Seed8 clears the packs, loses Prayer there and draws Duriel at60s with
 13817HP left. Hero retains190HP/212MP; raw hero direct damage11783.

Freeze one further2area/12wave control, without repeating paid preparation.
Keep the cheap order through the first three packs. Before settling pack2,
select Decrepify>CE for the next two packs. Decrepify is already learned and
ready at fourth-pack entry; its50% speed/33% damage reduction addresses the
observed opening window. Before settling pack4, select the same
AmplifyDamage>Weaken boss order. Actual first-three-pack combat is identical
to the cheaper control, verified from raw records without replay.

| Seed | Packs won | Boss entry hero HP / MP | Prayer at boss | Duriel at60s | Final hero HP / MP |
| --- | --- | --- | --- | --- | --- |
|1|5/5|447 /260|439HP|Draw,6926HP left|446 /200|
|8|5/5|248 /210|Died in fourth pack|Draw,13817HP left|185 /150|

Each boss case pays20AmplifyDamage/20Weaken and makes38basic attacks. Area
minimum mana198/147; both heroes survive. Prayer survival and offensive output
are now the remaining capabilities, not another mana refill or level requirement.
Do not repeat either rejected control or extend seeds automatically. Next inspect
native eligible owned Prayer life/mitigation and complete hero critical/cadence/
offense packages before prescribing a specific new control or acquisition.
Decision:`p15-necromancer-bone-act2-next-decision-v1.json`.

## Verification and retention

One shared `p15-native-available-resource-v1.ts` passes scoped strict types and
focused lint. The opening-control spec reuses those unchanged results. Three
policies execute6areas/34waves in25.655native process seconds. Prepared exports
are preserved before battle; source pins, exact allocation history, native plans,
enemies, events, rewards, HP/mana/cooldown carry and actual mana payments reconcile.
Reader3 passes18altered point/item/payment controls. Original sources and every
failed combat case remain immutable.

Retain the first reader failure: full cross-process reward equality incorrectly
expects process-global item serial suffixes to match. Reader2/3 compare all
reward payload fields and RNG-derived id prefixes across trials while preserving
exact full identity/custody checks inside each trial. No completed battle is
replayed. Authoritative readback:`p15-act2-resource-adaptation-readback-v3.json`.

Closure:`p15-act2-resource-adaptation-artifacts-v1.json`:8terminal receipts,
7pass/one retained reader failure; two configs archived/removed, six identical
partials removed, three caches absent and no owned process alive. No broad suite,
ActI or resolved-control replay, browser run, agent, install, commit, push or
publication. Required evidence remains at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`
for full-v1 consumers; root removes it when they finish. Original checkout stays
read-only, and the umbrella human2 claim stays active.

Source/data hashes remain
`c40ea546cb3459ca8e8148fa19542ea68d7c3dcbf4456955084e199bbafb640d` /
`7dccbccb569f547fd595137e50e3f29795e7d0f53cb86dd2347ede8277ff4c1c`.
Catalog72matched/64unmatched/68boss-review/6missing-source,58ready and accepted
balance0 remain. Full goal retains intended power/acquisition/point histories,
remaining encounter coverage, population/holdout/economy/fairness/30–50active-hour
pacing and integrated mobile/locales/a11y/PWA/endgame/save stability/review/owner
playtest. Browser works, CI stays excluded, no question or external blocker.
