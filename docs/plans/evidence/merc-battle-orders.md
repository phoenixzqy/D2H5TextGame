# Native mercenary Battle Orders capacity — BUG-369

Native implementation and automated verification, 2026-10-28.
Base: `6a999263df4cfc550d371c20cd71d1a705742ada` in the existing claimed
human-worktree-2. Browser, earned recruitment and feature acceptance remain open.

## Contract and repair

`docs/design/gacha-spec.md:121` promises party +30% maximum HP and MP from
the Act V Barbarian Battle Orders mercenary. Closed exact-ID `mercBattleOrders`
JSON supplies the percentages. An immutable validated resolver registers a true
passive without actions, costs, cooldowns or cast effects; the old alias stub is
removed. Both locales describe the living-party capacity bonus without a refill.
The authored skill unlock and independent recruitment requirement are unchanged.

Fresh projection requires canonical mercenary identity, the configured passive
and a valid integer unlock level. Runtime checks require the transient marker,
canonical ID, configured skill, living finite HP and original player-party merc
identity. Summon/owner/template impostors and original enemies, including actual
paid Conversion targets, do not qualify. Living hero, source, other mercenaries
and late summons receive one bonus. Duplicates do not stack; incapacitation
preserves presence. Source death/removal withdraws support before death effects.

Orders adds an independently floored HP contribution over the common fresh
personal baseline alongside existing form/Oak/Vigor terms. The new pure MP
capacity module restores only a verified matching transient baseline, preserves
absolute resources until the complete capacity decision and clamps once. Gains
never refill resources or resurrect units. At a final MP cap, exported recovery
carry and the internal recovery integral reset together.

Paid Battle Command installs fresh personal profiles and composes both temporary
capacities before clamping. Wave refresh replaces fresh source qualification and
preserves carried resources until the full party is known. A silent absolute
`mana-capacity` observation and extended `stats-state` carry transport replace
playback metadata; the initial publication prefix includes the new observation.
Personal player Battle Orders retains its separate D05 life/recovery behavior
and supplies no personal maximum-MP increase. Saved/base stats, save version,
acquisition, Bash, selected aura slots, rewards and replay inputs are unchanged.

## Causal and focused evidence

The original two-case primary uses real loaders, factory, player/merc projection
and default registry at seed 7. Constructed surviving held parties isolate the
advertised capacity; this is not earned recruitment or campaign evidence.
For personal maxima 1000 HP / 100 MP and current 700 HP / 80 MP, the enabled
source must yield maxima 1300 / 130 while keeping current resources 700 / 80.
The aura-disabled control must remain at 1000 / 100.

Actual RED exits 1 in 8.032417 seconds: both independent numeric capacity
assertions fail, while their controls pass. Its 2,055 inputs remain unchanged at
`994c7bd4e92287ac79e02c54b22fc2caa03fd4f8ee7bd386ae73e294f64591d1`.
BUG-369 was filed after RED and before production edits. The unchanged original
primary GREEN exits 0 in 8.014114 seconds. Original primary SHA256:
`1dbaf7c56a371e970a2bfa9361999ec6b1f0edcb3c97810800ce4812eb1e5fb0`.
Its supplied `maxRounds: 2` is an unused legacy field; held battles reach the
actual 60,000 ms native deadline. No runtime cap or deadline is changed.

Preserved initial failures diagnose only new fixtures: Poison legitimately
spreads damage on source death; the isolated withdrawal fixture uses Ignite.
Werewolf alone adds no HP; the intended +0.60 term requires Lycanthropy 20.
The Command opponent needed surviving HP, and sufficient MP permits repeated
native casts over the full run. First-cycle assertions therefore use the actual
first paid action time plus the authored duration, without shortening execution.
An initial scoped lint failure removes only an unused test import.

Independent review also found that malformed `{}` or `null` MP metadata could
be removed natively without a playback observation when numeric fields were
unchanged. Two added regressions fail before the event predicate correction
(276 passed / 2 failed) and pass afterward unchanged. A separate native test
earns a real fractional recovery integral at 0.25 MP/s, loses the source at
1004 ms, spends 10 MP later at that same clock and first recovers a whole MP
at 5020 ms. It does not seed an initial recovery carry.

The pre-typecheck focused run passes 279 cases across 16 files. The six added
files supply 72 cases: authored 21, pure MP 13, combat 28, primary 2, projection 2
and lifecycle 6. Coverage includes actual late summons, paid Conversion,
Command payment/expiry, native wave refresh/replay, publication and transport.
Composition checks include 100 + 60 form + 57 Oak + 30 Orders = 247 HP,
19 personal MP becoming 24, zero capacity, no duplicate stacking and no refill.

## Strict-type correction and primary lineage

Initial project typecheck exits 2 in 128.955135 seconds with 11 diagnostics on
the unchanged 2,062-input map
`121f714a89f5266260e96c7d76253313f267533bc673ad85e0af18d89e663bb1`.
The failures are a duplicate identical `mana` payload field, missing explicit
event/optional Vigor narrowing and test fixtures assigning `undefined` where
strict optional properties require absence. Exact original copies of all five
affected files and the native failure remain retained.

Independent correction review approves removing the redundant production field
and correcting only test typing/absence representation. No public type widening,
compiler suppression, numeric oracle, seed, resource or timing change is used.
The original primary's disabled control also had the erroneous optional shape.
Its successor destructures `signatureSkillId` out instead of assigning undefined;
the actual consumer reads it through an ordinary getter and does not distinguish
the two representations. This preserves the disabled effective skill order.

The original frozen primary, binding and historical RED/GREEN artifacts remain
unchanged. The corrected successor explicitly supersedes its source version:
`f7988097a3e0e8037f9f347881cd66b94aa6d21017f6c13b48b359fdd3f67181`.
No corrected-source RED is claimed. `typecheck-correction-binding.json` records
the exact absence-only primary diff, all five source hashes and fresh receipts.

All corrected checks use the same unchanged 2,062-input map:
`385990358c9bfe258ff7eab244c7ae25772573b2082c1c59234afe8c25b3f258`.

| Check | Native result | Elapsed execution time |
| --- | --- | ---: |
| Corrected primary | 2 passed | 8.173060 s |
| Corrected focused | 279 passed / 16 files | 30.728561 s |
| Scoped lint | Passed, zero warnings | 10.217905 s |
| Project typecheck | Passed, zero diagnostics | 129.053873 s |
| Complete engine suite | 11,143 passed / 416 files | 286.480791 s |
| Unfiltered full unit suite | 21,730 passed / 1,020 files, two existing skips | 1293.424072 s |
| Full lint / engine purity | Passed, zero warnings | 226.841553 s |
| External production build | Passed | 14.137058 s |

Independent source/correction/security review approves this bound source with
empty findings/questions and readers released. Historical source-stage approval
applies to its original map; corrected approval is separately retained.

## Broad validation and checkpoint

All final checks pass on the same corrected input map. Full inventory comparison
preserves every existing file, assertion and status after only the same two
runtime Date-label substitutions in unchanged source. Exactly six new files and
72 passing cases are added. The two existing saved-campaign execution skips
remain skipped. Vitest's aggregate `numPassedTests` includes those skips;
individual assertion statuses and the native log give the reported 21,730 passes.
Independent inventory review agrees. `native-summary.json` verifies the raw
receipt/report hashes, before/after maps, live source and primary lineage.

The production build retains the predecessor's chunk-size and excluded 2.57 MB
asset-manifest precache warnings. No configuration, dependency, deadline, worker,
isolation or environment adjustment is used to pass these checks. These results
do not establish a performance improvement or resolve BUG-180/366 timeout causes.

Independent final source/evidence/security review is retained as
`final-review.json`. `source-blob-binding.json` governs the staged tree and all
2,062 input blobs; `checkpoint-binding.json` governs the actual local committed
tree and input blobs. Those records must pass before a completed local checkpoint
is claimed. They grant no browser, earned or full-v1 acceptance.

## Retention and acceptance limits

Root retains approved readiness, original and corrected primary lineage, native
reports/logs/receipts/input maps, failed source copies, diagnoses and independent
reviews at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-battle-orders-p8ofugwf`.
The packet remains necessary for unfinished Battle Orders and umbrella acceptance;
root owns eventual exact-path cleanup. The exact disposable external build was
removed after validation and readers/writers released it: 762 files, 42,278,432
bytes and ten directories. Absence is verified; all 41 recorded PIDs and remaining
task-CWD processes are absent. No intervention or cleanup failure occurred.
`cleanup.json` retains the exact deleted-file manifest and process checks.
Shared caches, history, installed tools and the claimed worktree are preserved.

BUG-369 remains Open for browser/earned/feature acceptance. BUG-180/366 timeout
causes remain Open; a passing workload is not a cause, fix or speedup claim.
Player-skill inventory remains 212 bounded / one unverified. Campaign/economy/
build matrices, high-rune affordability, pacing/defeat-retry, devices/locales/
accessibility, performance/PWA, actual CI, human, soak and full-v1 acceptance
remain unresolved. Thirty to fifty hours is intended active player campaign
length, not automated test execution time. Pacing calls for accelerated
simulations and selected real-time playtests; the separate two-hour stability
soak remains pending.

H3 remains `H3_PREREQUISITE_FAILED_NO_APP`; no app/browser retry is attempted.
The protected retained-final fixture is not read, modified or replayed. The
closed production policy is not imported or executed. No acquisition/lineage/
gameplay replacement experiment, push, merge or deployment is performed.
The full goal and claimed worktree stay active.
