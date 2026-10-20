# D06 v1a — Battle-local summon identity

Status: accepted scoped contract, 2026-10-20; P06a only.
Owners: engine integrator and independent design/technical reviewer.
Source: GDD deterministic seeded engine invariant; P06 and D06 in work plan.

Given a fixed snapshot and seed, repeated battles (A/A and A/B/A) produce
identical complete states/logs/timestamps without resetting module state.
Default summon template construction is pure; its ID is provisional, not a
registration identity. Every battle owns its sequence and initial unit IDs.
Allocate `owner-summon-template-N`, monotonically increasing within that battle,
skipping all existing IDs including dead/preloaded units. Allocate immediately
after a successful template construction, before any grid-position ID lookup.
Do not use damage RNG or a process-global allocator for identity.

The deprecated `resetSummonCounters` compatibility export becomes a no-op.
Standalone template consumers must supply their own unique registration identity
if they instantiate multiple units outside the battle runner.

Alternatives: resetting global state on battle entry still couples concurrent
consumers; overriding output IDs while retaining counter mutation masks the
source of divergence. A battle-local allocator removes that hidden dependency.
No save shape changes: combat summons are transient. Existing ID prefix format
is preserved; exact ordinal values are local implementation identity.

Acceptance: nonempty summon events; full result/recorded replay equality;
different-owner/template uniqueness; collision with preloaded identity; existing
damaged placeholder unit retains state/position while fresh unit has full stats.
Normal and recorded wrappers agree; input snapshot is unchanged.

This does not resolve D06 caps, preparation, corpses, selected Iron Golem item
binding, resource/refund rules, or D04 timing. Those remain explicit later cards.
