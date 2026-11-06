# P15 — Monster catalog roles and ordinary physical family

## Scope and cause

The 111-row source inventory separates numeric authoring, native action source,
and balance acceptance. Ten rows currently have paired attack curves; 101 do
not. Of those101, 86 contain generic CD1/MP0 actions (75generic-first,11later),
12 have source-audited spell-covered base cadence, Bone Ash and Warped Shaman
have ordinary gaps, and
Blood Raven has explicit fixed basic damage. Five chapter encounter overrides
overlap these definitions. These are source findings, not campaign coverage.

Generic actions are always ready at the catalog's base cadence (AS<=150), so
merely adding attack arrays does not activate ordinary damage. Suppression is
conditional: Mana Burn can disable active monster skills. The12spell-covered
rows have unconditional cooldown cover at unmodified native base cadence;
affixes, speed changes, Mana Burn and overrides are excluded from that finding. No selector rewrite
is needed.

## Adopted bounded change

For the20 ordinary physical rows below, keep required `skills` but allow `[]`
in the schema and remove redundant generic-only lists. No sentinel or new
skill. Preserve five existing numeric pairs and add15 provisional point pairs.
The 32/+5 baseline and first five coefficients come from early-game-spec§4;
other coefficients are new role-based design authoring, not recovered approval.
Native levels provide regional scaling; add no Act multiplier.

| Row | Base point | Growth point | Derivation |
| --- | ---: | ---: | --- |
| act1.zombie | 28.8 | 4.5 | slow undead; existing |
| act1.quill-rat | 27.2 | 4.25 | light attacker; existing |
| act1.carver | 33.6 | 5.25 | fighter; existing |
| act1.dark-archer | 35.2 | 5.5 | ranged skeleton; existing |
| act1.bone-warrior | 35.2 | 5.5 | skeletal fighter; existing |
| act1.spike-fiend | 27.2 | 4.25 | Quill-family adoption |
| act1.misshapen | 32 | 5 | baseline fighter |
| act1.hungry-dead | 28.8 | 4.5 | Zombie-family adoption |
| act1.ghoul | 32 | 5 | stronger undead |
| act1.returned | 35.2 | 5.5 | Bone-family adoption |
| act1.returned-archer | 35.2 | 5.5 | Archer-family adoption |
| act2.sand-raider | 32 | 5 | baseline fighter |
| act2.sand-maggot | 27.2 | 4.25 | tough body, lower damage |
| act2.sand-maggot-young | 19.2 | 3 | frail offspring |
| act2.mummy | 32 | 5 | slow tough fighter |
| act2.scarab | 27.2 | 4.25 | armored, lower damage |
| act2.undead-flayer | 35.2 | 5.5 | aggressive fighter |
| act3.flayer | 35.2 | 5.5 | aggressive pack fighter |
| act4.damned | 32 | 5 | baseline undead |
| act5.barbarian-savage | 40 | 6.25 | heavy warrior |

Formula remains round((base+max(0,L-1)*growth)*tierMultiplier), once at the end.
No HP, speed, defense, MR, resistance, XP, spawn, affix, generic skill, selector
or chapter override changes. No selected row has a signature, flee, support or
summon skill, or canBeBoss:true. Encounter-authored boss tiers still apply: Den
Carver boss:true intentionally receives the ordinary Attack boss multiplier. Dark Archer and Returned Archer remain ranged;
other18 remain melee, including Quill/Spike/Maggot. Ordinary ranged is immediate;
add no flight or Slow Missiles behavior.

Blood Raven raises the canonical Zombie: those bodies intentionally adopt the
same curve/action behavior; Raven's fixed30–50base/FireArrow/summons stay. Endgame
W1 has two trash Savages atL90: ordinary Attack596 replaces fixed30–50StrongMelee.
This material threat increase requires measurement and is not neutral cleanup.

## Inventory and ordered batches

`../monster-role-inventory.json` records exact111definition pointers, aliases,
current curves/legacy32+5, role/action/delivery, literal authored references and
chapter dispositions. Authored levels/counts/flags are not native planner proof;
planner and quest coverage remain explicitly pending. Numeric and action status
advance only after actual implementation; every row remains balance-unaccepted.

1. This physical20family, after baseline capture and meaningful RED.
2. Fleeing melee families; review panic priority and ordinary gap behavior.
3. Signature physical/elemental families, with damage/control payload audits.
4. Support/caster families, finite summons/revival and real ordinary gaps.
5. Special/boss rows, explicit Raven and five separate chapter overrides.

Each later batch needs its own concrete adopted values, controls and validation.
Do not mechanically populate all rows from32/+5 or run a campaign for every row.
After this batch25/111numeric pairs will exist;86remain pending. Already-paired
Fallen remains generic-blocked and is not silently closed.

## Validation and diagnostic bounds

Functional RED/GREEN uses real bundled rows/factory/default registry/selector,
actual skillId:null actions at native cadence, exact level/tier Attack and
unchanged18melee/2ranged delivery. Schema allowsempty but still rejects absent
skills/invalid IDs. RaisedZombie and L90Savage contexts plus BloodRaven/chapter
controls are included. Inventory integrity checks exactcoverage, references,
pairednumbers, statuses and override rationale, without balance assertions.

A single predeclared matched duel batch uses20rows at synthetic levels
ActI12/II20/III30/IV45/V60 plus Savage90; each meets unearned unequipped
Barbarian and FireBolt1Sorceress (starting stats, unspent remaining points),
seeds0–99,42cells/4200fights per arm. Native baseline is captured before content
mutation. Native60s/1000actions,600swall/256MiBcompressed per arm; full raw,
source inventories, input immutability, A/B/A and plain/recorded parity.
Allow only exact20skill-list removals/15numeric additions/schema minItems1→0.
Pair comparison normalizes only skillOrder, Attack and attackRange; all other
inputs and spawn RNG must match. These normalized inputs are never simulated.
Report every outcome/source/threat/TTK/DPS with complete denominators. No rewards
or pacing inference, no rerun/tuning or campaign continuation from these duels.
Next earned campaign batch follows a coherent monster milestone.

## Review and security

Read-only design adviser recommends this family and the two cross-context
checks. Root plan review: bounded exact changes, negative controls and preserved
baseline; role reachability and balance are separate. Security: local authored
data and pure engine diagnostics only; no credentials, network, dependencies,
permissions, CI, publication or save-format change. Root is sole writer in the
existing claimed worktree; retain raw failures and measurements through umbrella
acceptance. This decision authorizes implementation, not numerical sign-off.

## Post-comparison review resolution

Independent QA found Bone Ash ordinary gaps after finite summons reach cap and
confirmed Den Carver explicitly spawns at boss tier despite canBeBoss:false.
Both corrections are recorded above/inventory; no production change follows.
Boss and rare-minion literal oracles supplement the original tier probes after
the frozen paired measurement. Baseline/candidate inventories and driver remain
immutable; this update changes no measured combat input.
