# P07 — Cold Mastery personal resistance penetration

2026-10-24; implementation `db3976b1550f113138f1544474dee2e707c0fcac`, after861db8e, branch
`feat/playable-foundations`. Root implementation and self-review only;
independent design/source/QA acceptance remains pending. No remote publication.

## Delivered behavior

[D05](../decisions/D05-cold-mastery-v1.md) explicitly reconciles the old
resistance-reduction description, unused damage metadata and missing runtime.
The Sorceress keeps level30 unlock and20allocated-rank cap. Her own direct cold
hits ignore15resistance percentage points at rank1,19at rank2 and91at cap.
The4point growth is a new recorded design reconciliation, not prior approval.

Closed JSON metadata owns base/growth. Strict schema validation reserves it for
exact Cold Mastery, excludes paid/active/status payloads and permits only an
empty compatibility scaling object. An immutable primitive definition and exact
alias resolver select the maximum valid positive integer allocation once.
Class/level eligibility is applied at authoritative hero composition.

Damage subtracts personal cold penetration before existing act penetration and
the[-100,75]resistance clamp, then ordinary magic mitigation/floor. It never
changes target stats or shares a curse with an ally. No passive action, cost,
cooldown, marker or RNG is added. Other elements and normal recovery remain
independent. Ordinary recordings stay frozen; allocation/removal applies next
wave. Explicit replay uses original pools/carry, with no refill or accumulation.
The projection is transient; save20 and historical schemas remain unchanged.

Bilingual descriptions explain personal scope, base, growth, cap and unlock.
Current/next rows show resistance ignored, including15→19and19→23(+4%). Exact
allocation aliases also control UI rank; legacy skills do not infer allocation.

## Behavioral evidence and corrections

- Original production-factory regression:6fail/10controls pass. All allocated
  cold probes incorrectly dealt40against50resistance/10MR. The fix yields
  40/55/59/131at ranks0/1/2/20.
- Corrected schema RED:2fail/14controls pass. The first draft omitted required
  description and is retained separately, without a causal-schema claim.
- Bilingual UI RED:16fail/2controls pass. Final focused78/5files pass, including
  the immutable definition, schema, production composition, native lifecycle
  and both-language detail controls.
- Real rank20IceBolt at seed7 deals43/58/139at Mastery0/1/20, retaining Chill,
 10MPcost and exact hit/range/critical/status RNG calls. Cap/negative resistance,
  act penetration, all six other damage types and target immutability are covered.
  A real merc factory's cold hit stays40beside the hero's131.
- Native allocation/removal/explicit replay controls preserve the entire current
  recording and original resource/carry baselines. Native save snapshots contain
  no combat penetration field.
- Strict Ajv initially rejected a missing local property reference; the branch
  now refers explicitly to the root definitions. Removing scaling entirely made
  the imported catalog type optional in existing consumers; an empty scaling
  object fixes that at the data source without edits to unrelated consumers.
- Two additional test-fixture assumptions were corrected: seed7's second actor
  legitimately misses, so the two-landed-hit ally control uses seed1; full native
  snapshot equality fixes Date.now rather than comparing changing timestamps.
  Earlier failed logs remain intact. No product assertions were weakened.

## Final serial checks

| Command | Result | Wrapper wall time |
| --- | --- | ---: |
| `npm run typecheck` | pass |32.584s|
| `npm run lint` | pass, zero warnings |72.558s|
| `npm run test:engine` |5481/163pass|55.569s|
| production build, `VITE_E2E` unset, owned outDir |pass;7JS bridge scans clear|10.982s|
| `npm test` |11281/424pass;2existing skips|389.223s|

The full Vitest report's duration is388.00s; engine54.45s. Existing3s/15s
test budgets, bundle warning and oversized-manifest precache warning remain
unresolved. No performance/PWA or required-CI acceptance follows.

The initial typecheck failure is preserved. Its child had already terminated
when the first diagnostic wrapper was interrupted: the wrapper unnecessarily
rehashed every source once per path. Only its verified task-owned Python PID
was signaled, with no live children. Corrected wrapper performs one hash pass
per stage. Final checks finish normally with1089source/config/test hashes
unchanged throughout; the interrupted wrapper is not a passing gate.

## Production browser

Installed Playwright Node runtime drives the production UI; Python browser
package is unavailable. Repository `with_server.py` owns preview4403 lifetime.
No test bridge, private browser-store write or combat launch is used.

The10-case matrix passes English/Chinese at360×640,412×915,640×360,1280×800,
1920×1080, with zero retries, page errors or console warnings/errors. Each case
checks the fresh L1lock, imports an explicitly constructed L30/two-point copy of
an actual fresh UI export, allocates ranks1/2, reads truthful current/next/prose,
and performs manual Save→confirmed Saved→close→new-page Continue. There is no
invented equipment or earned-progression claim. Derived stats come from normal
production equipment composition.

Root audit validates all40native exports and10exact durable pairs. Gear,
currencies, materials, mercs, map, formation, endgame and resource stats remain
unchanged by skill allocation; only existing skill points/ranks persist. The
projection is absent from saved players. All1089source hashes still match.

Screenshots show longer English copy puts stat rows below the initial view.
Two additional360×640cases import the actual passed rank2saves and verify normal
scrolling fully exposes current19%and next23%(+4%) inside the content viewport.
Both languages pass with zero browser/console errors; representative prose and
stat screenshots were visually inspected by root. This is bounded functionality
and reachability evidence, not comprehensive manual accessibility acceptance.

## Retention and limits

The [durable packet](fixtures/p07-cold-mastery/packet.json) and its verified raw
archive retain scripts, reports, failed attempts, screenshots and exact source
hashes. Raw diagnostics remain root-owned at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-cold-mastery-z8mtwgmg`
through independent Cold Mastery review/full-v1 integration; root removes them
when those consumers finish. All task processes are terminal, preview4403 is
closed, exact task-owned dist/downloads are removed, cleanup remaining[] and
failures[]. Shared tool caches and installed tooling are preserved.

This closes the missing runtime path locally; it does not accept the new balance
decision independently. No earned level30 proof, two-build/class balance or full
213-skill acceptance is claimed. The retained earned Sorceress remains level24,
so her Radament damage/progression is unaffected. No new ordinal was spent.
C0/C1 remain accepted; earned ActsII–V/C2, C3/C4 and fullG0–G7 remain open.

## Independent bounded review — 2026-10-27

`[COLD-MASTERY-BOUNDED-REVIEW]: APPROVE` at `7c01aceb`. The independent
design-contract reviewer inspected D05, production source, five regression
files and the retained reports without running tests, gameplay or a browser.
No material design/source blocker was found for personal direct penetration,
level-30 eligibility, allocation aliases, transient composition, resistance
pipeline, lifecycle or display. The archive SHA/byte count and all 86 unique
regular member sizes/hashes match the packet. Historical reports retain the
original REDs and later passing gates; they are not current-head runtime QA.

The reviewer accepts `15 + 4 × (rank − 1)`, cap20/91, as **provisional authored
tuning**. The +4 growth is a new reconciliation, not equivalent to the old
4% damage payload. Earned progression, class/build comparisons, final balance,
fourteen viable builds and full-v1 acceptance remain open. No human balance
sign-off is implied. The reviewer released all readers and created no scratch
or persistent processes; root retains original evidence for full-v1 consumers.

The one documentation finding was recorded before correction as
[BUG323](../../../production/bugs/BUG-323-sync-cold-mastery-design-contract.md):
the old skills-spec row still promised flat/shared-looking −15% and level12.
That row now summarizes D05's personal scope, growth and level30. The inventory
uses the existing `bounded-functional;independent-acceptance-open` disposition
and explicitly retains runtime-QA/campaign-balance flags. This yields 212
bounded-functionality records and one unverified Cobra record, across all 213
unique skill IDs; it does not accept all skills or C3.

Independent follow-up `[COLD-MASTERY-DOC-SYNC]: APPROVE` checks the correction,
all213uniqueIDs/212bounded/oneunverified and only this CSV row changed. No
blocking findings; historical packet/runtime source unchanged, diff check passes.
Readers released without writes, runtime tests or scratch.
