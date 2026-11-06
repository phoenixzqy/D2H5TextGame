# BUG-390 — Make both Act II retained caches executable

- Severity: High — advertised side objectives have no complete public reward loop.
- Status: Fixed locally; bounded current32 integrated acceptance APPROVED (see final acceptance below).
- Environment: Linux/WSL; local engine and React UI; zh-CN and en.
- Build: preserved feat/playable-foundations changes after accepted current31.

## Reproduction

Start the Summoner's Secret or Lost Caravan quest and visit its authored cache area.
The current public exploration UI has no supported Recover control; source-free
legacy completed flags can enable Claim without a retained physical source.

Expected: Normal Arcane Sanctuary Recover gives Horazon's retained lockbox;
Normal Far Oasis Recover gives Elzix's retained strongbox. Separate source-bound
journal Claims award respectively5000/3750 hero/actual merc XP plus Manald Heal23,
and3000/2250 plus Eye of Etlich18, once, without equipping or healing.
The physical tool remains owned. Elzix's unsupported5000gold is removed.

## Evidence and repair

Approved contracts: `docs/design/act2-retained-caches.md`, `horazon-lockbox.md`
and `elzix-strongbox.md`. Closed two-entry runtime family, explicit historical
absence and finite public dispatch precede generic handling. Retain the unchanged
v8 hero/physical journal unless a causal composition failure requires a shared fix.

Packet `d2-counted-source-z3jj3xa1/cache-content-ui-baseline-red-v1.log` records
16 failing public/content tests through existing APIs, with no missing imports.
The six corrected JSON documents pass8 content contract tests. Runtime and save
composition, independent recipient XP/gear/damage, cross-cache failure conservation
and independent review remain required before the focused checkpoint. Final broad
local checks and headed production browser acceptance follow the complete batch.

The pre-bounty reservation controls separately reproduce37 historical namespace
failures before the narrow raw-ingress guard, then pass40 tests. These prevent
successor-only bounty fields and source-free rows disappearing through historical
normalization. They grant no bounty activity.

No CI, commit, push or deployment; owner earned playtest follows implementation.

## Raw builder admission

`cache-save-root-red-v1.log` reproduces10 failures in20 controls: direct raw and
decoder validation reject the corrupt cache graph, while `buildSave` accepts six
consumed/swapped/wrong-objective/incomplete/unknown/extra-field graphs and four
accessor payloads. Validate this closed cache family at the trusted builder's raw
boundary before cache repair/normalization, preserving all independent data.

## Focused checkpoint

Closed both public loops; owner133 + independent42 + content/UI16 and root
save/historical controls pass. Independent reviews APPROVE, unresolved0 and
readersReleased. See `docs/plans/evidence/act2-retained-caches.md`. No final
batch/build/browser/full-v1 acceptance is inferred. Fara is next.

## Final acceptance

The later [integrated current32 evidence](../../docs/plans/evidence/p14-successor32.md#final-bounded-local-acceptance) supersedes pending integration notes above. `d2-counted-source-z3jj3xa1/current32-acceptance.json` retains exact source, reconciled unit coverage, green terminal checks, headed-browser evidence and cleanup. Original failures stay retained; no uninterrupted full-green, earned pacing or full-v1 acceptance is claimed.
