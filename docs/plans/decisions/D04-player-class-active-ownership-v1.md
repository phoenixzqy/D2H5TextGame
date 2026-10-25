# D04 — Native Player class-active ownership

Local implementation contract for BUG185. Independent acceptance remains open.

The fresh native Player→combat boundary filters ordinary authored class actives
using copied JSON metadata. A selected skill must belong to the actual class,
have a finite integral owner level at its authored unlock, a valid integral
allocation1..authored cap, and valid ownership of its transitive prerequisites.
Take the maximum valid exact canonical/data allocation alias once; invalid aliases
never clamp into learned ranks. Normalize only accepted selected ordinary actives
to one canonical rank in the combat copy. Preserve configured slot spelling/order.
Cycles, missing prerequisites and invalid definitions cannot establish ownership.

Known passive/aura entries are excluded from combat priorities; their existing
automatic/selection projections own effects. Unknown non-class registrations keep
the trusted engine fixture/extension path. Undefined IDs in a playable class
namespace cannot establish ownership, including old registered class stubs.
Nonstandard aliases resolving to an authored class skill cannot bypass the exact
canonical/data identity boundary.

Existing D06 preparation/Iron summon configuration keeps its accepted direct
prerequisite contract and separate life/mana/item/debit/locking policy. CE/PE keep
their existing copied Player-derived authority and engine selection/commit checks,
including dormant combat-priority metadata; they already reject unauthorized casts.
Existing
D10 Fire Bolt/Blaze/Chain Lightning/item Redemption ownership remains downstream,
including lawful equipment grants to foreign classes. This change does not impose
learned-class requirements on those equipped grants.

This projection never rewrites persisted Player priorities/allocations, including
dormant imported entries and priorities restored after reset. The existing reset
service still clears slots. Learning/reset applies at the existing next
wave boundary; original-input replay and reward accounting remain authoritative.
The pure engine still consumes trusted combat snapshots and supports historical
implicit ranks for non-native callers. No damage/cost/action/RNG or saved fields
change; save version remains22. Existing Skills-screen sanitization still owns UI
priority edits; this change does not alter its automatic normalization/removal of
invalid slots when that screen opens. Ownership verification does not establish each
skill's complete promised mechanics, viable builds or earned campaign balance.
