# P15 — Native monster Bone Prison

BUG426 fixed locally. [Contract](../decisions/P15-monster-bone-prison-v1.md).
The old genericStun becomes a dedicated2s source-owned trap after a landed
native10–20Arcane hit. Both composed dodge pools become0 inside the interval;
ordinary85%accuracy remains. Actions/channels lock, independent periodic spells
and already launched projectiles continue. Single target/CD4/zeroMP/min1/spell/
no flight/no combo tags preserved. Metadata mercenary→monster corrected.

Private per-target/per-source intervals require an exact immutable registered
skill/effect and living original catalog consumer. Imported markers/player copies/
replaced bodies confer no authority. Overlap expires independently; source death
retains trap, target death clears it. Conversion uses ordinary hostility while
preserving original monster identity. JSON owns duration, no new effect primitive
or save shape. GlobalStun and separate learned playerPrison unchanged. Locales
explain2s action/channel lock and both dodge pools; localized status chip is a
debuff. No dependency/network/publication/CI change or balance acceptance.

## Verification

Native RED15intendedFAIL/3controls across18,26.805s. Initial green381PASS15.328s
includes18native/292loader/71registry. Expanded final57PASS18.508s (28native/
27resolver/2localized playback/UI) verifies exact expiry/action at2500ms, paid
intervals, typed dodge0+ordinary miss, aliasCD/ManaBurn, actual nativeBoneAsh/
Diablo bars, foreign/clone/marker rejection, overlapping sources, source death,
real cast→channel interruption, field continuation, flying projectile, real16seed
hit/miss replay/input isolation and Concentration remaining ineffective against
prison. Nineconsumerfiles253PASS33.373s cover playerPrison/status/definition,
Concentration, boss/native store assembly, monster buffs/resurrection/projectiles.
Finalstrict types9.032s and sevenTSfile lint15.938s PASS. Earlier full typecheck
187.119s and final-v2incremental8.037s also PASS; final-v3 includes all new tests.

Chromium4locale/viewport probes42.437s PASS: zh-CN/en ×360×640/1280×800. Eight
localized actual1700ms paid/3700ms expiry checks; purple trap chip, no horizontal
pageoverflow, no page/console/request errors. Four hero-card screenshots retained;
en360visually inspected. Constructed probes render actual native events, not
an earned route. Existing fixtureStun remains separately visible; the new skill
grants no Stun. No claim of whole-screen typography or earned pacing acceptance.

## Frozen matched diagnostic

96fights/arm: L20bossBoneAsh/Diablo native/probe ×16seeds plus two16seedcontrols.
Synthetic2000HP80AttackheroAS100/zero defense/resists/dodge/crit/no skills,60s/
1000actions. No drops/rewards/earned/pacing inference; no outcome-based reruns.
32wins19losses45draws unchanged in aggregate; fourdraws→defeats and fourdefeats→
draws. Prison0→644, heroactions1882→1561; enemyactions2533→2546. Logged direct
114450→113236, periodic3151→3268. Total simtime3987620→4005920ms. Replacing
Stun removes its chance1 status RNG draw; control duration/RNG/path changes alter
later hits, so aggregate direct delta is not a damage-range change. Logged direct
is not effectiveHPremoved. Probes/native cells are not independent campaign data.

| Cell / arm | W/L/draw per16 | Direct / periodic | Prison / heroactions | Logged DPS | Victory TTK p50/p95 s (n) |
| --- | --- | ---: | ---: | ---: | --- |
|act1.bone-ash:native baseline|0/0/16|14579/0|0/497|15.186|unmeasured (0)|
|act1.bone-ash:native candidate|0/0/16|14516/0|122/438|15.121|unmeasured (0)|
|act1.bone-ash:probe baseline|0/4/12|29852/0|0/475|31.491|unmeasured (0)|
|act1.bone-ash:probe candidate|0/4/12|28994/0|159/393|30.530|unmeasured (0)|
|act4.diablo:native baseline|0/0/16|23669/2781|0/371|27.552|unmeasured (0)|
|act4.diablo:native candidate|0/0/16|23594/2898|187/269|27.596|unmeasured (0)|
|act4.diablo:probe baseline|0/15/1|32636/0|0/367|39.450|unmeasured (0)|
|act4.diablo:probe candidate|0/15/1|32418/0|176/289|38.417|unmeasured (0)|
|act1.tainted:control baseline|16/0/0|4754/370|0/93|32.410|8.50/15.30 (16)|
|act1.tainted:control candidate|16/0/0|4754/370|0/93|32.410|8.50/15.30 (16)|
|act1.dark-archer:control baseline|16/0/0|8960/0|0/79|66.716|8.50/11.90 (16)|
|act1.dark-archer:control candidate|16/0/0|8960/0|0/79|66.716|8.50/11.90 (16)|

Standalone comparator-v1 recomputes192raw rows/384input-recording hashes,
96equalinputpairs and32whole-row exactcontrols. Source733→734, exact10paths;
oneJSONrow/oneprepended schema clause, single stubremoval/registration/newmodule,
fourlocalized metadata entries and private runtime integration only. All other
schema clauses/source hashes/catalog rows and287installed payloads exact.

## Corrections and retained evidence

- Channel fixture initially usedL20below FireWall'sunlock and invalid5000ms
carry duration. Native-v2 had53PASS/1failure; v3baseline checks exposed both
invalid imported spells. Replaced synthetic carries with actual level30paid
casts at400ms, plus baseline controls proving real pulses. V4assertion still
counted the legitimate immediate400ms Inferno pulse before500ms prison; bound
assertion to500–2500ms. V5passes and proves interruption rather than absence of
an eligible spell. No production workaround was made and measured arms unchanged.
- Dodge fixture expanded after RED to force only the first native hit, give
both dodge pools80%, then observe ordinary85%threshold inside/outside. Separate
ordinary-miss and real16seedtests preserve uncontrolled hit/miss evidence.
- Lint-v1 flagged two unbound mocked RNG methods; explicit spies corrected them.
Final-v2 flagged copied UI's always-true2000<60000conditional; made expiryassertion
unconditional. Final-v3lint/types PASS; no assertion removed or test skipped.

All wrappers collected with no live owned descendants; both arm caches absent.
Packet: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1
Root retains exact p15-monster-bone-prison-* originals/author/driver/launcher,
measured JSON/raw gzip/comparator/logs/receipts/screenshots/browserreport through
umbrella private-v1 acceptance; owns cleanup. Existing typecache/claim retained.
Next: high-level skill scaling and earned five-act/14-build/pacing/defeat-retry.

p15-monster-bone-prison-driver-v1.ts: `7989f46b7123609891e849b2f5da42dbdfd7482ebf36ea1ecfc95590174dbbd2`

p15-monster-bone-prison-baseline-v1.jsonl.gz: `55048dc868196623bea85ca9261d5f7c294b7d21245d6b887de47e899fa41407`

p15-monster-bone-prison-candidate-v1.jsonl.gz: `bc8bc4cb463032924cd33e4baf28af08fdc1125577ffc2d8d1c64acbae3ebb64`

p15-monster-bone-prison-compare-v1.json: `cb093aa416df7d518e6bab28acaa198d46d14326df7803a822d02be231715221`
