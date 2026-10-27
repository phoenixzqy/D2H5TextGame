# D06 — finite paid Assassin traps: implementation checkpoint

Source through `a63d4ce9`; provisional [D06 contract](../decisions/D06-assassin-traps-v1.md).
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

The latest whole-unit checkpoint remains the earlier 19,576-pass / 917-file
charge checkpoint with two existing opt-in skips. It predates the new traps;
no fresh whole-unit pass is claimed here. Production build/browser trap
allocation, combat, geometry, save/reopen and service-worker offline Continue
remain to be established. Broader wave/import/respec, shared-corpse competition
and reactive boundaries also remain. No skill-inventory credit has been added.

Root retains `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-assassin-charges-zt17emhc`
for continuing charge/trap evidence consumers. Exact owned files are tracked in
its manifests; root will archive, read back and clean disposables after consumers
finish. Continuing evidence/cache cleanup is not yet complete. Shared tool caches
and the registered worktree are preserved. No campaign or remote action occurred;
the genuine earned state remains L33, Ancients/Rite claimed, Baal uncleared.
