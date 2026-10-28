# Native mercenary Fire Mastery — BUG-367

Native implementation and automated verification, 2026-10-28. Browser/earned/feature acceptance remains open.
Base: `4ef060b7ff38fda906ad026438e68cd7b4258707` in the existing claimed
human-worktree-2. BUG-367 stays Open for browser/earned/feature acceptance.

## Contract and repair

`docs/design/gacha-spec.md:120` promises +25% party Fire damage from the
recruitable Iron Wolf — Fire. The native passive had no damage consumer,
registration, qualification or authored coefficient. Closed exact-ID
`mercFireMastery.fireDamagePct` metadata now supplies 25. Validated immutable
resolution converts percentage points once and registers a true passive:
all-allies, no action, cost, cooldown or effect list. Both locale skill and
recruitment descriptions state the party 25% bonus while the mercenary lives.

Fresh projection requires canonical `mercs/act3-iron-wolf-fire` identity,
effective configured skill and valid integer unlock level; its transient
marker is not saved. Battle-local IDs and live eligibility exclude original
enemies, dead/removed sources, summons/owners/templates and bare skill/buff
strings. Stun and Freeze do not withdraw living presence. Duplicate sources
provide one bonus without level/rank/star scaling. Living original player-side
hero, source, other mercenaries and late summons share the bonus.

One additive Fire-only term joins ordinary shared damage-input assembly.
Existing class Fire Mastery, Warmth, selected auras, typed weighted shares,
Enchant, mitigation and critical rules retain their own paths. Impact-time
source and attacker life are checked; a dead mercenary's pending projectile
still deals ordinary damage without the new bonus. Existing death/action/
projectile ordering remains unchanged. Fresh hit-derived Burn snapshots the
enhanced hit once; existing stored potency, stacking/refresh and periodic Fire
are not directly multiplied. No save/base-stat/RNG/timer/resource/acquisition
or Fire Ball change is included.

## Causal and focused evidence

Node 24.21.0 / npm 11.19.0, Vitest 1.6.1, seed 7. The primary uses actual
loadMercPool/createMercFromDef/mercToCombatUnit/default registry, with constructed
surviving held source/opponent and a literal 100 Fire hero attack. These are native
regressions, not earned recruitment or balance evidence. Actual RED is 100 instead
of 125, with missing qualification and inaccurate copy; all 3 cases fail, native exit 1
in 15.256596 seconds. The unchanged primary GREEN passes 3, native exit 0 in 10.294173 seconds.
Primary SHA256 `0849492e4f884b94f153fe9372c9c3197a29276a149af88d19735237a2a82863`.
The 2,046 RED inputs and 2,047 GREEN inputs each remain unchanged within their run.

The first expanded focused run passes 237 / fails 2; only new combat fixtures are
corrected: Fire uses Defense, not magicResist, and attackSpeed 200 means 900 ms.
The independent stacking oracle remains 218 and selected Holy Fire/native gives 185.
The next expanded run passes 248 / fails 4; only new fixtures change: use an allied
mercenary with surviving protagonist for dead-attacker impact, observe actual
integrated Burn damage instead of assuming status-state emission, use
OnHitStatus.durationMs = 3000, and account for real Fire Wall refreshes at 1,000 / 2,000 ms.
All raw failures and preceding test copies/correction receipts are preserved;
production and the original primary remain unchanged throughout corrections.

The first corrected focused run exits 0: 252 passed / 12 files in 33.301536 seconds.
Authored 18, combat 42 and store 3 new cases join unchanged related suites.
Literal Burn integrals 36 and 92 prove the fresh 12/s snapshot; pre-existing
Fire Wall stored 10/s with 1→2→3 stacks and expiry 5,000 ms integrates 120 for
both enabled/control. Additional controls cover malformed/alternate/zero metadata,
immutable values, nonfire types, negative authority, duplicate/dead/removed sources,
actual late summons, player/selected passives, weighted/Enchant shares, projectile
and same-time death boundaries, periodic Fire and actual RNG calls/tails/action/
resource parity. Temporary summon-template changes are restored within the test.

## Final native validation

Engine native exit 0: **11,019 passed / 411 files**, zero failed or skipped, in
417.437091 seconds. Full-unit native exit 0: **21,591 passed / 1,010 files**, zero
failed and two unchanged skips, in 1,288.747755 seconds. Both preserve all 2,049
original final inputs at
`d544a998614883c6057efff486e4ded6bb21da92398f940c7e8f03d0361cde63`.
The full inventory adds exactly the three new Fire test files and 63 passing
cases to the prior 21,528-case baseline. Existing assertion identities match
after reconciling only the same two unchanged collection-time `new Date()`
labels. Raw reports remain unchanged; no timeout cause or speedup is inferred.

The original queue then stops at native typecheck exit 2 in 124.981387 seconds:
new combat-test lines 209/228 filter `dot` plus target, but the conjunction does
not narrow the recorded event union before reading `amount` (TS2339). Only two
explicit `e is Extract<typeof e, { kind: 'dot' }>` annotations are added to the
existing callbacks. Assertions, predicates, expected values, production, original
primary and the other 2,048 inputs remain unchanged. Preserve both diagnostics
and the preceding source/native receipt/maps.

The first TypeScript-emission byte-equality attempt is unsuccessful: both
outputs have no diagnostics but different byte hashes. That result remains
preserved. The installed Vite/Vitest esbuild 0.21.5 transforms before/after into
identical JavaScript, SHA256
`fbfecedb33a31f4ca575da55a2634a3e0548c8e2f142e34be81c221d74779f0d`.
Independent correction/validation-scope review accepts retaining original
engine/full execution evidence at its actual digest and rerunning affected
focused/static/build checks; it does not relabel the old native executions.

The intermediate corrected focused native exit 0 passes 252 / 12 files in
29.063632 seconds; project typecheck exits 0 in 124.231695 seconds. Their source
digest remains `fa1dcf4ed721f80b52263d4cb623f4fbbe02b23b1a4b0c5e3e344f82679e3e5a`.
The subsequent full lint exits 1 in 268.260841 seconds with exactly two new-test
errors: array-type syntax at line 242 and unsafe return of a library-any spy
result at line 253. Engine purity passes. Preserve that failure and preceding
source. Build does not start after the lint failure.

Only `Array<ReturnType<typeof track>>` → `ReturnType<typeof track>[]` and an
explicit `unknown` return annotation on the opaque spy-result mapper are added.
The original equality assertion still compares all actual returned values.
No cast, suppression or runtime expression changes. Original, intermediate and
final test versions all produce the same esbuild JavaScript hash above, with
no warnings. Independent lint-correction review approves the correction and
retaining original engine/full evidence at its actual source digest. Final input
digest: `30a6d65dd4f6f60d87c997b3e5519e93585f14301ce1147d2399a76152b8dbd7`.
All other 2,048 inputs, including production, original primary and configuration,
remain unchanged. Exact-file lint exits 0 in 8.252350 seconds.

Final corrected checks all exit 0 on the same 2,049 frozen inputs:

| Check | Result | Elapsed execution time |
| --- | --- | ---: |
| Focused | 252 passed / 12 files | 20.425872 s |
| Project typecheck | Passed | 124.601395 s |
| Full lint / engine purity | Passed, zero warnings | 241.771280 s |
| External production build | Passed | 15.606921 s |

These are execution durations, not earned campaign or pacing measurements.


`final-native-summary.json` and `corrected-native-summary.json` retain the separate
source maps and validation chain. No deadline, configuration, worker, dependency,
environment, assertion or runtime change is used to pass these checks. No native
engine/full execution on either corrected source version is claimed.

## Independent review and retained evidence

Current plan readiness: ready/security-pass/findings[]/readersReleased,
plan-review.json SHA256
`dac19ee99f0b9f6ef0aafbff4f7ee8a72a11068ff12f7d8e34cdfe56f6474bc3`.
Exact 16-path source-stage review: approve/security-pass/findings[]/questions[]/
blockers[]/readersReleased, source-review.json SHA256
`dd9f7ee12e1885296445ce0af5184e21fb55d60e481cf30726bcfbe75ec938e9`.
It approves proceeding to final validation, not final results or browser/earned/feature closure.
The separate final source/evidence/security decision is retained as
`final-review.json` in the packet below. The local checkpoint uses
`source-blob-binding.json` and `checkpoint-binding.json` to bind staged/committed
Git blobs to the frozen inputs. Those steps grant only their stated native
checkpoint scope; no browser/earned/feature acceptance is inferred.

Root retains exact raw logs/JSON/native receipts/before-after maps, primary and
failed fixture copies, corrections, scripts and review receipts at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-fire-mastery-eoew8i06`
through unfinished Fire/umbrella consumers and owns eventual exact-path cleanup.
The disposable external build's 762 files / 42,270,096 bytes and 10 directories
including its root are individually removed after hashing; absence is verified,
with no cleanup failures. All 34 recorded process IDs are absent, and the task
CWD audit finds no remaining process or intervention. Exact build manifest,
cleanup and process receipts remain retained. Task-owned evidence/ledger drafts
are removed after identical repository application; `draft-cleanup.json` records
that disposal. Shared caches, installed tools, history and required evidence are kept.

## Scope limits

Browser/earned recruitment/build acceptance and full v1 remain open. BUG-180 / BUG-366
timeout causes remain Open; earlier native failures remain unchanged. The prior
Prayer full-unit prerequisite passed, as separately recorded in
[full-workload evidence](full-workload-timeouts.md), without a timing-fix claim.
The 212 bounded / one unverified player-skill inventory is unchanged. Earned campaign/
economy/high-rune mix/affordability,30–50 active hours, 14 builds × five acts, defeat/
retry, whole-app locales/devices/a11y, performance/PWA, actual CI/human/soak and
full-v1 gates remain unresolved. H3 remains terminal failed-no-app; no app/
browser, new acquisition/lineage or replacement experiment, protected fixture/
closed-policy read/replay, push/merge/deployment occurs. Goal/worktree stay active.
