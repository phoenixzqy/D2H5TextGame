# Native mercenary Thorns — BUG-363

Source commit: `34850efd245f2488a775e5242717a40e9baea13c`.

Scope: bounded F04/F07/P13 repair of the recruitable `mercs/act2-thorns`
signature. Base `a66b3e9fc9617bfe4d7ad921dba5c8140c9ddda3`; root uses the existing
claimed human-worktree-2. This evidence does not close browser or earned gates.

## Contract and repair

`docs/design/gacha-spec.md:128` specifies 100% physical reflection. The native
mercenary carried `aura-thorns`, but the runtime supplied an inert self-buff.
Closed schema-first `mercThorns.physicalReflectionPct` now owns 100 percentage
points; immutable validated resolution converts it to a fraction of 1.

Fresh native projection qualifies only the exact merc identity, valid integer
level and configured aura. A battle-local source list checks live eligibility
at use. One native presence adds to ordinary reflection for living player-party
recipients, including the source, other mercenaries and late summons. Duplicate
sources do not multiply; item reflection, selected Paladin Thorns and a living
actual Spirit of Barbs stay additive. Source death/removal withdraws presence;
fresh waves rebuild it. Generic skill/buff IDs grant no authority.

The existing settlement handles actual physical HP lost after mitigation and
absorption, recipient survival, hostile hits, minimum-one reflection, attacker
mitigation, non-recursion and reflected deaths. The trap exclusion is unchanged.
Paid native traps are player-side; an enemy native trap against this player-party
presence is unreachable. The unchanged nine-case trap-boundary suite exercises
shared reflection exclusion, including actual Blade Shield counters.

No new damage path, persisted marker, save version or base-stat write is added.
Passive presence adds no action/payment/RNG draw. Removing the obsolete aura cast
intentionally allows Jab sooner; parity is tested between same-input marker
controls, not against the obsolete cast schedule. Both recruitment and skill
copy in zh-CN/en describe the 100% actual-HP reflection before attacker mitigation.

## Causal reproduction and bounded controls

Node 24.21.0 / npm 11.19.0, Vitest UI/jsdom and engine projects, seed 7.
Native session16676 runs real `loadMercPool` → `createMercFromDef` →
`mercToCombatUnit`, a real projected hero, default registry and a constructed
fixed100 physical hostile hit. All three primary tests fail: no reflection,
no native marker and no100% copy. The unchanged primary then passes all three.
Its SHA256 is `9b1c6c9eedec5e487fbdaa9f265fee939e85a271979c4b2dcc0eca32710bd127`
in both RED and GREEN source maps.

Eighteen authored tests cover strict schema/identity, conflicting metadata,
missing/duplicate definitions, alternate tuning and immutable copy semantics.
Thirty-eight combat tests cover recipient kinds/self, source eligibility,
actual source death and fresh wave, partial/full absorption, miss, nonphysical
and periodic exclusions, additive contributions/duplicates, mitigation/minimum
one, non-recursion, reflected kill, actual late summon, deterministic replay,
input/stat immutability and paired RNG calls/tails. Existing Might, reflection,
selected-aura and trap-boundary suites remain independent controls.

The first expanded focused run fails three new fixture expectations. The100
sweep kills the actual80-HP Barbs spirit before the hero’s hit; the corrected20
sweep keeps it alive and observes all additive contributions. Enemy Bone Armor
is correctly stripped by its native player-hero guard; the invalid enemy pool
is removed, preserving attacker mitigation/non-recursion assertions and separate
recipient absorption tests. A2-HP source dies from the1700ms incoming hit; the
corrected3-HP/999-defense source survives that hit and dies from actual periodic
damage at2000ms, before the next3400ms hit. No production code is changed for
these corrections. Original failing logs/maps/reports remain retained.

## Validation and review

All final checks return native0, with before/after source inputs unchanged.
The committed source matches all2,037 tested inputs; see
`source-commit-binding.json` for the immutable commit binding.

| Check | Result | Native elapsed seconds |
| --- | --- | ---: |
| Focused | 127 passed /8files | 12.85 |
| Engine | 10,841 passed /405files | 190.16 |
| Unfiltered unit | 21,404 passed +2 existing skips /1,001files | 979.67 |
| Typecheck | Pass | 108.58 |
| Lint/engine purity | Pass, zero warnings | 203.36 |
| Production build, external outDir | Pass | 13.41 |

Earlier authored18/18 and authored-increment engine10,803/404files also pass.
Exact commands, native exits, before/after maps and raw reports retain every
attempt. Observed broad-check durations exceed the guide’s loop budgets;
no limits/configuration/timeouts are changed, and runtime/CI performance gates
remain pending. This checkout has no `validate:data` npm script; strict Ajv
schema validation is exercised by the authored tests and existing catalog checks.

Full counts use terminal output and individual assertion statuses, because the
reporter aggregate `numPassedTests` includes skips. The two unchanged skips are
`fresh-campaign-continuation.test.ts` ("runs one declared authentic saved-domain
Rocky Waste continuation and restores its caller") and
`fresh-campaign-economy.test.ts` ("runs one bounded authenticated earned farming
policy and restores its caller"). Each raw full name has a leading suite-space.
No `.once.ts` entry is discovered.

Build warnings report large chunks, stale Browserslist data and the2.57MB art
manifest excluded from precache. No limit is weakened. A successful build does
not prove runtime performance or offline acceptance. Actual Node20 CI is not run.

Producer plan ready/security-pass/findings[], readers released. Receipt
`plan-review.json` SHA256
`49baf9337fd11bf931dd2709f4f1f5c9dd5750d3d6225367f844a0211861d496`.

Independent source review approves/security pass/findings[], readers released.
Receipt `source-review.json` SHA256
`576ed14355cbc898fd943504329ab8af98d43e8ddf889427cca35051a92164a2`.
The focused/final-engine source digest is
`211af575a28f1699be2fdd1dd163259769cf9df853f8e2721414ab1894e60974`.

Final independent review approves, security passes, and evidence is ADEQUATE for
the bounded native Thorns repair; findings/blockers are empty and readers released.
Receipt `final-review.json` SHA256
`b1c5af054725110210f540c345e5781a05a53d47cc9cf86b63e3f62765da8d10`.

## Limits and retained evidence

Root retains exact raw logs/reports/input maps, reviews and driver at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-thorns-rfbaneja`
through unfinished goal/review consumers and owns eventual verified cleanup.
The exact disposable `build` child (762files /42,262,483bytes) is removed and
absence verified. All recorded command/driver PIDs are absent; `cleanup.json`
records no failures. Raw evidence stays retained for unfinished consumers.

Browser recruitment, earned builds/economy/balance, campaign, performance/PWA,
actual CI/human/soak and full-v1 gates remain pending. The212 bounded/one
unverified player-skill inventory is unchanged. No native acquisition experiment,
spent-lineage preflight/retry/replacement, closed policy or protected save/fixture
is read/replayed. H3 remains terminal `H3_PREREQUISITE_FAILED_NO_APP`; no app or
browser is launched. No publication, merge or deployment occurs. Goal/worktree
stay active for the remaining plan.
