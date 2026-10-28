# Native mercenary Defiance — BUG-364

Source commit: `7a0dc92ba2c493e9f69745b44caf02f30734f1ed`.

Scope: bounded F04/F07/P13 repair of recruitable `mercs/act2-defiance`.
Base `2877f35b83ebb1e182c6e86c7bce096ca79ecddb`; root uses the existing claimed
human-worktree-2. This evidence does not close browser or earned gates.

## Contract and repair

`docs/design/gacha-spec.md:144` specifies +30% party Defense. The reachable native
mercenary carried `aura-defiance`, but runtime registered an inert self-buff.
Closed schema-first `mercDefiance.defensePct` now supplies 30 percentage points;
validated immutable resolution converts it to the additive combat fraction .30.

Fresh projection requires exact canonical merc identity, configured effective
aura and valid integer level. Battle-local IDs recheck live source eligibility
at use. One presence raises Defense for living player-party recipients, including
the source, other mercenaries and late summons. Duplicates do not multiply;
source death/absence withdraws it and fresh waves rebuild source lists. Generic
skill/buff IDs and self-only equipment grants confer no native source authority.

The contribution joins the existing shared Defense percentage sum. Selected
Paladin Defiance and paid armor remain additive; Exile's existing equipment
Defense remains self-only and supplies the ordinary equipped baseline. Existing
Melt/Inner Sight reductions, damage-type mapping, ignoresDefense and minimum-one
mitigation remain intact. Periodic damage settlement is unchanged. No second
damage path, base-stat mutation, save version or persisted marker is introduced.

Passive presence adds no action/payment/RNG draw. Removing the obsolete cast
intentionally lets Jab act sooner; same-input marker controls establish scheduling
and RNG parity, not parity with the obsolete cast sequence. Recruitment and
mercenary skill copy in en/zh-CN now state +30% Defense while the source lives.

## Causal reproduction and controls

Node 24.21.0 / npm 11.19.0, Vitest UI/jsdom and engine projects, seed 7.
Native session20155 runs real `loadMercPool` → `createMercFromDef` →
`mercToCombatUnit`, a real projected hero, default registry and a constructed
fixed200 physical hostile hit. With Defense100 the original hero loses100HP;
the GDD30% source must yield Defense130 and70HP lost. All three primary tests
fail (damage, missing native marker, inaccurate75% copy), then pass unchanged.
Primary SHA256: `a45e80927fccf082db00fab1adf062506b7e49a88b3e69c87e5d580a2d43d7eb`.

Eighteen authored cases cover strict identity/schema, malformed/conflicting
metadata, missing/duplicate definitions, alternate tuning and immutable copy.
Thirty-seven combat cases cover party kinds/self, passive cast/payment exclusion,
source eligibility/death/fresh wave/control effects, duplicate and selected-aura/
paid-armor stacking, damage-type mapping, explicit bypass/minimum-one, enemy/dead
exclusion, real Exile equipment projection, unchanged periodic damage, actual late
summon, same-topology RNG calls/tails, replay and input/base-stat immutability.

First expanded focused run returns native1:146 passed,1 failed. Its new reduction
fixture wrongly expects136 by assuming Rogue30% and omitting the existing Melt
physical1.25 combo. Authored Rogue reduction is25%; the actual result is
floor(200×1.25−100×1.30×.70×.75)=181. Only this new fixture is corrected, with a
no-native197 control added. Production source and the original primary remain
unchanged. Original logs/report/maps and `combat-test-first.ts` are retained;
`fixture-correction.json` records the diagnosis. Corrected focused147/8passes.

Two subsequent native typechecks reject the new combat test helper, first for
passing a boolean to `ignoresDefense?: true`, then for explicitly including
undefined under `exactOptionalPropertyTypes`. The final helper accepts optional
literal true and conditionally omits the field unless true. No production,
primary regression or assertion changes. Both failures, prior test copies and
correction records are retained; all final checks repeat on the corrected digest.

The first lint run rejects a newline between `it.each(...)` and its invocation
(`no-unexpected-multiline`). Removing only that newline resolves the fixture's
style issue; no assertions or gameplay change. `lint-final.log`, the pre-fix test
copy and `lint-correction.json` retain the failure. Required final checks run
again on the final digest.

## Validation and review

All final checks return native0, with before/after inputs unchanged. All2,041
tested input contents match the immutable source commit; see
`source-commit-binding.json`.

| Check | Result | Native elapsed seconds |
| --- | --- | ---: |
| Focused | 147 passed /8files | 14.59 |
| Engine | 10,896 passed /407files | 196.00 |
| Unfiltered unit | 21,462 passed +2 existing skips /1,004files | 954.62 |
| Typecheck | Pass | 109.27 |
| Lint/engine purity | Pass, zero warnings | 211.25 |
| Production build, external outDir | Pass | 13.15 |

Earlier full/engine runs pass on the prior test-helper digest; neither substitutes
for the final-digest reruns. Observed broad-check durations exceed the guide's
loop budgets; no configuration, limit or timeout is changed. Runtime/CI
performance acceptance remains pending. Build reports large chunks, stale
Browserslist data and the2.57MB art manifest excluded from precache. A successful
build does not establish offline/runtime acceptance. Actual Node20 CI is not run.

The two unchanged skipped cases are `fresh-campaign-continuation.test.ts`
("runs one declared authentic saved-domain Rocky Waste continuation and restores
its caller") and `fresh-campaign-economy.test.ts` ("runs one bounded authenticated
earned farming policy and restores its caller"). Both raw names have a leading
suite-space. No `.once.ts` entry is discovered.

All final executable inputs bind to digest
`3dd9516a99976d3f40bca602021669ca653d4e0798ff40ce821d2bd6b53a68cd`.
Actual commands, native exit codes, elapsed times, before/after input maps and
raw assertion reports are retained. Individual assertion statuses supply test
counts; Vitest's aggregate passed count includes skipped tests.

Plan review ready/security-pass/findings[], readers released; `plan-review.json`
SHA256 `4d16877c6203fef4a81ce9207afc94ed39e8f1d8f7c4e668d7052cf018df6566`.
Independent source review approves/security-pass/bounded-evidence-adequate,
findings/blockers empty, readers released; `source-review.json` SHA256
`f80beefaea9ad94ff6cd9030023a4329c3a87aa89ac2fed03edc87b941274a0c`.
The initial helper refresh `source-refresh-review.json` SHA256
`80c61e983c1dddc2a5db128546ce5e62f3ce3d7945c6e756c85b92e0b7b475c3`
predates the second typecheck failure. Final conditional-omission helper review
approves/security-pass/findings[], readers released;
`source-optional-refresh-review.json` SHA256
`3a09b9eeca198a5f8af22fd643c0eb0859fa78a769484bfe017b16ba287febba`.
The final review includes the subsequent whitespace-only `it.each` lint fix.
Final independent review: approve / security-pass / bounded evidence ADEQUATE; findings empty, readers released.
Receipt `final-review.json` SHA256 `604d8a1baf0d42578ec52c85e041b8252a4de0b388f01fe9640628eadfe28fff`.

## Limits and retained evidence

Root retains exact logs/reports/input maps, reviews and driver at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-defiance-t1ypwetq`
through unfinished umbrella consumers and owns eventual verified cleanup.
Disposable external build (762files /42,264,787bytes), applied primary draft,
status-context scratch and copied evidence draft are removed; absence verified.
Recorded command/driver/validation-queue PIDs are absent. `cleanup.json` records
exact paths/process checks and no failures. Raw diagnostic evidence and approved
next Prayer plan/review remain retained for unfinished consumers.

Browser recruitment, earned builds/economy/balance, campaign, performance/PWA,
actual Node20 CI/human/soak and full-v1 gates remain pending. The212 bounded/one
unverified player-skill inventory is unchanged. No acquisition/lineage experiment,
spent launcher/preflight/retry/replacement, closed policy or protected save/fixture
is read/replayed. H3 remains terminal `H3_PREREQUISITE_FAILED_NO_APP`; no app or
browser is launched. No publication, push, merge or deployment occurs. Goal/worktree
stay active for the remaining plan.
