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
retained; a new whole-unit gate remains required.

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
This is preview evidence; actual trap combat remains open. The fresh production
build at `5eb3948d`, with VITE_E2E unset, passes; 762 assets are hashed, six JS
chunks contain none of five tested bridge patterns, and the actual offline
precache checker finds all required assets among 756 URLs. Existing bundle-size
and oversized-art-manifest build warnings remain; performance acceptance is open.

The [follow-up packet](fixtures/assassin-traps/integration-followup.json) retains
exact receipts and artifact hashes. Corrected actual-combat HP/MP, Death corpse
and Shield attacker observations, visible mobile ally/enemy captures, remaining
shared-corpse/reaction boundaries and final integrated/independent/earned gates
are still required. No skill-inventory credit has been added.

Root retains `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-assassin-charges-zt17emhc`
for continuing charge/trap evidence consumers. Exact owned files are tracked in
its manifests; root will archive, read back and clean disposables after consumers
finish. Continuing evidence/cache cleanup is not yet complete. Shared tool caches
and the registered worktree are preserved. No campaign or remote action occurred;
the genuine earned state remains L33, Ancients/Rite claimed, Baal uncleared.
