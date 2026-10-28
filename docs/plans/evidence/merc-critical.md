# Native Rogue Pierce critical support — BUG-368

Native implementation and automated verification, 2026-10-28.
Base: `1c65738f3dae90b3d8cf65b61fac9da1f9f28d8a` in the existing claimed
human-worktree-2. Browser, earned recruitment and feature acceptance remain open.

## Contract and repair

`docs/design/gacha-spec.md:122` promises party +5 percentage points of critical
chance and +20 percentage points of critical damage from Rogue Pierce. Closed
exact-ID `mercCritical` JSON metadata now supplies those values. An immutable
validated resolver converts the authored percentages once and registers a true
passive with no cast, action, cost, cooldown or effect list. Both locale skill
and recruitment descriptions state the living-party bonuses.

Fresh mercenary projection requires canonical `mercs/act1-rogue-pierce` identity,
the effective configured passive and a valid integer unlock level. Its marker
is transient. Battle-local IDs are rechecked for live original-player-party
eligibility; skill, buff, item, summon, owner and template strings alone provide
no authority. Living hero, source, other mercenaries and late summons qualify.
Original enemies remain excluded despite Conversion. Duplicates provide one
bonus without level, rank or star scaling. Stun and Freeze preserve living
presence; source death or removal withdraws it.

Two additive terms enter the existing shared damage input. Ordinary critical
chance and multiplier, overflow conversion, mitigation, typed and Enchant
shares retain their existing resolution and rolls. Player skills and other
mercenary bonuses remain independent. Eligibility is checked at projectile
impact, including attacker life. Pending dead-attacker impacts retain ordinary
damage without native support. Periodic and reflection eligibility remains
unchanged. Fresh hit-derived Burn snapshots retain their existing potency,
stacking and refresh rules; later source withdrawal does not rewrite a snapshot.
No saved/base-stat, acquisition, Pierce Arrow or action change is included;
the existing RNG draw order is preserved.

## Causal and focused evidence

Node 24.21.0 / npm 11.19.0, Vitest 1.6.1. The primary uses actual
loadMercPool/createMercFromDef/mercToCombatUnit/default registry with constructed
surviving held source and opponent. These are native constructed support
regressions, not earned recruitment or campaign balance evidence. All cases
use a literal 100 Fire hero attack, zero mitigation and ordinary multiplier 2.
The real pure PRNG seeds and draws were frozen before RED:

- Seed 0, critical draw approximately .000329: base chance 0 gives control 100;
  the native .05 chance gives a critical 220.
- Seed 7, critical draw approximately .061958: base chance .95 gives control
  200 and native 220, isolating the additive multiplier without overflow.
- Seed 7, base chance 1: the native 1.05 chance adds .025 to the multiplier by
  the existing excess-chance rule, giving 222 after flooring versus control 200.

Actual RED exits 1 in 11.145327 seconds: all three numeric cases fail while
control assertions pass. The raw report groups the two expected-220 failures;
no distinct received value is invented for the multiplier case. The unchanged
three-case primary GREEN exits 0 in 7.876506 seconds. Its SHA256 remains
`f849a36617b0b2cf6e4d51a1614a7d9ed87186cbee93a1bef12ae8f8c0f27f8d`.
The 2,050 RED and 2,051 GREEN input maps each remain unchanged within their run.
BUG-368 was filed after actual RED and before production edits.

The first expanded focused run exits 1: 424 passed / 1 failed across 21 files.
Only a new generic fixture assertion is wrong: a real rank-1 Oak legitimately
changes runtime maximum life from 100000 to 103000. The original source and
raw failure are retained. The bounded correction preserves the strict generic
helper, asserts the literal Oak capacity and compares exact runtime stats with
the native-disabled control. Production, primary, other manifest paths,
input-immutability and direct/recorded replay assertions stay unchanged.
Independent source/correction review approves that diagnosis and correction.

Corrected focused exits 0: **425 passed / 21 files**, in 28.042266 seconds.
The four new test files contribute 67 passing cases: authored 21, combat 41,
projection/locales 2 and immutable primary 3. Controls cover malformed,
alternate and zero tuning; immutable inputs; qualification and negative
authority; live recipients and actual late summons; duplicates and Conversion;
impact-time deaths; typed/Enchant shared rolls; player bonuses; Burn snapshots;
actual RNG probability arguments, results and tails; resources/actions and
recorded replay. Existing related damage, masteries, reflection and mercenary
suites remain in the focused selection.

## Final native validation

Engine native exit 0: **11,081 passed / 413 files**, zero failed or skipped,
in 269.778916 seconds. Full unit native exit 0: **21,658 passed /
1,014 files**, zero failed and two unchanged skips, in 1179.725474
seconds. Both retain their original 2,054 frozen inputs at
`c4e42e53928640759bf7440df80b03aca1bec1509bc9880b938bc1c3f3562aed`.
The full inventory adds exactly four new test files and 67 passing cases to the
prior Fire checkpoint. All existing file/assertion identities and skips match,
reconciling only the same two Date labels from unchanged collection-time
`new Date()` fixtures. Raw reports remain unchanged. No timeout cause or speedup
is inferred; BUG-180/366 remain Open.

The original queue stops at full lint native exit 1 in
232.945930 seconds. Only the new combat test
fails: two non-null assertion warnings and an unbound method reference.
Engine purity passes; the build never starts. The snapshot helper already
returns one enemy, but its broad return annotation loses that tuple guarantee.
Native `createRng.chance` closes over its generator and needs no receiver.
Only type declarations change: express the helper's actual one-enemy tuple,
remove two erased non-null assertions and type the observer-local real RNG.
The first receiver-free method annotation uses `this: void`; the next queue
stops at exact-file lint native exit 1 in
10.938910 seconds because
`no-invalid-void-type` forbids it. That rejected source map remains
`4acd16f05417b2d982a88740eda71ba5edfa98f643ebc93e4f7fb91c38ff2dad`.
No focused, typecheck, full lint or build runs in that queue.

A function-property declaration, `chance: (p: number) => boolean`, correctly
expresses the receiver-free callable and resolves that lint error. No cast,
suppression, runtime expression, predicate, expected value or assertion changes.
Original, rejected and final versions emit byte-identical JavaScript under the
installed esbuild 0.21.5, SHA256
`ab9497a34aaadaee7c5649006be9aee1b0205c7fdb1706480777fbb9a0cff375`,
with no warnings. Production, primary, configuration and the other 2,053 inputs
remain exact. Independent correction/validation-scope review approves retaining
the original engine/full executions at their actual source digest and running
the affected checks on final source. No final-source engine/full rerun is claimed.
Final 2,054-input digest:
`aa6d77f929fe3db605f724b25e85e82f62df85690d0ae2ff7fb3c4a8b7e3ed7d`.

All final checks exit 0 on that same frozen final input map:

| Check | Result | Elapsed execution time |
| --- | --- | ---: |
| Exact-file lint | Passed, zero warnings | 11.445339 s |
| Focused | 425 passed / 21 files | 32.712200 s |
| Project typecheck | Passed | 175.258952 s |
| Full lint / engine purity | Passed, zero warnings | 301.512966 s |
| External production build | Passed | 15.375348 s |

`native-summary.json` verifies the separate source bindings, full inventory,
immutable primary and final live inputs. All native result codes, before/after
maps, failures and preceding test copies remain retained. No configuration,
deadline, dependency, worker, isolation or environment change is used to pass.
Execution durations do not measure earned campaign pacing.

## Independent review and retained evidence

Current source/correction/security review approves the 17-path implementation
and meaningful regression coverage, with empty findings/questions and readers
released. Its approval is limited to that source stage. Plan review SHA256 `c9e59c6e03a4a52a8d97e2d23f6c13e6992b27878dac0e4d8ba9f21ca02da52e`;
source review SHA256 `65039f8cc7faf55f69d19c041949db564875a6e35bdb9843c9e00e17aecfc7c7`;
final correction/scope review SHA256 `70293af8221816080dae254dbd2aaab1ce541cdc493aeb4d27f07fa6d38c5f4f`.
The separate final source/evidence/security decision is retained as
`final-review.json`. `source-blob-binding.json` and `checkpoint-binding.json`
govern the staged and actual committed tree/blob checks. These steps grant only
their stated native checkpoint scope; no browser/earned/feature acceptance follows.

Root retains exact raw reports, logs, receipts, frozen maps, primary and failed
fixture copies, correction and review records at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-critical-mh4rugyk`
through unfinished critical-support and umbrella consumers and owns eventual
verified cleanup. After terminal writers/readers, the disposable build's
762 files / 42,273,087 bytes and
10 directories including its root are individually
hashed and removed; absence is verified with no cleanup failures. All
29 recorded PIDs are absent; the CWD audit finds no
remaining worktree process or intervention. Exact build manifest, cleanup and
process receipts remain. The external evidence draft is removed after identical
repository application; `draft-cleanup.json` retains its cleanup evidence.
Shared caches, installed tools, history and required evidence stay.

## Scope limits

Browser, earned recruitment/builds, campaign/economy, high-rune affordability,
30–50 active player hours, 14 builds across five acts, defeat/retry, whole-app
locales/devices/accessibility, performance/PWA, actual CI, human/soak and full-v1
acceptance remain unresolved. Test execution durations do not measure campaign
pacing. BUG-180/366 timeout causes remain Open; prior failures are preserved.
The 212 bounded / one unverified player-skill inventory is unchanged. H3 remains
terminal failed-no-app. No browser/app, new acquisition/lineage or replacement
experiment, protected fixture or closed-policy read/replay, push, merge or
deployment occurs. The full objective and claimed worktree stay active.
