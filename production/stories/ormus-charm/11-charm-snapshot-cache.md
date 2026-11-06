# ORMU-09 — Charm snapshot validation and bounded resource cache repair

Status: implemented and independently reviewed; integrated feature acceptance remains open. Producer-approved dependency; independent technical plan APPROVE.
Depends on ORMU-07A/B and Save25. Root owns mutations.

Scope: serialize.ts, equipment-rate-cache.ts, validate.ts and new
charm-cache.test.ts. Validate authoritative native charm owners before returning
a snapshot. Only exact, canonically eligible hero charm occupancy activates
resource cache repair. Privately restore affix Maps for snapshots; decode repairs
after restoration and existing independent repairs. Derive with quest entitlements
but copy only Life/Mana maxima and preserved/clamped current pools. Reject
nonfinite, negative or above-MAX_SAFE_INTEGER capacities without mutating input;
fractional lawful capacities remain valid. No-charm caches stay unchanged.

QA: illegal slot/merc/duplicate snapshot ownership; JSON/native cache parity;
up/down/zero current resources; affix and quest contributions; inactive bags and
mirrors; idempotence; unsafe arithmetic; unrelated cache preservation.
Catalog activation follows this guard, with no CI or remote publication.

## Outcome

Independent implementation review APPROVE. Causal RED15/17 failures and GREEN105/5
(including17 new cases) are retained in charm-cache-red/green.log. Targeted
zero-warning lint passes. The subsequent full typecheck found six readonly writes
in the new cache test; those fixtures now use immutable copies. The next coherent
typecheck includes catalog, equipment UI and protected quest helpers.
