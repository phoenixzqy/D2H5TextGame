# P15 — Monster Heal and lightning Paralyze evidence

BUG422 fixed locally, numerical/earned campaign acceptance pending.
[Contract](../decisions/P15-monster-heal-lightning-v1.md). Heal now restores
floor30%maxLife on a living injured self, CD4/zeroMP, using existing eligibility/
floor/clamp/no-RNG consumers. No heal_self permanent marker. Native Bolt50–70/
CD2/500ms, Storm30–50/CD3/all and Lightning40–60/CD2/single now apply one-stack
chance1 Paralyze1000ms; shared5000ms residual gives50%repeat rejection. Native
direct ranges/CD/targets/projectiles/delivery and absent tags remain exact.
JSON's old Heal30flat, Storm40–60/CD4 and Lightning40–65/all/CD3 normalize to
native plus explicit zeroMP. Storm/Lightning metadata also corrects mercenary
→monster. All284other installed payloads structurally exact. Registration list
iteration order shifts when four old entries move to the new module; production
listSkills consumer only builds a Set. Monster bars/curves remain exact.

## Verification

Native RED14intendedFAIL/8compatibilitycontrols across22cases,11.110s. Completed
fourfile green402PASS12.634s includes17resolver/22native/292loader/71registry.
Native suite later expanded to27PASS9.765s: heal floor/clamp/full/dead/cooldown/
ManaBurn/selfscope/no-RNG; aliases/delivery/direct/projectile/status; targetscope,
exact half-open expiry action, controlled and real16seed repeataccept/reject,
replay/plain/input isolation. Actual Cantor/DarkElder bars retain natural Heal
starvation; exposed probes prove the payload, not natural reachability.

Twelveconsumerfiles335PASS/1staleFAIL across336cases35.463s. BUG423records the
ActI-affix assertion still expecting no shared Lightning status; literal oracle
updated, complete31case file PASS11.704s. All other consumer files passed;
original broad command remains failed, no one-shot clean sweep claim. Final
strict types9.065s and sevenTSfile lint --max-warnings=0PASS12.055s.

## Frozen matched diagnostic

192fights/arm, five realL20subjectsnative/probe ×16seeds0–15 plus two controls.
Cantor/HorrorMage trash; DarkElder/Beetleburst/Mephisto boss-tier stressfixtures.
Synthetic2000HP/80AttackheroAS100,no skills/gear/defense/resists/dodge/crit.
Probes expose one skill; healers start10%maxLife. Native60s/1000actions limit.
No rewards/drops or earned/campaign/pacing inference. No tuning/outcome-based
arm reruns. Native/probe cells overlap, not independent campaign samples.

64wins/47defeats/81draws→64/36/92:12defeats→draws, one draw→defeat. Logged
selfheal0→83361 across392events; Paralyze0→905; heroactions4511→4339, enemy
4811→5043. Direct243372→234287; periodic4574unchanged. Simtime8017151.765→
8403294.118ms. Exposed Heal replaces a permanent one-time marker with repeated
healing actions, so healing and changed ordinary-attack opportunities both
contribute. Lightning consumes residual RNG; do not infer directrange tuning
from aggregate changes. Logged damage is not effective HP removed. DPS uses
summed simulation seconds; nearest-rank victoryTTK p50/p95 only among wins;
crit/dodge denominators are incoming hero-target direct-damage events.

| Cell / arm | W/L/draw per16 | Direct / periodic / healed | Paralyze / heroactions | Logged DPS | Victory TTK p50/p95 seconds (n) | Crit/events; dodge/events |
| --- | --- | ---: | ---: | ---: | --- | --- |
|act2.cantor:native baseline|0/0/16|15824/2039/0|0/516|18.607|unmeasured (0)|20/560; 82/560|
|act2.cantor:native candidate|0/0/16|15824/2039/0|0/516|18.607|unmeasured (0)|20/560; 82/560|
|act2.cantor:probe baseline|0/0/16|24953/0/0|0/560|25.993|unmeasured (0)|23/560; 82/560|
|act2.cantor:probe candidate|0/0/16|17100/0/7363|0/560|17.812|unmeasured (0)|21/384; 59/384|
|act2.dark-elder:native baseline|0/0/16|16646/2165/0|0/517|19.595|unmeasured (0)|38/576; 85/576|
|act2.dark-elder:native candidate|0/0/16|16646/2165/0|0/517|19.595|unmeasured (0)|38/576; 85/576|
|act2.dark-elder:probe baseline|0/16/0|32530/0/0|0/396|46.916|unmeasured (0)|48/412; 51/412|
|act2.dark-elder:probe candidate|0/5/11|30318/0/75998|0/555|31.860|unmeasured (0)|44/387; 50/387|
|act2.horror-mage:native baseline|16/0/0|13357/0/0|0/273|26.858|30.40/42.90 (16)|12/278; 36/278|
|act2.horror-mage:native candidate|16/0/0|15395/0/0|105/269|26.608|34.40/54.30 (16)|14/326; 47/326|
|act2.horror-mage:probe baseline|16/0/0|12364/0/0|0/272|26.739|28.90/35.70 (16)|14/259; 42/259|
|act2.horror-mage:probe candidate|16/0/0|12106/0/0|79/266|26.771|27.20/39.10 (16)|18/252; 41/252|
|act2.beetleburst:native baseline|0/0/16|22735/0/0|0/560|23.682|unmeasured (0)|51/544; 80/544|
|act2.beetleburst:native candidate|0/0/16|22926/0/0|293/413|23.881|unmeasured (0)|49/544; 71/544|
|act2.beetleburst:probe baseline|0/16/0|33945/0/0|0/268|72.793|unmeasured (0)|35/268; 40/268|
|act2.beetleburst:probe candidate|0/16/0|33834/0/0|90/293|65.251|unmeasured (0)|25/298; 50/298|
|act3.mephisto:native baseline|0/0/16|24956/0/0|0/513|25.996|unmeasured (0)|54/608; 78/608|
|act3.mephisto:native candidate|0/0/16|23866/0/0|176/409|24.860|unmeasured (0)|57/608; 100/608|
|act3.mephisto:probe baseline|0/15/1|32348/0/0|0/464|40.166|unmeasured (0)|50/522; 70/522|
|act3.mephisto:probe candidate|0/15/1|32558/0/0|162/369|40.196|unmeasured (0)|50/525; 70/525|
|act1.tainted:control baseline|16/0/0|4754/370/0|0/93|32.410|8.50/15.30 (16)|3/77; 12/77|
|act1.tainted:control candidate|16/0/0|4754/370/0|0/93|32.410|8.50/15.30 (16)|3/77; 12/77|
|act1.dark-archer:control baseline|16/0/0|8960/0/0|0/79|66.716|8.50/11.90 (16)|4/70; 8/70|
|act1.dark-archer:control candidate|16/0/0|8960/0/0|0/79|66.716|8.50/11.90 (16)|4/70; 8/70|

Standalone comparator-v2 recomputes all384raw rows/768input-recording hashes,
metrics/transitions and192equal input pairs. All32whole-row controls exact;
64recording-equal pairs also include naturally starved Cantor/DarkElder cells.
Source731→732: exactfourJSONrows, five prepended schema constraints (all old
schema clauses unchanged), fourstubremovals, registration/newmodule only.
Every unselected runtime source and installed skill matches. Arm sources stable,
seed0percell plain/recorded replay and A/B/A verified. Both owned caches absent,
all completed wrappers have no live owned descendants. No balance signoff.

## Corrections and retained evidence

- Driver-v1's first Cantor lookup wrongly named Act3; it failed before any fight
  or arm artifact. Driver/launcher-v2 correct only that ID/act and artifact/cache
  versions. Both measured arms use the same driver hash; no outcomes were chosen.
- Initial edit script wrote the four JSONrows/newmodule then asserted because
  its schema needle also matched deeper indentation. It stopped before schema/
  registry edits. Green-v1 was inadvertently launched on that partial state and
  repeated14old native failures plus300passing cases. Root completed the exact
  anchored schema and registration change; subsequent green passed. No runtime
  fallback or outcome tuning was introduced. Logs retained.
- Comparator-v1 assumed registry array indexes stayed fixed and rejected moved
  skill registration order. Comparator-v2 compares unique canonical IDs and
  verifies all284unselected payloads, with all other checks unchanged. Registration
  enumeration is not combat priority; the sole production listSkills caller
  constructs a Set. Both measured arms retained unchanged.
- Lint-v1 found unsafe expectation-map returns and an unbound mocked method.
  Typed assertions/spy fixed them; lint-v2 found one remaining compound-filter
  narrowing error. Explicit event type guard repaired it; final lint/types pass.
- BUG423stale expectation is test-only; the old failed broad run remains recorded.

Packet: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1
Root retains exact p15-monster-heal-lightning-* drivers/launchers, original five
production files, measured arm JSON/raw gzip, comparators, logs/exit receipts
and umbrella task typecache until complete-v1 acceptance. No task process or
arm cache remains. The worktree claim remains active for the umbrella goal.

p15-monster-heal-lightning-driver-v2.ts: `93fb400a8be1f770dc5ee32089aeb30cfc1d59b07dea34adcc797ea1b77f6d4e`

p15-monster-heal-lightning-baseline-v2.jsonl.gz: `a4873ae4b922a43f4a9e825b3051a2717ae4023f711e500bf2d171b77360c36a`

p15-monster-heal-lightning-candidate-v2.jsonl.gz: `d7c3176142f46661863410dcf788875bbfbe5061d3be9623cfe97a54f3b41ce3`

p15-monster-heal-lightning-compare-v2.json: `c3d137372a87dc987efcb0baab40a7c0ecfdb5182e074f08a09ee6df215e3d6d`
