# P15 — Seven monster periodic-damage payloads

BUG421 implementation and bounded diagnostic verified locally. Numerical and
earned campaign acceptance remain open. [Contract](../decisions/P15-monster-dot-family-v1.md).

Seven JSON-backed rank-one/zeroMP native hits now author positive finite Ignite,
Poison or Plague using the existing shared status consumer. Bolt/Ball/Arrow/
Inferno: .10 for3000ms; Cloud/Dagger/PlagueSpit: .05 for5000ms, chance1/one
stack each. All seven direct ranges/CD/targets/projectiles/delivery and absent
native tags remain unchanged. Divergent catalog fields normalize to native
values; old burn/poison labels normalize to emitted Ignite/Plague. Installed
archetype metadata also corrects mercenary→monster for these seven. All281other
installed skills remain structurally exact. Resolver-owned copied payloads are
frozen; installed projectile projections intentionally make mutable copies.
No combat primitive, save format, dependency or monster bar changes.
BloodRaven custom arrow, FireBreath/PoisonSpit and merc arrows remain separate.

## Functional verification

New30native combat +29resolver cases cover aliases/direct/CD/delivery, final-hit
potency without double mitigation, typed dodge, finite lifecycle, native bars,
replay/plain parity/input isolation, real16seed Arrow refresh with distinct later
potency retaining the first positive value, and real PlagueSpit→periodic hero
death→ally Poison spread. Strict source validation and copying are exercised.

Initial RED21intendedFAIL/7dodgecontrolsPASS26.112s. First green failed schema
strictRequired compilation (190loaderFAIL/102PASS), and named a nonexistent
inventory test path; explicit property definitions repaired the schema.
Green-v2fourfiles352PASS25.819s; added native edge cases30PASS22.762s;
17consumerfiles428PASS107.349s; final schema/native/resolver/loader fourfiles
354PASS18.059s. Scoped lint final --max-warnings=0PASS23.472s after removing
an initial nonnull warning. First strict types PASS347.875s; final incremental
PASS207.748s, exit0/no owned descendants. No full-current-suite clean claim: the earlier engine
sweep's eight stale failures were separately reconciled before this increment.

## Frozen matched diagnostic

512fights/arm: seven realL20trash definitions ×native and isolated single-skill
probe ×32seeds0–31, plus Tainted/DarkArcher controls ×32. Synthetic2000HP/80Attack
hero,AS100, no skills/gear/defense/resists/dodge/crit; native60s/1000actions limit.
Natural/probe cells overlap and are not independent campaign samples. No rewards,
drop rate, earned builds, pacing, or balance acceptance is measured.

296wins/178defeats/38draws→291/198/23: five wins→defeats and15draws→defeats,
no beneficial transitions. Adverse rows occur only in Salamander/SerpentMagus/
SwampDweller/Infector cells. Direct649274→626530; periodic944→60039, including
59095new selected damage (baseline944 is the unchanged Tainted control).
Logged direct+periodic650218→686569 (+5.5906%); smaller direct totals reflect
changed fight durations, not direct-range tuning. Periodic events331→16557;
enemy actions9921→9625; simulation duration16998920→16503032ms. Logged damage
is not effective HP removed. DPS uses summed simulation seconds; victory TTK
uses nearest-rank p50/p95 only among wins. Crit/dodge fractions use incoming
hero-target direct-damage events, not outgoing hero attacks.

| Cell / arm | W/L/draw per32 | Direct / periodic | Logged DPS | Victory TTK p50/p95 seconds (n) | Crit/events; dodge/events |
| --- | --- | ---: | ---: | --- | --- |
|act2.salamander:native baseline|1/31/0|65961/0|54.020|40.80/40.80 (1)|21/751; 97/751|
|act2.salamander:native candidate|0/32/0|63663/2543|56.298|unmeasured (0)|21/725; 95/725|
|act2.salamander:probe baseline|1/31/0|65961/0|54.020|40.80/40.80 (1)|21/751; 97/751|
|act2.salamander:probe candidate|0/32/0|63663/2543|56.298|unmeasured (0)|21/725; 95/725|
|act3.serpent-magus:native baseline|20/0/12|47506/0|26.626|52.70/59.50 (20)|32/1026; 171/1026|
|act3.serpent-magus:native candidate|20/2/10|47409/5964|30.000|52.70/59.50 (20)|32/1023; 170/1023|
|act3.serpent-magus:probe baseline|18/0/14|50101/0|28.172|51.00/59.50 (18)|41/1027; 142/1027|
|act3.serpent-magus:probe candidate|17/6/9|49920/6021|31.585|51.00/59.50 (17)|41/1024; 142/1024|
|act1.dark-ranger:native baseline|32/0/0|9162/0|13.962|20.40/28.90 (32)|21/386; 58/386|
|act1.dark-ranger:native candidate|32/0/0|9162/4086|20.189|20.40/28.90 (32)|21/386; 58/386|
|act1.dark-ranger:probe baseline|32/0/0|9162/0|13.962|20.40/28.90 (32)|21/386; 58/386|
|act1.dark-ranger:probe candidate|32/0/0|9162/4086|20.189|20.40/28.90 (32)|21/386; 58/386|
|act4.mega-demon:native baseline|0/32/0|66657/0|65.312|unmeasured (0)|20/630; 84/630|
|act4.mega-demon:native candidate|0/32/0|63183/3429|69.451|unmeasured (0)|19/591; 73/591|
|act4.mega-demon:probe baseline|0/32/0|66657/0|65.312|unmeasured (0)|20/630; 84/630|
|act4.mega-demon:probe candidate|0/32/0|63183/3429|69.451|unmeasured (0)|19/591; 73/591|
|act3.swamp-dweller:native baseline|32/0/0|39039/0|35.603|34.00/42.50 (32)|19/605; 84/605|
|act3.swamp-dweller:native candidate|31/1/0|39039/3674|38.963|34.00/40.80 (31)|19/605; 84/605|
|act3.swamp-dweller:probe baseline|32/0/0|39039/0|35.603|34.00/42.50 (32)|19/605; 84/605|
|act3.swamp-dweller:probe candidate|31/1/0|39039/3674|38.963|34.00/40.80 (31)|19/605; 84/605|
|act3.fetish:native baseline|32/0/0|15568/0|22.500|22.10/28.90 (32)|9/416; 57/416|
|act3.fetish:native candidate|32/0/0|15568/3784|27.969|22.10/28.90 (32)|9/416; 57/416|
|act3.fetish:probe baseline|32/0/0|15568/0|22.500|22.10/28.90 (32)|9/416; 57/416|
|act3.fetish:probe candidate|32/0/0|15568/3784|27.969|22.10/28.90 (32)|9/416; 57/416|
|act3.infector:native baseline|0/26/6|64899/0|37.826|unmeasured (0)|34/982; 136/982|
|act3.infector:native candidate|0/30/2|59438/6039|41.421|unmeasured (0)|31/903; 125/903|
|act3.infector:probe baseline|0/26/6|64899/0|37.826|unmeasured (0)|34/982; 136/982|
|act3.infector:probe candidate|0/30/2|59438/6039|41.421|unmeasured (0)|31/903; 125/903|
|act1.tainted:control baseline|32/0/0|11035/944|34.373|10.20/18.70 (32)|6/173; 23/173|
|act1.tainted:control candidate|32/0/0|11035/944|34.373|10.20/18.70 (32)|6/173; 23/173|
|act1.dark-archer:control baseline|32/0/0|18060/0|63.614|8.50/11.90 (32)|8/144; 19/144|
|act1.dark-archer:control candidate|32/0/0|18060/0|63.614|8.50/11.90 (32)|8/144; 19/144|

All1024raw rows and2048input/recording hashes independently recomputed; all512
paired inputs equal. All64whole-row controls and64event-pairs exact. Every
seed0cell replay/plain and A/B/A verified. Source730→731 with exact seven JSON
rows, seven stub removals, registration/new resolver and eight new schema
constraints; all unrelated runtime sources remain exact. Independent read-only
review passes source/metrics/hashes/scope and finds no material runtime gap.
This does not constitute numerical balance signoff.

## Diagnostic corrections retained

- Driver used result.winner directly as an outcome key although draws are null;
  its draw/null summary counters are invalid. Raw recordings/inputs remain valid.
  Authoritative comparator-v3 recomputes all outcome counters from all raw rows
  and verifies other metrics. No battle arm was rerun or tuned.
- The first strictRequired repair accidentally added a redundant projectile $ref
  to an existing global conditional as well as four intended selected clauses.
  Comparator-v1 correctly rejected this unrelated structural change. The exact
  measured candidate schema is retained. Final schema restores the old clause
  exactly; the root property already applies the same reference, so removing this
  duplicate does not change validation/combat. Comparator-v3 verifies the exact
  captured→final bridge and all other current measured-source hashes; all old
  clauses remain exact after the first eight new constraints. Final354schema/
  native tests pass. First repair assertion matched two clauses and stopped
  before repository write; a dependent comparator-v2 invocation still ran and
  failed MODULE_NOT_FOUND because its script had not been created. Logs retained.
- Baseline launcher logged a nonfatal WebSocket port collision; middleware SSR
  completed. Candidate launcher changed only hmr:false; combat driver unchanged.
  Both arms exited0, no live owned descendants, and both owned caches absent.

## Retained provenance and lifetime

Packet: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1
Root retains this umbrella evidence/typecache until full-v1 acceptance; it is not
disposable yet. Exact p15-monster-dot-* driver/launcher, arm JSON/raw gzip,
production-before, measured-schema capture, comparator-v1/v2/v3 logs and process
receipts are retained. The successful comparator-v3 JSON is authoritative.

p15-monster-dot-driver-v1.ts: `b7f021ee175816b8c495e95b5beb0fde5f77f8fb5d0d49766deb68291795ab15`

p15-monster-dot-baseline-v1.jsonl.gz: `82f11dffa6f6cb96bcc9eb2ddc67c8a4ea6ce9ef6c7820fd197b15c1a8ed860f`

p15-monster-dot-candidate-v1.jsonl.gz: `69e007522f43cc5d2896de1f6852dc16c66c91e82d3b72d2402a1f56357b267f`

p15-monster-dot-schema-captured-v1.json: `bada78eebb1393664c3da57bb62f7377f3ee6d96bfc41f56640f5ffc07032367`

p15-monster-dot-compare-v3.json: `6326abdffd11c0d168b648c96cf5b9c675496379a640f96f3961ead01bff3cca`

All verification sessions collected. Both arm caches verified absent. Umbrella
worktree claim, packet and shared task typecache remain retained by root.
