# Native mercenary Prayer — BUG-365

Source checkpoint: `af71980f69561a472fdf033088ceb7f0209bb465`. **Unaccepted; BUG-365 stays Open.**

Current update, 2026-10-28: the separately reviewed unchanged full-workload run
passes the native full-unit prerequisite. Browser/earned/feature acceptance
remains pending. Earlier failures below are preserved history; see
[the terminal follow-up](full-workload-timeouts.md) and the update at the end.

Scope: bounded F04/F07/P13 repair of recruitable `mercs/act2-prayer`.
Base `79d58fae1e876b271c18e580449a8e62d40d6403`; root uses the existing claimed
human-worktree-2. This evidence does not close browser or earned gates.

## Contract and repair

`docs/design/gacha-spec.md:129` specifies flat5 party HP/s. The native aura was
an inert self-buff; recruitment incorrectly advertised5% HP per turn. Closed
schema-first `mercPrayer` authors amount5 and interval1000ms. Validated immutable
resolution supplies the true passive registry and independent native timer.

Fresh projection requires exact canonical merc identity, effective configured
aura and valid integer level. Battle-local IDs recheck living player-side,
non-owned/non-summoned mercenary eligibility. Duplicate sources supply one
presence. Source death/removal withdraws it and fresh waves rebuild the full
first interval. Skill orders, buff/item IDs and summon ownership confer no
native authority. No saved marker, base-stat mutation or save version is added.

The native deadline participates independently in simulation boundaries. Periodic
damage/deaths and selected ambient pulses settle first, with their battle-end
checks preserved; native healing then precedes later tied projectiles/actions.
Current living player-party members, including source, other mercenaries and late
summons, receive shared `commitHealing` restoration in registration order. Actual
healing caps at missing life; dead/full/invalid targets produce no restoration or
resurrection. Due empty pulses advance rather than bank healing. Winner/action/
time cap rules remain authoritative, including a due60000ms pulse only when
ordinary active combat reaches that boundary.

Selected Paladin Prayer/Cleansing retain their distinct5000ms recovery,
rank scaling, ownership and original hero/merc allowlist. Native healing never
occupies the selected aura slot or deadline. Ordinary active healing, pooled
periodic damage and exact selected Meditation recovery keep their existing
settlement. Presence adds no action/payment/RNG draw. Removing the inert cast
intentionally allows Jab sooner; same-survival-topology controls compare actual
actions/timestamps and RNG, while UI delay hints may change with added events.
Both locale surfaces now state flat5HP each second while the merc lives.

## Causal evidence and corrections

Node24.21.0/npm11.19.0, seed7, bounded native UI/jsdom and engine tests. The real
loadMercPool/createMercFromDef/mercToCombatUnit/default-registry primary checks
an injured projected hero among surviving held participants. RED exits1 with
all3cases failing: no heal, no marker, false5%-per-turn copy. Unchanged GREEN
passes3; hero receives actual5HP at1000/2000/3000ms and none at entry.
Primary SHA256 `72abba52a5b855dc7ba2a329a03c3010d0c2a4cd9c8dd6386029d1b7ca9fd1a7`.

The first expanded focused run passes202/fails3. Its new Cleansing fixture omits
required magicDodgePct, so existing strict validation correctly refuses the
projection; using real composeStatAura fixes its authority. AttackSpeed188 means
996ms, not1000; using the existing clamped2000ms action allows exact ordering
against native1000/2000ms pulses. Added healing changes adjacency-derived UI
delays; comparing action content and actual simClockMs while excluding only
uiDelayMs tests real scheduling parity. Only the new fixture changes; production
and original primary stay unchanged. Original raw failures, prior test copy and
fixture-correction.json remain retained. Corrected focused205/11files passes.
Two further controls cover ordinary paid healing and unchanged cumulative poison/
exact selected Meditation recovery across additional boundaries.

The first engine run returns native1:10,956passed/2failed across409files,
with all2,045 inputs unchanged. Warmth's obsolete undefined-trigger Prayer
assertion fails because native Prayer is now a true passive. Preserve the old
fixture, migrate the unchanged action/buff-count/mana assertions to existing
Blessed Aim and explicitly assert its authored blessed_aim buff ID. Extend
imported-hero passive exclusion across Might and Prayer. Independent narrow
review approves/security-pass/findings[], all17 earlier source hashes unchanged;
receipt118c3d77dc7b14346ce7dd272d56a1efb9afb8d2a8a827e2a9f59608e277b85e.

The other engine failure is the existing compile-laziness5000ms timeout. After
the compatibility correction, focused246passed/1timeout across13files, including
Warmth39 and Prayer35 passing. The unchanged isolated save test also times out
at5011ms. All three raw attempts remain retained; cause is not attributed to
host load or Prayer solely from the timeout. No timeout/config/dependency change.

A bounded outside-repository module-only profile, with original Ajv methods
wrapped only to record and delegate real calls, measures cold import7122ms and
35calls, including the first shared skill-schema compile1877.5ms. No save-root
schema compiles at import. First-invalid validation473ms compiles current24 once
(348.7ms); valid55.8ms/mutated-invalid32.8ms/repaired49.0ms cause no more compiles
and retain expected validation results/errors. Earlier simpler diagnostic
measures import5386ms/first validation305ms. These diagnostics locate startup
cost and show the lazy-save contract holds in that diagnostic; they do not
substitute for the failing native test or establish regression causality.
Raw profiles and unchanged input receipts remain retained; no gameplay/app/
browser or acquisition/lineage experiment is involved.

## Validation and review at the original checkpoint

Completed final-byte checks preserve all 2,045 executable inputs at
`680a938e050fcbec4617ee865e0083ea17d0bf3a6a8dd1a7998953bc5baeacf3`.

| Check | Result | Native elapsed seconds |
| --- | --- | ---: |
| Focused feature | 246 passed / 12 files | 37.83 |
| Engine | 10,959 passed / 409 files | 437.26 |
| Typecheck | Pass | 305.99 |
| Lint / engine purity | Pass, zero warnings | 602.65 |
| Production build, external outDir | Pass | 43.14 |

The final engine run passes the untouched save-schema test (4,901ms file duration),
close to its 5,000ms test limit. Its prior failures and unresolved cause remain
retained. This is an unchanged native pass, not evidence of a production
performance repair; no additional profile is required solely because previous
attempts were slow.

The unfiltered final suite returns native1 after 2,280.44s: 21,525 passed,
three failed and two existing skips across 1,007 files. Both BUG-180 entry cases
time out at the unchanged 5,000ms limit (player-first 5,049ms; inventory-first
5,003ms). The material-source report's existing constructed control also times
out (5,008ms), separately recorded in BUG-366. No assertion mismatch is reported
for these failures; their phases and causes remain unresolved. The untouched
save-schema assertion passes with reported duration 5,095ms; this is not a
performance fix or evidence that its earlier timeouts are resolved.

All six final checks preserve the same 2,045 inputs. The two skips are the
unchanged fresh-campaign continuation and economy cases; no .once entry is
discovered. test-summary-final.json SHA256:
`0b0c8bf51e20ec8ed21cc397b0b7e870cad9706c3840b0b5054cb60a0a670958`.
Raw failures remain retained. Full validation and Prayer closure remain open;
the source commit preserves the reviewed implementation without acceptance. A separately reviewed native
13-case module-entry CPU diagnostic completed; its limited result follows. The point resource
observation records CPU pressure without establishing causality.

The one reviewed CPU diagnostic runs the entire existing 13-case module-entry
file using the normal UI/jsdom setup, worker bounds, isolation, two resetModules
entries and unchanged 5,000ms deadlines. Native exit0: 13passed /1file, with
player-first2,431ms and inventory-first1,912ms. Direct installed Node supplies
CPU flags and bypasses only the npm wrapper. Outer elapsed15.24s includes driver
snapshot overhead; aggregate child accounting is not Node-only. The exact
2,045 input hashes remain unchanged. No material-source selector, test-name
filter, warmup, preload, mock, configuration or assertion change is used.

Both coordinator and UI-worker profiles have valid samples, positive matching
time deltas and manifest-bound bytes. Weighted sampled intervals show coordinator
14.592s total,10.791s idle and0.772s inclusive ssrTransformScript. Worker13.059s
total includes4.853s inclusive Ajv.compile, within which createSkillValidator
accounts for2.758s; these nested figures must not be added. Worker idle4.218s
and GC0.567s remain separately visible. Profiles span initial collection plus
both intentional module resets; no exact per-case phase markers exist. Weighted
intervals are not direct CPU-accounting seconds; idle does not prove host pressure.
Opaque native work, scheduling, external compiler work and profiler overhead
limit attribution. category-stacks.json records overlapping categories explicitly.

The shared validator already caches by schema identity. The passing reduction
neither establishes a full-workload cause nor justifies a redundant cache or a
speculative production optimization. It does not clear BUG-180, BUG-366, the
failed full gate or Prayer acceptance. No automatic retry follows. This ends the
bounded diagnostic loop with a source/evidence checkpoint; BUG-365 stays Open.
Native diagnostic independent review: adequate / security-pass, no optimization justified, readers released; receipt
SHA256 `231470ad33ad92ebec5676b05db842c0e524d132a2c6246ae3b28d5f1af44602`..

These observed durations exceed the documented loop budgets; no test/configuration,
worker, dependency or timeout settings change. A successful build establishes no
browser, offline, runtime-performance or actual Node20 CI acceptance.

Plan review ready/security-pass/findings[]:
cb018177cf0791ded53c511bc9e4df04ab4d0043bb0a344589203dcc8f27f4a3.
Source-stage approve/security-pass/bounded evidence ADEQUATE/findings[]:
cfd576a5acb3b7e112f3e0ec93a6acdd0515aa8cd8085abcea2ffb6de06dfc0d.
Compatibility review as above. Final exact-byte checkpoint review: see separately retained
`checkpoint-review.json`; its documentation verdict does not grant feature or
full-suite acceptance.
Readers release is explicit in each completed receipt.

`source-commit-binding.json` independently hashes explicit committed input blobs
and matches all 2,045 tested paths to the immutable source checkpoint and live
files. Binding SHA256 `c03e19693e573709a2c9c717e5cbef209f2affdd634dc773358fd6f5d220e613`.
This binds the failed full result as well as scoped passing checks; it does not
change any result. No next Fire implementation starts before this gate is resolved.

## Limits and retained evidence

Root retains exact raw logs/reports/input maps, reviews and driver at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-prayer-9d0e935j`
through unfinished umbrella consumers and owns eventual verified cleanup.
The completed external build was inventoried and hashed, then its exact owned
output path was removed: 762 files / 42,267,780 bytes; absence verified in
`build-cleanup.json`. The build log and output manifest remain retained.
The prior audit finds all30 exact recorded command/driver/queue PIDs absent.
The diagnostic node PID2390670 and driver PID2390662 are also absent, without
signals/interventions. All remaining packet paths are retained evidence or their
reproduction/review scripts through unresolved BUG-180/366 and the umbrella goal;
root owns cleanup after those consumers finish. The applied evidence-draft.md was matched byte-for-byte to the repository copy
and removed before final checkpoint review; the repository evidence is retained.

Browser/earned recruitment/build/economy/balance, campaign, performance/PWA,
actual Node20 CI/human/soak and full-v1 gates remain pending. The212 bounded/one
unverified player-skill inventory is unchanged. No acquisition/lineage experiment,
spent launcher/preflight/retry/replacement, closed policy or protected save/fixture
is read/replayed. H3 remains terminal H3_PREREQUISITE_FAILED_NO_APP; no app or
browser is launched. No publication/push/merge/deployment occurs. Goal/worktree
stay active for the remaining plan.

## Finite follow-up planned at the original checkpoint

BUG-180 needs a separately scoped full-workload attribution plan that captures
where the unchanged entry deadline expires, with a specific runtime budget and
stop/report condition. The passing isolated profile is retained as comparison
only. BUG-366 needs its own phase-localization plan; no standalone material,
gameplay, acquisition or lineage replay is authorized by this checkpoint.
Do not repeat full runs to seek a green outcome or change limits/assertions.
No code optimization is selected without evidence supporting the specific change.

## Terminal full-workload follow-up — 2026-10-28

The sole pre-reviewed unfiltered default full-workspace capture completes
native0: **21,528 passed, zero failed, the same two skips / 1,007 files** in
1,619.476379s. All 2,045 executable inputs remain identical to this source
checkpoint, digest680a938e050fcbec4617ee865e0083ea17d0bf3a6a8dd1a7998953bc5baeacf3.
Player-first/inventory-first/material/save targets pass at reported durations
2,713/2,024/4,866/3,405ms; these are not exact timed import phases. Two raw Date
fixture label differences are independently reconciled against their unchanged
sources, one case each; all remaining identities/files/skips match.

Producer's terminal-review.json approves the **narrow current-byte native
full-unit prerequisite**, security-pass/findings[]/readers released, SHA256
`aef63973046e2eced4252aad34a988a20f1b1707b98385d7b9e3da3977b0854d`.
No extra unprofiled full invocation is required. Earlier native1 results remain
unchanged; BUG180/366 causes remain Open. The frozen profile analyzer is
inadequate (59 profiles, 62 negative deltas, minimum -168 microseconds); all
1,009 profiles / 1,317,319,852 bytes remain retained. No cause, optimization or
performance-fix claim follows. [Full evidence](full-workload-timeouts.md) records
the invocation, reviews, reconciliation, hashes and exact retained paths.

This resolves the prior failed full-unit prerequisite for assessing the next
bounded source card. BUG365 remains Open for browser/earned/feature acceptance.
The next Fire card needs its own refreshed readiness review before reproduction
or implementation; this receipt does not authorize that card automatically.
Both raw packets remain root-owned through unfinished consumers; no deletion
is approved. Exact run/driver PIDs are absent and no worktree process remains.
No app/browser, protected fixture, closed policy, new acquisition/lineage
experiment, push/merge/deployment or full-v1 acceptance occurs.
