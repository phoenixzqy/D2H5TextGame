# Native damage delivery and mercenary Frozen Armor — native checkpoints A/B

Native checkpoints A/B are implemented and verified.
Broader gameplay acceptance remains open. Parent: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`.
Contract: [D04](../decisions/D04-native-damage-delivery-v1.md).

Checkpoint A: the explicit manifest and closed Ajv2020 resolver supply native whole-skill and
basic dispositions. Private registry provenance rejects custom/stale/changed
sources without changing native skill/effect shapes or identities. Native
monster/summon and original-equipment player/merc projections carry optional
transient delivery; unknown fields are omitted. No damage dispatch, special-body
binding or Armor consumer is implemented in this checkpoint.

## Causal evidence and corrections

The independently approved literal primary was frozen against the parent with
SHA256 `98085be6506153002a2c06563b461c073b5648448e833b53b3263ca6ba13d121`.
Causal RED collected52 cases:51 positive classification failures and one passing
unknown-source case, exit1, 8.174756s, unchanged inputs. There was no collection
error or timeout. The original source and RED binding remain retained.

An initial incremental skill run passed28 and failed one: the manifest used
canonicalized Blood Raven IDs while the installed source retains raw hyphenated
IDs. Independent review approved the exact raw-key correction;29 selected cases
then passed. The full primary subsequently passed52 before the latest corrections.

Independent review found a comparator gap: extending a source array with a hole
preserved its enumerable keys. An explicit length check now rejects this change.
Supplemental regressions cover native effects/base mutation followed by reload
and a changed same-ID MonsterDef. The correction has independent source approval.

The first supplemental run passed247 and failed3. Complete direct-registry
coverage found an omitted retained `amazon.piercing_strike` stub; the design spec
explicitly calls it Strafe, supporting its authored ranged disposition. Two test
assumptions were corrected: omit Decoy's invalid optional bonus0, and distinguish
the14 supported weapon decisions from the12 types with actual item bases.
All three corrections were independently approved. Corrected focused252 passed.

Scoped lint then rejected two optional adapters in the frozen primary because
their type intersections made today's API required. Independent review approved
removing only the erased `typeof registry &` / `typeof weapons &` type tokens.
Runtime calls, optional behavior and assertions remain identical. The corrected
candidate and installed primary match SHA256
`7b2d7061ba5d698488a7e6c8239e1f275f477654678eb06a5fa30afc8505921f`.
Supplemental sparse-array allocation/callback-brace lint corrections were also
independently reviewed. The original primary remains retained.

Type checking exposed explicit unknown delivery values under exact optional
properties. Both factories now compute once and omit the field when undefined;
the narrow CombatUnit type is preserved. Store regressions assert absence.
Independent review approves this correction. Failed predecessors remain retained.

The broad engine run passed11638 and failed3 across430 files. Terminal diffs
contained only eight added `basicAttackDelivery: 'melee'` fields: six historical
skeleton bodies and one each for native Radament/Summoner. Independent review
approved exact expectation corrections. PREPATCH, the shared recording oracle,
full equality, life/stat/timing/order/RNG assertions remain intact; modified
historical boss definitions now explicitly require absent delivery. Corrected
historical58 tests across3 files and their scoped lint pass.

## Current validation

Three new test files contain96 cases: primary52, engine supplemental33 and actual
player/merc projections11. Coverage includes all final native direct-damage
skills, at most one direct primitive per whole skill, all109 monster basics,
19 native templates plus provisional special bodies, replacement/mutation/reload
and stale-object behavior, semantic/identity preservation, complete authored
weapon coverage, actual Rogue fallback/Arrow distinction, real equipment bases,
independent equipment maps and unchanged source/stat/save shapes.

Final focused252 tests across7 files pass with no failed/pending/todo cases.
Scoped lint passes with zero warnings. Both use unchanged permitted2105-input map
`588baf4f43030126deed8e20045e6355293307fe296de65f77d342b31adf1e7b`.
The boundary audit passed1012 test files/1602 source modules before the final
lint/exact-optional corrections. Final types, full lint and external Vite/PWA build
pass on that same map. The build retains chunk-size, Browserslist and oversized
precache warnings; it does not establish performance or PWA acceptance.

The three reviewed test-only corrections produce permitted input map
`7b4511384f94b76103a73f64dd65840e74175427d7669124ec0358e038e64739`.
Historical58/3, scoped lint and corrected types pass on unchanged inputs. The
audited ordinary unit suite passes21532 tests across1012 files, zero failed or
pending, in1068.720720s. Before/after maps are byte-identical; its task-owned
driver/npm processes are absent. Independent producer review approves the
terminal receipt, full report/log and exact unchanged input maps. Ordinary units
include the engine project; the failed predecessor remains retained.

## Checkpoint B — native dispatch and mercenary Frozen Armor

The independently approved B contract binds whole-strike dispatch, authenticated
special-body classification and mercenary Frozen Armor together. Authored Armor
is active/self, CD6, zeroMP, ranks1–20 with flat Defense120. The copied immutable
definition grants potency only after an ordinary paid action by an actual
factory-qualified Iron Wolf with its native loadout. It adds personal Defense
before percentage/Melt/Inner Sight/Battle Cry without changing authoritative
stats. Potency carries between waves in the current run; fresh qualification
loss strips only the new input, restoration requires a fresh cast, and a new run
starts unpaid. Already paid potency keeps its captured definition through a
later registry replacement.

One landed hostile direct whole melee strike with positive prebarrier damage
Chills a surviving attacker once, including when the wearer dies. Weighted
components remain one strike; hit-sequence attempts are independent. Area melee
contacts each direct recipient. Primary melee binds the original recipient
before settlement and cannot transfer after a miss, death or skip. Projectiles,
auxiliary releases and ambient/reactive damage cannot contact. Basics use native
delivery independently of basicHit. Only the successful private special-body
commit classifies Hydra as spell and Decoy/Spirit as none; provisional bodies
remain unknown. Frozen recording hashes preserve all other serialized fields.
The existing player Frozen Armor predicate and consequences are unchanged.
Fresh equipment projection strips stale delivery and omits unknown; captured
bare-merc fallback continues to work after owned-merc removal.

The original actual pool→factory→combat primary was frozen at SHA256
`0eeaf85deca421c54f37ed234f1995a6dc27c47588bd3300ed7b3544e0fe19cf`.
Causal RED failed all six intended assertions: damage280 instead of160 at1700ms
and missing melee Chill, at literal ranks1 and20; there was no collection error.
BUG-378 records the native defect and remains Open for broader acceptance.

The first B broad engine run passed11708 and failed5 across433 files. The five
failures were historical placeholder-identity assumptions or a generic schema
fixture using Armor's newly reserved ID. Independent review approved the exact
four-file test-only corrections; corrected183/4 passed. Earlier supplemental
failures were traced to duplicate synthetic equipment IDs, an incorrect Chill
refresh-source assumption and a control's incidental basic attack shifting RNG.
Independent review approved the precise fixture/control corrections while
retaining numerical, source, count, timing and RNG assertions. Failed runs and
all correction manifests/diffs/applied receipts remain retained.

The final focused run passed449 tests across16 files, zero failed/pending,
in30.469160s. The boundary audit passed1019 test files/1610 source modules in
4.997319s, and the external Vite/PWA build passed in18.715074s. All three have
byte-identical before/after2113-input map
`989d5ce5d5f8c506518ac64a565e36bf2aff8aa2229b7a363f73d394cbe6627b`.
Independent producer review approves these terminal results. The build retains
its existing chunk-size, Browserslist and oversized-precache warnings and does
not establish performance/PWA acceptance. After readers released the build,
`armor-build-cleanup.json` records762 files/42316288 bytes removed and verifies
the exact external build root absent.

Typecheck and lint exposed only new test-helper typing/syntax issues. The final
one-line correction removes an already-narrowed DamageEvent's redundant kind
conditional while preserving the complete target-list assertion. Independent
review approves every correction; original frozen primaries remain retained.
Final installed strikes SHA256 is
`b187f90dbb5f5da462f48093b43b67769ab95bce42646e45add639a6958c8637`.
Types pass in132.380432s and full lint passes in258.565843s, with complete logs,
byte-identical before/after2113-input map
`8e8762502f3ed0940b10391bbf5c8e502c7f3a2987fd74397a1c4f19b97fa73d`
and absent driver/npm processes. This map differs from the focused/build map
only in that reviewed one-line test-helper simplification; production is identical.

The audited ordinary B unit suite passes21631 tests across1019 files, zero
failed/pending/todo, in1160.851176s. All1019 file statuses and21631 assertion
statuses are passed; the complete log has no failure, timeout or unhandled-error
markers. Before/after maps are byte-identical on the final2113-input map above,
and the driver/npm processes are absent. Independent producer review approves
the terminal receipt, complete report/log, exact unchanged maps and final v7
binding. Report SHA256 is
`3e2c8a0369ff41ed449695bb12b0cf3769534cefdf724223302fa87c97773ba6`.
Required evidence is retained under the `armor-unit-final` label.

Carry fixtures
use imported survivor stats, a synthetic finisher and a depleted-entry seam;
restoration holds only the synthetic hero to allow the carried cooldown to
expire. They prove constructed native mechanics, not earned play. Browser,
campaign pacing, balance, device/locale/a11y, actual CI, human and full-v1
acceptance remain unresolved.

## Retention and unfinished work

Required sources, failure/correction reviews, native reports/logs/maps and runner
remain at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-native-delivery-njav4t8c`.
Root retains this evidence through unfinished acceptance and owns eventual
exact-path cleanup. The disposable external `build` directory was created,
then removed after independent readers released it. `build-cleanup.json` records
762 files/42312961 bytes removed and verifies the exact root absent. Required
logs, reports, maps and failure/correction reviews remain retained.

Checkpoints A/B implement native metadata, dispatch and mercenary Frozen Armor
together. Broader acceptance is still open. Browser and earned campaign acceptance, economy, build viability, pacing,
defeat/retry, device/locale/a11y, performance, PWA, actual CI, human playtest,
soak and full-v1 acceptance remain unresolved.
H3 remains terminal failed-no-app; no app/browser/retry, protected fixture,
diagnostics/closed matrices, new acquisition/lineage/gameplay replacement run,
remote/deployment or worktree action is authorized by this evidence.
