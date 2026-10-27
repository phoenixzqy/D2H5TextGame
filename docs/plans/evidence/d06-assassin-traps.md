# D06 — finite paid Assassin traps: implementation checkpoint

Source through `5eb3948d`; provisional [D06 contract](../decisions/D06-assassin-traps-v1.md).
The [implementation packet](fixtures/assassin-traps/implementation-checkpoint.json)
retains exact commands, results, source/configuration hashes and measured HEADs.
Root is sole executor. This is functional implementation evidence; independent
acceptance, earned balance and final skill credit remain open.

## Implemented behavior

Eight exact learned/native trap identities receive fresh per-wave authority.
Paid private instances capture their rank, source and finite timing. Fields and
sentries attempt three attacks over three seconds, including the initial pulse,
with one mana/cooldown payment. Active copies skip recasting, allowing ordinary
lower priorities and basic attacks. Paid pulses continue through control and
stop on source or shadow-owner death. Imported observation markers confer no
authority. Damage uses ordinary seeded targeting, mitigation, shields, statuses
and death closure without direct-hit leech, Venom, charges or recursive reactions.

Death Sentry consumes at most one oldest real body per pulse from the shared
corpse FIFO. It uses Fire/Burn for that branch and Lightning without a body.
Blade Shield lasts six seconds and counterattempts only after positive ordinary
hostile Physical HP loss, with a one-second interval per surviving attacker,
including missed attempts. Actual paid Warrior copies and Master independently
exercise trap mechanics; Master now builds charges, places Wake of Fire, then
uses Dragon Talon with its own MP and captured ranks.

Combat chips show localized names and actual remaining lifetime. Skill panels
show per-pulse/counter damage, finite timing, single payment, active recast gate,
Death's separate Lightning/Fire branches and Shield's actual trigger/exclusions.
Complete authored templates share immutable runtime definitions with previews.

## Verification and limits

- Native authority: 17 cases; trap runtime: 56; independent Master cycle: 2.
- Combat observation display: 32 new cases, 64 related cases pass.
- Preview resolver: 26 new cases, 129 related cases pass.
- Bilingual current/next/MAX skill panels: 64 new cases, 180 related cases pass.
- Latest engine gate: 10,011 cases / 383 files pass in 213.667 seconds;
  all 2,533 repository inputs, six external inputs and measured HEAD unchanged.
- Scoped strict types and lint pass for each implementation slice. Historical
  setup, fixture and source errors are retained and explained in the packet.

The retained full trap run at `ba1f1668` completed with 19,780 passes, 22 failures
and two existing opt-in skips across 926 files. BUG307 identifies obsolete
single-hit/first-miss/label expectations and incomplete alias fixtures in two
historical Fire test files. `909f47dc` preserves exact three-pulse seeded hits,
existing refreshed Ignite potency/totals and complete native ranks. Its combined
241-case/four-file run, scoped types and lint pass. The original full failure is
retained; the subsequent whole-unit result is recorded below.

`efd15c95` promotes nine actual native wave/import/respec/flee cases; 65 related
cases, strict types and lint pass. Carried Death/Shield cooldowns correctly defer
casting in short waves; fresh runs reset cooldowns and pay the new rank.
`5eb3948d` fixes BUG306 compact HP semantics without a layout change. Hero,
mercenary, summon and enemy cards expose named groups and localized progressbars
with actual fractional HP, maximum and live death updates. Original two-case RED
and the complete 201-case/20-file combat-screen GREEN, strict types and lint are
retained.

The production preview matrix at unchanged `ba1f1668` passed four cases: 64
ranked allocations/previews, 320 geometry checks, eight seven-domain save/reopen
pairs and four actual service-worker offline Continues. Eight original mobile
captures were individually inspected, with their limited framing disclosed.
This is preview evidence; subsequent actual trap combat is recorded below. The fresh production
build at `5eb3948d`, with VITE_E2E unset, passes; 762 assets are hashed, six JS
chunks contain none of five tested bridge patterns, and the actual offline
precache checker finds all required assets among 756 URLs. Existing bundle-size
and oversized-art-manifest build warnings remain; performance acceptance is open.

The [follow-up packet](fixtures/assassin-traps/integration-followup.json) retains
exact receipts and artifact hashes. Subsequent completed local checks and remaining
acceptance limits are recorded below. No skill-inventory credit has been added.

The former raw task is now archived/read-back verified and exactly cleaned;
see final retention below. Historical task paths in receipts resolve as relative
archive members. Shared dependencies and the registered worktree are preserved.
No campaign or remote action occurred; genuine earned state remains L33,
Ancients/Rite claimed, Baal uncleared.

## Actual combat and final local gate — 2026-10-27

Frozen `33dc3239`: full **19,813 tests / 928 files pass**, with two existing
opt-in skips in 1105.449s; full types137.342s and lint237.313s pass. All2,536
repository/nine external inputs and HEAD remain exact. This corrects the old
Fire full-gate failure without deleting its original result.

The production actual-combat matrix passes **32/32** in1013.699s: eight traps ×
en/zh-CN ×1280×800/360×640, rank1/20 real UI allocation, positive typed hits,
repeated autonomous pulses, finite HP/MP, real Death corpse/Fire branches and
Shield incoming Physical/counter pairs.64rank proofs,64exact seven-domain save
pairs and32actual service-worker offline Continues are audited.2,536repository/
11external inputs and all762build assets stay exact; VITE_E2E remains unset.
Synthetic level30/high-life/MP and explicit prior-act cleared markers establish
functional behavior only, never earned campaign/balance acceptance. The initial
rank20 payment-obscured failure and high-life closed-accordion failure remain
retained under BUG308; exact nominal payment assertions were preserved.

`433bd510` promotes nine shared-corpse and Shield boundary regressions: actual
competing Corpse Explosion and Find Potion; same-time pulse priority; FIFO and
sentry creation order; Fire exclusion; independent attacker quotas/non-reflection;
real incoming hits just before/at paid expiry. **74cases/threefiles**, scoped
strict types and lint pass. These constructed multi-hero engine snapshots are
not a playable party or campaign proof. The19,813whole-suite result predates
this new test file; no combined whole-suite total is invented.

All128original desktop/mobile captures and320report artifacts are audited.
Exactly12of64mobile originals have been individually inspected, covering both
locales/ranks and Fire/Lightning/Physical/Death/Shield. Separate actual scrolling
now exposes real allies and enemies; fixed navigation still clips lower card
content, lower enemy rows can remain outside the viewport, and nav glyph/header
limits persist. Blood Lord portraits are broken, documented before source work
as BUG309. The other52mobile originals have not been individually viewed. No
whole-app mobile/a11y/physical-touch or independent signoff is claimed.

Retention/readback/cleanup and inventory reconciliation remain open. Original
charge24-case evidence still lacks absolute HP/correct enemy framing; trap
observations do not retroactively fill it. Inventory195bounded/17unverified/
onereview-needed and earnedL33/Ancientsclaimed/Baaluncleared/next402 unchanged.

## Integrated portrait correction and whole-unit gate — 2026-10-27

BUG309 is fixed by19e5d096. Registered/Act-qualified art resolves truthfully;
missing or failed decoding gets the shared deliberate fallback, and a later
source change recovers. Eleven original REDs become250related cases/26filesPASS;
scoped types/lint pass. Production10/10PASS80.400s covers en/zh-CN at all five
required sizes, missing artwork/no fabricated request, intentional HTTP200 HTML
decode failure and the next real encounter's successful registered image.
All20 original screenshots individually inspected; native names/HP, hero fitting
and no horizontal overflow checked. Fault-isolation blocks service workers;
each case explicitly records/asserts exactly the known Playwright SW-block
harness warning and no other warnings/errors. No new PWA acceptance.

The original full run at frozen19e5d096 completes **19,833tests/931filesPASS**,
two existing opt-in skips,1017.115s. This includes the nine shared-boundary and
11portrait regressions; it supersedes the older whole-unit count, without erasing
historical failures. Fulltypes147.001s/lint252.688sPASS;2539repository/four external
inputs/HEAD exact. Production build12.317s/762assets/six JS chunks/five tested
bridge patterns absent/all required assets among756precacheURLs pass. Existing
bundle/art-manifest warnings and disclosed mobile framing/glyph/header limits
remain. The original charge24-case HP/capture gaps are still unresolved.

Updated exact receipts, source/build hashes, all original observer/static failures
and protected genuine-save hashes are retained in the follow-up packet. Root
will archive/read back and remove exact task-owned disposables now that the last
original consumer is terminal. No new inventory or earned/independent acceptance.

## Final raw retention and cleanup — 2026-10-27

All9,685 regular-file members/756,389,226 raw bytes are archived and individually
read-back SHA256/size verified. Root retains these exact evidence deliverables
through full-v1 and independent review and owns their eventual removal:

- /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-assassin-charges-zt17emhc-raw.tar.gz
- /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-assassin-charges-zt17emhc-raw-manifest.json
- /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-assassin-charges-zt17emhc-retention.json

Archive SHA256 aefbd85143cebde653daf664e98c8efa8f520c0525f52100072ff816be7bcd96.
Manifest SHA256 ade73cbe24df4ef89f382f0748f20ab7b8db73fd083faedc3ada9126431f9204.
Members use paths relative to the old task root; read them directly without
extracting links. The shared node_modules link was excluded from the archive.

After every original consumer was terminal, a fresh process scan found no owned
consumer;30 inaccessible proc entries are disclosed. Exact rehash preceded
9,685file removals/one symlink unlink/222directory removals including task root.
Remaining[]/failures[]; shared dependency target inode/directory preserved. The
packet carries full receipts. This closes disposable charge/trap cleanup, not
BUG304/306, earned balance, independent acceptance or full-v1. No inventory
credit is inferred; Flight has a separate continuing task.
