# D06 — Skeletal Mage elemental signature effects

2026-10-26. Provisional root-author follow-up to
[direct elemental bolts](D06-mage-elemental-identity-v1.md), implementing its
expressly deferred status effects. Independent design/QA, earned balance and
full-skill acceptance remain open. Root is sole writer/executor.

## Intent and controlling rules

Fulfil GDD §5.3 through the existing paid Mage basic bolts: elemental variety
also creates readable damage/control combinations. This child supersedes the
earlier card's rule 9 and its no-automatic-status presentation once enabled.
Its other preparation, rank, cycle, Mastery, hit, mitigation, timing and transient
authority rules remain controlling. No generic elemental attack gains statuses.

Each successful qualified Mage basic hit attempts exactly its assigned payload:

| Element | Payload | Duration | Potency / stacks |
| --- | --- | --- | --- |
| Fire | Burn (stored as `ignite`) | 3 seconds | 10% of resolved direct hit per second per stack; shared cap 5 |
| Cold | Chill | 2 seconds | Shared 50% Attack Speed multiplier; refresh, no stacking |
| Lightning | Paralyze | 1 second | Shared action interruption and 5-second repeat cooldown with 50% rejection |
| Poison | Poison | 5 seconds | 5% of resolved direct hit per second per stack; shared cap 10 |

Durations, status IDs, elemental payload types and DoT rates live in a dedicated
Ajv-validated JSON definition. The rates follow existing Fire Golem and Poison
Dagger/Rabies precedents and are provisional tuning, not independent balance
authority. Use the shared final-hit floor/minimum-one rate, refresh/first-rate
capture, status expiry, periodic integration, personal absorption and Cleansing.
Do not invent a second mitigation, status, RNG or scheduler implementation.

Burn's existing combo supplies physical amplification and poison synergy; Chill
amplifies Lightning, and Paralyze amplifies Fire. These statuses become available
after their hit, so a bolt cannot amplify itself using a status it just created.
Ordinary Poison is not a plague variant and does not gain spreading. No Freeze,
new aura, owner mastery/weapon inheritance, projectile or per-bolt MP charge.

## Authority and determinism

Only an ID in the existing battle-local paid fresh-Mage element map can receive
this payload. Keep whole-batch 22MP startup, allocation caps, corpse-free
preparation, learned-vs-paid Command potency, original owner/body identity,
preload/malformed/synthetic/enemy refusals and next-wave reconstruction.
Missed attacks apply no status or DoT. Killed/orphaned bodies cannot attack;
already applied finite DoTs retain the existing shared source/lifetime behavior.
No additional persistent field, imported marker or save migration is needed.

Status attempts use the existing seeded shared damage/status path, including
its RNG calls and repeat-Paralyze rejection. Element assignment itself adds no
draw. Old direct-only outcomes and RNG traces can change after the first proc;
A/A, A/B/A, pure/recorded and unchanged-config replay must still agree exactly.

## Delivery and validation

1. Capture failing four-element combat acceptance before implementation.
2. Land the JSON/schema/immutable definition with validation and copy/isolation
   tests (at most five source paths); it remains inactive until the consumer.
3. Connect the existing Mage binding to shared `DamageEffect.applyStatus`.
   Preserve and update direct-only regression oracles explicitly: total target
   HP now includes periodic loss; later direct hits can observe created combos.
   Test literal single-hit/DoT totals, expiry, action control, negative provenance,
   miss/payment/resource/rank/Command boundaries and deterministic recording.
4. Update bilingual player copy, mounted/native composition tests and ordinary
   production browser status/log/save flows. Keep imported fixtures labeled
   unearned. Only consider inventory credit after all required proof and cleanup.

Each source increment is at most five paths and commits separately from docs.
Run focused tests per increment, engine suite after combat edits, then full
units/types/lint/production build/bridge/precache and actual browser verification.
Do not restart a live full suite. Balance screening must compare actual same-seed
engine outcomes before later earned-build/independent balance acceptance.

Author plan review: ready after including direct-only oracle changes, Command
capture and personal-defense/DoT boundaries. This is not independent approval.
Security check: pass for first-party local code/data/tests; no credential,
dependency, permission, network, CI or save-shape changes. Preserve campaign save.
No campaign action/replay, remote publication, delegation or worktree release.
C2–C4, full G0–G7 and private v1 remain active and incomplete.
