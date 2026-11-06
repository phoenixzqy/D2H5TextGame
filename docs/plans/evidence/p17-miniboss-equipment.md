# P17 — Live miniboss equipment

Verified locally, 2026-11-04, on `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`
plus retained changes. Implements drop-tables §3/§5.6 under
[D08](../decisions/D08-miniboss-equipment-v1.md); BUG686 is resolved locally.
Constructed engine/native settlement evidence, without campaign, economy,
pacing or formal balance credit.

The five configured mini tables now supply three noDrop0 actual-act trash
equipment draws with minima+3 and one independent noDrop0 jewelry draw. The
existing50% additional rare+ uses its unshifted source minima. Both consumers
extend terminal equipment bands only to finite act caps59/72/87/101/122, keeping
expired earlier bands expired and preserving source weights and actual ilvl.
The local rarity context3/4/8 reaches ordinary and conditional rolls, with
offline MF applied after the curve. Combat tier stays `boss`.

Accepted D10 independent rune/gem chances and quantities remain: one actual-act
rune and one gem. Act/difficulty quality caps, shard formula,6–10act-scaled
wishes, difficulty scaling and the final kill-wish gate remain unchanged.
Live equipment groups replace the historical mixed mini-table draws. Raw tables,
explicit quest caches, chapter-boss/goblin contexts and unconfigured sources
retain their authored interpretation. No persistence or earned-save changes.

## Verification

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p17-miniboss-equipment-v1`.
Counts overlap and must not be added.

| Check | Result / retained evidence |
| --- | --- |
| Original real-pool reproduction |11failed, then11passed; `original-failure.log`, `initial-green.log` |
| Boundary/source/schema coverage |19passed; `boundaries.log` |
| Final native and focused cases |52passed:19loot+33settlement; `native-boundaries.log` |
| Six affected loot files |124passed, including unchanged award snapshots; `affected-loot.log` |
| Scoped strict types |Pass; `types.log` |
| Explicit no-ignore lint |Nine files pass; `lint-final.log` |
| Isolated production / actual offline precache |Pass; `production-build.log`, `precache.log` |
| Emitted bridge scan |All13JS files pass five forbidden patterns; `bridge-scan.json` |

The19focused cases cover five-act counts/jewelry/ilvl, successful high-level
bonuses, distinct rarity weights, exact shifted minima and weighted source
boundaries, terminal caps, both50%gate branches, conditional rarity selection,
post-curve MF, schema/duplicate/typo rejection, missing/invalid sources, actual
spawn coverage across all five acts/three difficulties/manual and idle (planning
only, seed7), deterministic following RNG and cache/special-source isolation.
The conditional cap fixture has a real eligible unique: variate.89 selects rare
under272:32mini weights and unique under368:48boss weights. No snapshots changed.

Three native cases use actual Burial Grounds/Blood Raven planning and seed7,
with a constructed high-vitality hero and registered finisher. They verify the
complete inventory bag, refusal before player/merc XP on invalid jewelry and
all-domain restoration after inventory publication mutates then throws. The
full33-case settlement file passes. These are native binding/atomicity checks,
not an earned campaign or balance result.

Local five-axis review found no material issue within this slice: source
preparation is pure/bounded, authored data uses the browser-precompiled validator
catalog, conditional bonuses use the prepared finite source and local rarity
context, and the orchestrator explicitly constructs bonus input to avoid
forwarding unrelated runtime fields. Security check passes for local rewards
and existing settlement. This is local verification, not independent umbrella
sign-off. No UI was changed or campaign/browser playthrough repeated.

The initial lint run found three numeric-template formatting errors in the new
test. Explicit String conversions resolve them; `lint.log` retains the failure.
Existing large-chunk/old-Browserslist/optional-art-manifest build warnings remain;
the build does not prove runtime performance or physical-device acceptance.

All11source/data/test hashes and766build hashes match. Exact disposable
`production/` and `types.config.json` were removed and verified absent in
`cleanup.json`. All task processes are terminal; no server started. Root retains
the required packet and claimed human2 checkout through umbrella review and
owns eventual cleanup/release. Historical manifests and failure logs remain.

Previous goal turn was status-only/no progress; this continuation implements
and verifies a missing requirement. No full suite, campaign replay, new agent,
install, commit, push, publication or training-budget renewal. Counts remain
14intended ActI clears/3five-act Normal completions/formal0of210. Full privatev1
and trash loot, build viability, economy/pacing, integration, accessibility/
performance and final review/soak/user playtest remain open. Browser works;
CI excluded; no pending answer or external blocker.
