# BUG-387 — Complete Nihlathak’s physical relic recovery route

- Severity: High — advertised side quest and ratified treasure reward have no executable path.
- Status: Resolved locally for bounded current29 functionality; independent design/source/save/QA reviews approved.
- Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus preserved local changes.
- Environment: Linux/WSL static source/cross-reference reproduction.
- Browser/viewport: not applicable to this source-routing reproduction.
- Locale: authored English data names obsolete Halls of Anguish/Pit of Acheron; zh-CN/en need the canonical route.
- Seed: not applicable to missing source routing; eventual unique uses existing deterministic quest seed.
- Affected systems: content-designer, engine-dev, frontend-dev; root integrates.

## Reproduction

1. Read `quests/side-act5-nihlathaks-treasure` at
   `src/data/quests/side.json:273–282`. Its fetch references
   `areas/act5_halls_of_anguish`, has no object target and requests
   `quest/nihlathak_relic`.
2. Cross-reference `src/data/quests/items.json`: no bound relic definition
   exists. `areaQuestTools` at `src/features/quests/interactObject.ts:69–74`
   lists only cataloged items at canonical objective areas; no Recover source
   can be offered for this quest.
3. Inspect the same quest’s `itemDrop:'items/unique_amulet_endgame_q'` against
   `src/features/quests/claimReward.ts:270–285`: execution supports the closed
   unique object, not this placeholder string.
4. Compare the ratified obligation at
   `docs/design/compact-act5-contract.md:323–339` and the qualified Nihlathak
   source at `src/data/quests/act5-runtime.json:33–39`.

Expected: after the existing qualified Nihlathak victory, actually Recover the
relic in canonical Crystalline Passage, complete the single fetch, then separately
Claim 12000 hero XP, existing 9000 prior-fielded merc XP and one deterministic
Mara’s Kaleidoscope ilvl 82, preserving its reqLevel 67 and authored stats.

Actual: the obsolete area/no target/missing item catalog prevents any supported
recovery; the reward placeholder is also unsupported. Generic tool recovery
alone preserves an in-progress status, so data wiring alone would not complete
the single fetch. Flags do not establish an earned physical source.

## Evidence and repair boundary

Producer’s read-only source cross-reference and independent design-contract
investigation reproduce the unavailable route. Relevant authority is
`hasAct5Completion` in `src/engine/save/act5-state.ts:46–56`; it requires the
qualified Prison graph, not historical completion alone. Existing Mara template
at `src/data/items/uniques.json:5069–5091` confirms reqLevel 67, +5 each core and
+25 fire/cold/lightning/poison/arcane, with no physical resistance.

[Proposed concrete contract](../../docs/design/nihlathak-treasure.md) preserves
the ratified mechanics and defines one retained archival relic, finite cache,
terminal Recover, separate guarded unique/XP Claim and scoped physical rollback.
No runtime, source, tests, build, save freeze or ledger change is part of this
documentation card. This is static reproduction, with no browser/gameplay,
exploit execution or earned campaign acceptance claim. Accepted28 and independent
design APPROVE are prerequisites for runtime/save29 work.

## Implementation checkpoint

Accepted28 precedes the captured literal28 freeze/equality handshake. Canonical
cache/tool/locales and protected terminal Recover are implemented; focused
Recovery/Drognan/loader98 tests pass and independent bounded source review
APPROVE. Save29 graph/migration and scoped unique/XP Claim are integrating.
Browser, final integration checks and bounded acceptance remain pending; this
checkpoint does not resolve the bug or imply earned campaign acceptance.

## Consolidated verification findings

On final frozen local current29 source, `npm run typecheck` exits2 with nullable
captured-hero accesses, string-indexed equipment slots, an optional equipSlot
test fixture set to undefined, and two native browser fixture versions still28.
Evidence: retained N packet `typecheck-v1.log`. This is a static TypeScript
failure, without browser/viewport/seed applicability; owners are producer and
save-domain. Correct the types/fixtures without changing reward behavior, then
rerun strict types and affected checks before acceptance.

Headed Chromium at360×640 zh-CN imports successfully and performs Inspect,
receive-potion and Thaw, then the external driver times out before entering
combat. Its unconditional Act V accordion click collapses the already-expanded
section. Failure DOM shows all five acts collapsed; this is a driver navigation
error, not browser-launch or game-path failure. Preserve `browser-v1/result.json`
and `failure-dom.txt`; root will navigate according to actual expanded state and
rerun with a fresh profile. No gameplay success is claimed for this attempt.

Corrected types-v2, full lint8GiB and final build-v2 pass. Independent bounded
type-delta review APPROVE confirms no reward behavior change. Final headed
browser-v3 passes both locales, real six-wave Prison victory, separate keyboard
Recover/Claim, exact rewards, inert repeats and Save/export/IndexedDB/import/
actual close/reopen Continue. The original failed checks remain recorded. Full
ordinary units remain pending, so the bug remains in progress. Independent final
browser evidence is ADEQUATE and captured UX APPROVE. The visible supplement
shows the named Owned relic and disabled Claimed control, with exact saved state
unchanged. A prior supplementary reimport-fill timeout is retained; its cause is
unestablished and it is not treated as a production regression. Browser profiles
and the final build are removed after hash verification/readers release; every
owned server port is closed.

## Local resolution

Final uninterrupted `npm test` exits0:1082 files/22900 tests. All2845 final
source/config hashes match before/after and acceptance. Strict types, full lint,
production build, independent source/save/physical rollback/type-delta reviews,
headed production browser and cleanup pass. Exact receipt:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-nihlathak-dcl_p0vd/current29-acceptance.json`.
The earlier failed attempts above remain diagnostic history. This resolves the
relic/reward route; imported capabilities do not prove earned campaign pacing,
balance, full-G5, offline/PWA or owner playtest acceptance.
