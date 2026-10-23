# Act III: Khalim, Orb and Guardian functional delivery

2026-10-23. Local branch `feat/playable-foundations`; validated production
revision `79002d77550ea2a7593212b50e265b6fb10f454c`. This supplements the
[earlier three-flow evidence](act3-three-quest-flows.md) under the
[compact contract](../decisions/D11-compact-act3-contract.md). All five compact
Act III quest flows now have implemented controls. Fresh earned Act III and
the full campaign acceptance remain open.

## Resulting behavior

Khalim's four source-bound components can be recovered in any order. Flail
recovery requires the actual qualified Council victory receipt. Assembly
consumes all four, retains the real Cube and creates exactly one Will. The
separate Claim grants 8000 hero / 6000 fielded-merc XP without another Will.

The explicit Travincal Orb action consumes the owned assembled Will and
publishes its action receipt atomically, retaining the Cube. It grants no XP
or Guardian completion. Khalim Claim can happen before or after this action.

Guardian credit requires an accepted native Mephisto settlement bound to the
original canonical source, living original hero and pre-event valid Orb graph.
An earlier win retains ordinary income and clear/unlock behavior without
later backfilling Guardian credit. Claim requires the full item/receipt graph
and grants exactly 18000 / 13500 XP, the private deterministic
`loot/mephisto-q` ilvl47 five-pick cache, and one owned Mephisto Soulstone.
The Soulstone is retained, has no Read control and has no Act IV consumer on
this revision. Import does not infer missing historical proof or items.

Implementation includes `f3a7bab`, `3509086`, `d40944f`, `12bfe41`, `bebb029`,
`e2f0b33` and `c2819dc`; browser controls are in `79002d7`.

## Validation

| Check at frozen revision | Result |
| --- | --- |
| Full `npm test -- --cache=false` | 9581 tests / 333 files PASS; 271.94s |
| `npm run test:engine` | 4486 tests / 121 files PASS; 41.17s; subset of full suite |
| Typecheck; full lint and engine purity | PASS |
| Production build, `VITE_E2E` unset | PASS; all four emitted JS chunks pass forbidden-debug-token scan |
| Production browser, both locales × five sizes | 30 / 30 PASS; 598.844s; zero retries, skipped, unexpected or flaky cases; report errors [] |
| Frozen source/build/HEAD integrity after browser | 2526 tracked files and 760 build files unchanged; HEAD/status unchanged |

The matrix covers Golden Bird, Blade/Tome and Council/Khalim/Orb/Guardian at
360×640, 412×915, 640×360, 1280×800 and 1920×1080. The last flow uses
**constructed level/power and ordinary-clear fixtures**, then actual UI
recovery, native Council/Mephisto encounters, assembly, Orb and Claim. It checks
early-win refusal/no backfill, exact XP/cache, retained Soulstone/no Read,
duplicate refusal, keyboard controls and exact Save→close→new-page Continue
at Will-owned, Orb-consumed, Guardian-unclaimed and Guardian-claimed stages.
These are functional tests, not an earned campaign playthrough.

The final report retains 130 JSON and 110 PNG attachments inline. Both-language
360×640 Orb and Soulstone screenshots were visually inspected. Node-side Vite
oracle startup printed WebSocket port warnings; all browser assertions passed
and captured browser errors remained empty. The first desktop attempt failed
two stale Cube-heading assertions; corrected headings passed 2/2 before the
final 30/30 matrix. Collection failures from direct JSON-backed Node imports
were corrected by using the Node-side Vite oracle without a browser bridge.

After the frozen run, the harness-only expression for the required output
environment variable changed to explicit `String(...)` coercion to satisfy
scoped ESLint. This preserves behavior for the required, present variable.
Scoped lint and typecheck were run on that correction; the production and
full-suite evidence above remains attributed to `79002d7`.

Independent read-only QA approved Orb, Guardian admission and Guardian rewards
with security PASS. Reviewers did not rerun root's full/browser suites.

## Remaining acceptance and evidence ownership

The literal exhaustive A3-10 requirement still lacks direct prewrite injection
for every Claim mutator. Manual screen-reader acceptance is unexecuted.
Suite-time budgets remain exceeded, and existing production build warnings
remain. This evidence does not close full P14/F10/C2 or a G0–G7 gate.

Earned evidence is still Act I's fresh 310-victory clear and partial Act II
ending at a Radament draw. No earned Radament/Book/Arcane/Duriel/Act III/C2
acceptance follows. Act IV implementation is underway separately; Act V,
seven-class/213-skill acceptance, economy/crafting/endgame and the 30–50-hour
fresh campaign target remain in scope.

Root-owned diagnostics remain at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-a3-delivery-clenw50l`.
`guardian-retained-evidence/` preserves reports, failure context and selected
decoded screenshots; logs, freezes, manifests and cleanup receipts remain
required evidence until Act III and umbrella-goal consumers finish. Root owns
their eventual removal. Disposable builds/browser outputs are removed after
preservation and verified in `guardian-cleanup.json`; shared caches/tools are
preserved. The preview on port4357 terminated. No push, PR, merge or deployment
was performed.
