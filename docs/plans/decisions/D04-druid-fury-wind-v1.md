# D04 — Fury sequence and Druid wind/control attacks

Local implementation contract for reproduced BUG194. Root sole writer;
independent design/QA and earned all-class balance remain open.

## Fury mechanic

Both locales promise a rapid series; current native rank1/20 resolves one hit.
Add explicit JSON `hitSequence.strikes=5`. Five is new provisional v1 tuning,
not an existing authored coefficient or an earned balance claim. Damage95–135,
growth8/rank,11MP,1s cooldown, unlock30/cap20 and full Rabies prerequisites stay.
Each strike uses the authored per-hit range; do not divide or multiply one roll
and label it multiple attacks. Only existing per-hit damage scales with rank.

Select the existing area target pool once (currently the first two prioritized
living enemies). Attempt five strikes in deterministic round-robin order within
that pool. A single survivor may take all five; after a target dies, skip it and
continue among living original pool members. Do not acquire enemies outside the
original pool, attack corpses, or emit fake unused strikes. Stop if no eligible
target remains or the actor dies. Each attempt uses ordinary fresh hit/dodge,
damage-range/crit, mitigation, absorption, status/combo, death/orb/reflection
settlement before the next attempt. A miss spends that attempt and does not end
the sequence. Existing target ordering adds no selection RNG.

One sequence is one scheduled action, one11MP payment and one1s cooldown.
All strikes share that action's simulation timestamp; ordinary event playback
shows each resolved attempt. No inserted enemy turn, separate resource charges,
new clock, guaranteed total damage, healing or special immunity is introduced.
Engine bounds reject malformed counts; only exact Fury may author this metadata
in validated player data. Generic attacks with absent metadata remain unchanged.

Fury works in human, paid wolf or paid bear form after learning its existing
full prerequisite chain. Like the preceding Maul/recovery contracts, learning a
form is separate from paying to cast it. Fury never transforms, replaces a form,
or silently adds a paid-form requirement.

## Other attacks in this verification pass

Preserve existing JSON rules, without new tuning:

| Skill | Damage/rank growth | MP/CD | Targets and status |
| --- | --- | --- | --- |
| Arctic Blast | Cold50–70 /+5 |25/2s | Existing best cross; Chill |
| Tornado | Physical60–90 /+6 |30/2s | Existing best horizontal line3; none |
| Hurricane | Cold70–100 /+7 |50/4s | One pulse against all living enemies; Chill |
| Twister | Physical60–90 /+5 |18/2s | Existing first-two area; Stun |
| Shock Wave | Physical50–75 /+5 |14/3s | All living enemies; Stun |

The old spec's cone labels map to the authored grid shapes, not a new range
stat. Twister's copy incorrectly says knockback while data declares Stun; align
both locales with actual Stun rather than introducing movement or a second
control. Ordinary Stun/Chill durations, boss scaling, expiry/scheduler behavior,
damage, prerequisites/unlocks and caps stay authoritative. Shock Wave preserves
any existing paid form; its learned Maul/full chain does not silently require a
separately paid bear. No sustained Hurricane aura/channeling is promised.

## Proof and publication

Preserve native original RED before repair. Schema RED must reject missing,
foreign, nonfinite/fractional/unbounded or contradictory sequence metadata.
Combat checks require literal rank1/2/20 per-strike damage and actual HP,
round-robin/dead-target/reflection stops, misses, mitigation/shields, one payment/
cooldown/action and unchanged no-sequence controls. Verify all five other
attacks' actual target sets, HP/status duration/expiry and native ownership,
prerequisites/MAX aliases. Unchanged inputs replay exactly without mutation.

Pure display supplies per-strike bounds and bounded attempt count at current/
next/MAX/preview; both locales explain target pool, early stop, payment, form
independence and real grid/control rules. Production public allocation/config,
actual multi-hit playback and five-domain Save-close-Continue, both locales/
mobile/desktop, required geometry, final engine/full/types/lint/explicit-false
build/bridge checks, frozen source/build/Git/genuine maps and committed blob
audit precede skill credit. Save22 and the genuine earned character are unchanged.
Archive original failures and exact task-owned cleanup. C2-C4/fullG0-G7 remain.

Security check: pass. First-party local combat/data/UI work; no credentials,
network, dependencies, CI, permissions, persistence or agent-behavior change.
Plan review: ready after requiring real per-strike settlement, the original
target-pool bound, actor-death stops and no paid-form dependency. This is author
self-review, not independent acceptance. No campaign or remote action.
