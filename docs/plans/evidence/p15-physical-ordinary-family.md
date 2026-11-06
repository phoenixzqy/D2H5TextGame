# P15 — Ordinary physical family evidence

## Scope and implementation

[Controlling decision](../decisions/P15-monster-catalog-v1.md) adopts20ordinary
physical rows: five existing attack/growth pairs preserved,15newprovisional
pairs, only redundant generic lists removed. Required skills now allows[];
selector/registry/formula/delivery/rewards/spawns/otherstats unchanged.
Inventory is25authored/86pending, with20ordinary rows,61generic-first,11later,
12spell-covered-at-base-cadence,6fallback-open and1explicit-basic. Numeric
authoring and source reachability do not accept any row's balance.

Independent source review corrected BoneAsh from spell-covered to fallback-open
(cap-filled summon leaves Spirit/Prison gaps) and recognized explicit DenCarver
boss tier despite canBeBoss:false. Other12caster rows have unconditional
cooldown cover at unmodified native cadence, excluding affixes/speed changes,
ManaBurn/overrides.20family tiers include boss arithmetic but do not grant spawn
eligibility; DarkArcher/ReturnedArcher ranged, other18melee. Ordinary hits remain
immediate. RaisedZombie and actual endgameW1 L90Savage contexts are checked.

## Causal paired measurement — terminal, no rerun

External fixed plan/driver in packet below were frozen before first launch.
21row-level specs×2heroes×100seeds =42cells/4200fights per native arm,4326native
calls/arm including126A/B/A and plain/recorded controls. Actual bundled rows,
factory/default registry/selector; no reconstructed baseline clones or RNG mocks.
Synthetic trash levels12/20/30/45/60byAct, plus Savage90; unearned/unequipped
starting-stat Barbarian basic or FireBolt1Sorceress; remaining points unspent.
These are diagnostic duels, not earned builds. Native60s/1000actions retained.

Both arms complete with full raw recordings, native measure reconciliation,
input immutability and deterministic replay/parity. Each arm's complete3061
source-input inventory is stable; native source subset2028also stable.
Comparator verifies exact six-file byte delta:20lists/15pairs/schema minItems;
all other source bytes and paired spawnRNG/roster/resources match. Only enemy
skillOrder/Attack/attackRange are normalized for comparison hashes, never for
simulation. Both arm recipes/driver/plan hashes match.

Baseline:2598victories/0defeats/1602draws;0hero deaths/4200. Candidate:
1053victories/3147defeats/0draws;3147hero deaths/4200(74.93%). 4193candidate
fights expose ordinary actions; seven QuillRat victories kill the monster
with the hero's first action at1500ms(Sorceress) or the1540ms tie(Barbarian,
hero acts first), before an enemy action. The extracted seven raw observations
are retained in `p15-physical-ordinary-v1-no-enemy-action.json`. All42cells expose ordinary
actions in other seeds; baseline selects generic actions when it acts. These
material threat changes do not establish numerical acceptability.

SavageL90ordinaryAttack596 replaces fixedStrongMelee30–50. Both hero cells
move100draws→100defeats; median duration60s→5.1sBarbarian/6.8sSorceress.
Candidate median effective enemyDPS169.02/122.35respectively, from0.4333each.
This isolated unearned duel does not prove complete endgameW1 or earned viability.
No rewards/drops/hour measured, no pacing/economy/Hell/Act5acceptance, no tuning
or favorable-seed reruns.

Everycell n100; outcome order victory/defeat/draw. Complete DPS/TTK/duration
percentiles, transitions, per-seed resources and all recordings remain in the
paired summary/raw evidence, including null successful TTK for no-victorycells.

| Cell | Baseline → candidate outcomes | Median duration ms |
| --- | --- | ---: |
| act1.zombie / L12 / barbarian | 100/0/0 → 97/3/0 | 13860 → 12320 |
| act1.zombie / L12 / sorceress | 100/0/0 → 84/16/0 | 16500 → 16000 |
| act1.quill-rat / L12 / barbarian | 100/0/0 → 100/0/0 | 6160 → 6160 |
| act1.quill-rat / L12 / sorceress | 100/0/0 → 100/0/0 | 7500 → 7500 |
| act1.carver / L12 / barbarian | 100/0/0 → 65/35/0 | 12320 → 11900 |
| act1.carver / L12 / sorceress | 100/0/0 → 23/77/0 | 16500 → 11900 |
| act1.dark-archer / L12 / barbarian | 100/0/0 → 38/62/0 | 13860 → 10200 |
| act1.dark-archer / L12 / sorceress | 100/0/0 → 13/87/0 | 16500 → 10200 |
| act1.bone-warrior / L12 / barbarian | 0/0/100 → 0/100/0 | 60000 → 12460 |
| act1.bone-warrior / L12 / sorceress | 92/0/8 → 0/100/0 | 45000 → 10680 |
| act1.spike-fiend / L12 / barbarian | 100/0/0 → 91/9/0 | 13860 → 12320 |
| act1.spike-fiend / L12 / sorceress | 100/0/0 → 79/21/0 | 13167 → 13500 |
| act1.misshapen / L12 / barbarian | 100/0/0 → 20/80/0 | 20020 → 13920 |
| act1.misshapen / L12 / sorceress | 100/0/0 → 10/90/0 | 24000 → 13920 |
| act1.hungry-dead / L12 / barbarian | 100/0/0 → 70/30/0 | 20020 → 18480 |
| act1.hungry-dead / L12 / sorceress | 100/0/0 → 37/63/0 | 26200 → 19800 |
| act1.ghoul / L12 / barbarian | 59/0/41 → 0/100/0 | 52360 → 14880 |
| act1.ghoul / L12 / sorceress | 83/0/17 → 1/99/0 | 50000 → 14880 |
| act1.returned / L12 / barbarian | 0/0/100 → 0/100/0 | 60000 → 12180 |
| act1.returned / L12 / sorceress | 81/0/19 → 0/100/0 | 51300 → 10440 |
| act1.returned-archer / L12 / barbarian | 0/0/100 → 0/100/0 | 60000 → 11340 |
| act1.returned-archer / L12 / sorceress | 91/0/9 → 0/100/0 | 47600 → 9720 |
| act2.sand-raider / L20 / barbarian | 100/0/0 → 7/93/0 | 24640 → 13920 |
| act2.sand-raider / L20 / sorceress | 91/0/9 → 1/99/0 | 47200 → 12180 |
| act2.sand-maggot / L20 / barbarian | 100/0/0 → 6/94/0 | 33880 → 21840 |
| act2.sand-maggot / L20 / sorceress | 32/0/68 → 1/99/0 | 60000 → 20020 |
| act2.sand-maggot-young / L20 / barbarian | 100/0/0 → 100/0/0 | 7700 → 7700 |
| act2.sand-maggot-young / L20 / sorceress | 100/0/0 → 100/0/0 | 22500 → 23400 |
| act2.mummy / L20 / barbarian | 100/0/0 → 6/94/0 | 32340 → 15520 |
| act2.mummy / L20 / sorceress | 25/0/75 → 0/100/0 | 60000 → 15520 |
| act2.scarab / L20 / barbarian | 16/0/84 → 1/99/0 | 60000 → 22320 |
| act2.scarab / L20 / sorceress | 99/0/1 → 3/97/0 | 36000 → 20460 |
| act2.undead-flayer / L20 / barbarian | 0/0/100 → 0/100/0 | 60000 → 9720 |
| act2.undead-flayer / L20 / sorceress | 2/0/98 → 0/100/0 | 60000 → 9720 |
| act3.flayer / L30 / barbarian | 24/0/76 → 0/100/0 | 60000 → 9960 |
| act3.flayer / L30 / sorceress | 0/0/100 → 0/100/0 | 60000 → 8300 |
| act4.damned / L45 / barbarian | 3/0/97 → 0/100/0 | 60000 → 12460 |
| act4.damned / L45 / sorceress | 0/0/100 → 0/100/0 | 60000 → 10680 |
| act5.barbarian-savage / L60 / barbarian | 0/0/100 → 0/100/0 | 60000 → 5100 |
| act5.barbarian-savage / L60 / sorceress | 0/0/100 → 0/100/0 | 60000 → 6800 |
| act5.barbarian-savage / L90 / barbarian | 0/0/100 → 0/100/0 | 60000 → 5100 |
| act5.barbarian-savage / L90 / sorceress | 0/0/100 → 0/100/0 | 60000 → 6800 |

## Functional validation and retained failures

Initial RED:38failures/8controls across46tests, confirming missing curves,
generic suppression, required-empty schema and raised/endgame source behavior.
First related run509cases has506pass/3fail: newfixture incorrectly assumed
SandMaggotYoung elite eligibility; two decisive endgame authority fixtures
copied Savage's new Attackrange while overriding scalarAttackalone. Fix the
eligibility oracle and explicitly set both intended million-point Attack
representations in that synthetic hero. Real monster data/winning reward
assertions are unchanged. Final integrated validation is recorded below.

Frozen executed driver static check reports two TS7022comparator locals.
Immutable executed v1remains. A type-only copy adds explicitnumber/string
annotations, passes strict semantic/syntaxchecks and emits byte-identicalJS
(SHA256 4a35f3b9571bdd8a7f9c881960d5f27ec7c0b4f9df4fafcfd28c282d32785e71).
No measured replay is repeated.

Two full-typecheck attempts were deliberately stopped while still compiling
(v1after92.584s, v2after75.562s), with no diagnostic emitted. The giant inventory
JSON import was changed to bounded typed runtime test input; that alone did
not resolve slow checking. V1wrapper reported a zombie-reaping race error
despite no live descendants; exact child2188166subsequently absent. V2was
stopped by exact owned childPIDand collected exit143. Logs/receipts retained.
The established incremental cache is reused for final checking; do not cite
either interrupted attempt as a typecheckPASS or infer an unproved rootcause.

Final full engine run: 499 files / 13,545 tests PASS (wrapper exit0,
290.952s, no timeout or living owned descendants). Strict root typecheck v3
PASS in164.395s. Scoped lint v3 includes all three final test edits and PASS
in8.264s. Independent final read-only review APPROVE covers bounded semantics,
inventory, literal tier oracles, fixture correction and evidence; it does not
accept numerical balance. Final whitespace check PASS.

## Artifact ownership

Packet retained through umbrella acceptance:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Root owns eventual cleanup. Exact physical-family artifacts:

- `p15-physical-ordinary-v1-specs.json`, `-baseline-data.json`: fixed recipe/original bytes.
- `p15-physical-ordinary-plan-v1.md`, `-harness-v1.ts`, `-launcher-v1.mjs`, `p15-physical-owned-v1.py`.
- `p15-physical-ordinary-v1.{baseline,candidate}.{manifest.json,raw.jsonl.gz}`.
- `p15-physical-ordinary-v1.paired.{summary.json,jsonl.gz}`.
- `p15-physical-ordinary-v1-{baseline,candidate,compare}{.log,-exit.json,-source-before.json,-source-after.json,-verification.json}`.
- `p15-physical-{red-v1,green-v1,engine-v1,types-v1,types-v2,types-v3,lint-v1,lint-v2,lint-v3,static-v1,static-v2}{.log,-exit.json}`.
- `p15-physical-ordinary-harness-v1-typed.ts`, `p15-physical-static-v2.cjs`: static-only typed/transpilation proof.

Allmeasurement wrapperexits0; baseline17.923s,candidate8.843s,compare4.440s;
no timeouts/errors/live descendants in those runs. Compressed rawbytes
baseline13,796,799/candidate8,595,079, below256MiBcap. Exact per-mode taskVite
caches removed and absence checked by launcher. Disposable compilation caches
created solely for this increment are removed after final checks. Existing
umbrella cache/claim/sourcechanges/evidence remain; original checkout untouched.
