# P17 — Optional chapter-boss unique rewards

2026-11-04. Implements the optional unique bullets of drop-tables §5 under
BUG680 and [D09](../decisions/D09-chapter-boss-optional-uniques-v1.md), on
`b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus preserved local changes.
Constructed loot/settlement evidence only; no earned campaign or balance credit.

Andariel has a25% gate followed by an ordinary chapter-boss rarity attempt with
unique weight×5. Only a unique result awards the extra item. Duriel/Mephisto/
Diablo/Baal have30/35/40/50% chances for an extra materialized unique. The
Andariel attempt includes actual gear MF and its offline multiplier. Successful
bonuses use positive, level-eligible boss-TC base weights and existing weighted
unique templates, preserving actual ilvl and template/socket eligibility.

The bonus appends after ordinary equipment, materials and rarity guarantees.
Per-call preceding rewards remain exact; subsequent shared-stream kills change
intentionally. Missing unique sources refuse the complete bag instead of
counting rare fallback as unique. Only configured matching-act chapter bosses
participate. Quest caches, other live tiers and unconfigured tables are excluded.
The closed authored JSON schema is validated on load and registered for browser
precompilation. Persistence format and public reward input remain unchanged.

## Verification

Packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p17-boss-optional-uniques-v1`.
Counts overlap and must not be added as independent populations.

| Check | Result / evidence |
| --- | --- |
| Original reproduction |15/15fail before implementation; `original-failure.log` |
| Initial implementation |15/15pass; `initial-green.log` |
| Expanded new behavior |35pass: exact gates, chance edges and following RNG, independent Andariel formula/MF, weighted bases/templates, qlvl/equip distinction, invalid/socket/source refusal, schema, complete reward preservation and cache/tier isolation |
| Component diagnosis |107pass/17stale-fixture failures; `focused-before-fixture-isolation.log`; BUG683 documents diagnosis before corrections |
| Affected loot |341/341pass across10files in8.87s; `affected-loot.log` |
| Native settlement |22/22pass in7.28s, including10ordinary+3guarantees+1forced-success optional unique and full material publication; impossible optional unique leaves inventory unchanged; `native-settlement.log` |
| Scoped strict types |Pass; `types-corrected.log`; original temporary-config type-resolution failure retained in `types.log` |
| Explicit no-ignore lint |11files pass; `lint.log` |
| Production build |Pass with VITE_E2E cleared; `production-build.log` |
| Actual offline precache |Required app chunks and PNG icons present; `precache.log` |
| Production bridge scan |Ten emitted application JS chunks pass all five existing forbidden patterns; `bridge-scan.json` |

Component fixture changes explicitly isolate the independently tested optional
policy in ordinary-count and rarity-guarantee comparisons, D08 historical pools
and a material-only synthetic table. Exact assertions, full reward equality and
following-RNG checks remain. No production configuration is disabled to pass.

Local review covered correctness, readability, architecture, security and bounded
work. No material finding remains within this slice. This is not independent
umbrella approval. Existing large-chunk/art-manifest precache warnings remain;
no performance, device installation or full P17 acceptance is inferred.

## Integrity and cleanup

All14final source/build inputs match `build-input-sha256.json` and
`source-sha256.json`; all766emitted files matched `production-sha256.json`
before cleanup. Exact disposable `production/` and `types.config.json` were
removed and verified absent in `cleanup.json`. All processes are terminal; no
server was started. Root retains the required packet and claimed human2 checkout
through umbrella review and owns eventual packet cleanup/worktree release.

No full suite, campaign replay, new agent, install, commit, push, publication or
training-budget renewal.14/14ActI,3/14five-act Normal, formal0/210 remain. Full
privatev1 is incomplete; BUG680 remains open for first-kill rewards.
