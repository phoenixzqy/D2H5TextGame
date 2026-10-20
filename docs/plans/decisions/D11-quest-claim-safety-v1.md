# D11 v1b — Den and shared synchronous claim safety

Status: accepted scoped contract, 2026-10-20; P04a04a.
Producer and QA independently approved plan, genuine frozen RED and source.
Combined validation and independent final APPROVE/ADEQUATE are recorded in
[the evidence](../evidence/p04a04a-den-claim-safety.md). Full D11/P04, campaign
reward budgets and ordinary-earned Den browser proof remain separate.

Preserve [ordered current-town talk](D11-quest-talk-v1.md): clear Den → talk
to Akara → explicit Quests claim. Completed-status Act gating, objectives and
existing unlock semantics do not change. Den grants exactly500 cumulative
player XP through existing gainExperience, automatic level/milestone points,
one additional quest skill point and one375 XP share to the fielded merc.
No fielded merc is valid. Den gold0 changes no currency or item.

claimReward.ts remains the single synchronous boundary. A feature-global guard
is checked first and held through success or restoration; same/different nested
claims refuse claim-in-progress. Later repeats refuse already-claimed. Release
in finally even if preflight or restoration throws.

Preflight before writes: completed/unclaimed known quest, nonempty bag, hydration
ready, no active save replacement, player exists, every reward entry executable.
Preserve numeric xp/skillPoints/statPoints/runes/runeShards/gems/wishstones with
existing currency IDs. Supported zero entries, including gold0, are no-ops;
empty/all-zero bags remain unclaimed. Positive gold is unsupported under D10's
no-gold direction. Unsupported stat/itemDrop/lootTable/unlocks/services and all
other unimplemented entries refuse the whole bundle, regardless of entry order.
Schema-valid authorship is distinct from executable gameplay support.

canClaim reports basic completed/unclaimed/nonempty action availability. It may
be true before execution refuses unsupported/not-ready/no-player, allowing the
enabled UI to explain refusal and permit retry. No readiness subscription or
QuestsScreen runtime change is required; generic feedback keys localize results.

Snapshot and restore only participating data: player for XP/points; ownedMercs
and mercProgress for XP share; currencies when a positive currency participates;
the original target quest entry including absent versus false rewardClaimed.
On synchronous grant/final-flag exception (including mutate-then-throw), partial
setState restores owned slices while preserving actions, other quest records
and unrelated domains. Attempt every remaining restoration if one throws.
Successful restoration returns grant-failed and allows one successful retry.
Failed restoration throws AggregateError('Quest reward restoration failed'),
retains the original cause, and never describes state as unchanged.

The guarantee is settled state at synchronous return. Separate Zustand stores
may publish intermediate states, matching the accepted character-creation
rollback precedent. No observer-wide transaction, crash safety or protection
against arbitrary hostile observers is promised. Real500ms debounced autosave
must capture complete successful or restored state; real pending import must
refuse claims even while hydration remains ready.

No content/schema/engine/persistence implementation/store API/save-version,
point budget, unlock or economy redesign is included. Implemented numeric
compatibility is not acceptance of full campaign rewards. Controlled injected
exceptions prove recovery, not naturally observed production exception incidents.

[BUG044](../../../production/bugs/BUG-044-quest-claim-partial-and-reentrant-grants.md)
records reproduced defects and frozen RED. Final validation and exact provenance
are recorded in the P04a04a evidence record.
