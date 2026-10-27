# D06 — Dragon Flight implementation evidence

Status: local runtime/UI/lifecycle and production integration validated; independent, earned-balance and full private-v1 acceptance open.
Contract: [D06 Flight](../decisions/D06-assassin-flight-v1.md). Bug: [BUG310](../../../production/bugs/BUG-310-implement-dragon-flight-blink.md).

The original native reproduction has three failed blink observations at ranks1/2/20
and one passing paid Physical-kick control, seed7. Expanded pre-runtime branch
reproduction has21 failures/nine controls. These are behavioral REDs; the initial
missing-definition collection error is not counted as a behavioral failure.

Foundation e76ad891 validates closed JSON/schema tuning and immutable rank/display
helpers (23 cases). Runtime ea3ba9c3 adds one private, paid, half-open1s blink,
+1percentage point magical dodge per effective paid rank, at the same15MP payment
as the unchanged Physical kick. Native prerequisites/full registration and committed
shadow authority are required. Visible imported markers grant no power. Both CD
aliases, source/owner life, source side and exact expiry are enforced. No movement,
extra RNG, save shape or earned campaign change is introduced.

The33 native cases prove actual seeded Fire dodge versus same-roll scalar controls,
unchanged Physical/Thorns and periodic HP settlement, exact2700ms expiry, invalid
sources/resources/cooldowns/registration rejection, marker stripping, missed-kick
payment and actual three-charge Tiger discharge through a paid Flight kick.

[Exact receipts and hashes](fixtures/assassin-flight/runtime-checkpoint.json):

- Foundation23PASS; scoped types/lintPASS; engine10034/384PASS577.548s.
- Final runtime-related112/8PASS18.564s; native33PASS7.951s.
- Final scoped strict typesPASS8.765s and lintPASS11.084s.
- Frozen e76ad891 plus both runtime paths: engine10034/384PASS190.285s;
  all2544repository/three external inputs and HEAD unchanged. Root polled the
  original77288 tool handle terminal before committing. Engine discovery does
  not include the native store cases; their separate related receipt is required.

The prior full19833 unit gate predates Flight and is not current Flight acceptance.
Shared preview currently has three retained REDs at ranks1/2/20. Bilingual
current/next/MAX descriptions, positive finite chip, real paid Warrior/Command,
death/reflection/shield/lifecycle and production mobile/desktop combat/save/offline
remain. No skill-inventory credit, earned balance/campaign or independent approval.

Original logs, source/input hashes and diagnosis snapshots remain in the exact
root-owned Flight task recorded in the packet, needed by ongoing implementation
and final evidence consumers. Root owns eventual archive/readback and exact
cleanup after consumers finish; no cleanup of this active task is claimed.


## Shared preview, bilingual feedback and native lifecycle checkpoint

f61e9d14 adds the shared immutable Flight preview. Original branch3RED/one negative
control becomes4PASS;238related/6PASS with strict types/lint. Exact-input engine
10038/385PASS193.479s. 98416d5f adds current/next/MAX damage, magical-dodge points,
blink duration and truthful payment/miss/reset copy in both locales. Original
screen8RED→8PASS;156related/4PASS and strict types/lint. 460ad299 adds actual paid
localized positive finite combat chips:4RED→4PASS;93related/4PASS/types/lint.

acaa1cd2 adds11 native boundary and three actual store lifecycle cases. Real paid
Warrior ranks1/20 use captured skill caps and their own15MP; paid Command gives
20→21 once, including causal magical evasion at seed2. Seed5 proves additive
existing dodge; a paid rank21 window survives actual Command expiry inside its
lifetime. Reflection215 is fully absorbed by240personal shield leaving25, or
kills the unshielded1HP source and clears the observation. Target death never
retargets. Original owner death at2000ms removes Warrior's1860–2860ms blink early.
Actual allocation changes only the next wave, preserves MP/CD, and imports/flee/
town respec discard paid state. Final67related/7PASS15.009s, strict types9.625s/
lint9.955sPASS, all2549repository/three external inputs and HEAD exact.

[Receipts and hashes](fixtures/assassin-flight/ui-lifecycle-checkpoint.json).
Original test-oracle/fixture/scoped type and lint mistakes remain with diagnoses:
existing English Attack/Chinese spacing, missing matcher declarations, authored
Command11MP, unrelated pre-cast lethal DoT, guessed reflection roll and redundant
union checks. No suppression, removed requirement or source workaround was used.
Production browser/build/full unit/static checks are next; no whole Flight skill
credit, earned balance/campaign or independent approval. The active Flight task
remains needed, with root owning its eventual archive/readback/exact cleanup.

## Production and integrated checkpoint — 2026-10-27

At frozen `30c93621`, the original whole-unit consumer completed **19,919 PASS /
938 files**, two existing opt-in campaign skips,1198.063s. Full typecheck155.298s,
lint263.999s and production build17.417s pass with all2549repository inputs and
HEAD unchanged. The skips remain fresh-campaign-economy and
fresh-campaign-continuation; neither supplies campaign evidence.

Production actual-combat4/4PASS182.444s covers desktop/mobile × en/zh-CN,
ranks1/20: eight real paid blink proofs, exact first15MP spend, finite HP/MP,
positive outgoing Physical kick, actual blink expiry,16exact seven-domain save
pairs and eight actual service-worker offline Continues. All762build assets were
rehash-verified; five forbidden bridge patterns absent,758precache URLs resolve.
Existing chunk/art-manifest/Browserslist warnings remain; no performance credit.
These are constructed L30/equipment/prior-act fixtures, not earned ActV access.
Every observed outgoing kick is1Physical HP against this mitigation fixture;
this establishes a kick, not damage viability, TTK or build balance.

All32original production PNGs and all16additional scrolled stat-row PNGs were
individually viewed and hashed. The latter production4/4PASS33.032s requires
unobstructed complete current/next/MAX terms and values (including rank deltas),
duration,15MP and2s cooldown in both locales/sizes. Original failed delta-text
expectations and reports remain retained. Glyph fallbacks, navigation clipping,
lower grid rows outside the viewport and English singular copy remain limits;
no whole-app mobile/a11y/physical-touch acceptance.

`b887df95` subsequently adds four repository tests for rank1/20 crit→Physical
resistance→DEF, rejection of forged enemy personal shields, and actual reflected
215damage absorbed by valid player pools100/240. Final90/7PASS15.850s and scoped
strict types8.570s/lint8.968sPASS cover that change. The full19,919 gate predates
these four test-only additions; no19,923whole-suite pass is claimed. An original
experiment incorrectly gave an enemy a player-only Bone Armor pool. Its failure
and diagnosis remain; corrected tests use valid player reflection settlement
and explicit enemy-marker refusal without a production workaround.

[Integrated receipts, hashes, visual scope and retention](fixtures/assassin-flight/integrated-checkpoint.json).
The raw Flight task is now removed after all consumers terminated. Root retains
these exact deliverables through full-v1/independent evidence consumers and owns
their eventual removal:

- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-assassin-flight-z9y3pvvj-raw.tar.gz`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-assassin-flight-z9y3pvvj-raw-manifest.json`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-assassin-flight-z9y3pvvj-retention.json`

Archive2143regular members/163156465raw bytes individually read-back verified;
exact2143files/one shared-target symlink/36directories removed,remaining[] and
failures[]. Shared node_modules preserved;30inaccessible /proc entries disclosed.
The exact external retention driver was removed, with its source retained in
the archive. No skill-inventory credit, independent approval or campaign action;
genuineL33/Ancientsclaimed/Baaluncleared/next402 and protected save hashes unchanged.
