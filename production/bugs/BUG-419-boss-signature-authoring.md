# BUG-419 — Generic-first bosses hide authored signatures

Status: fixed locally; numerical/campaign acceptance pending. Severity: high (combat identity), medium
(numeric catalog). Environment: HEADb5a0898 + private-v1 work, Node24.21.0.
Owners content-designer/engine-dev, design/QA review.

Reproduce: native L12boss Corpsefire, Rakanishu, Coldcrow, Treehead, Pitspawn,
Countess, Griswold, Smith, Andariel, CowKing, FireEye, Coldworm, Fangskin,
AncientKaa, Radament, Beetleburst, Duriel, Izual, AncientBarbarian. First generic
StrongMelee/WeakRanged is always ready and hides later signatures (summon
startup remains a separate event). All19 lack ordinary Attack/Growth.
Expected: remove redundant generic entries, preserve signature relative order,
explicit role-specific ordinary progression; real chapter overrides preserved.
Do not require every later signature to execute: native cooldown coverage can
still cover ordinary or later skills. Andariel Charge remains hidden behind
Spit/Cloud; Enrage/Shout payloads remain markers, pending separate runtime work.

Repair/acceptance: docs/plans/decisions/P15-boss-signature-family-v1.md. Native
cadence, burn ordinary, preserved stats/RNG, actual encounter sources/rosters,
production wave consumer and fixed matched diagnostics before/after. No save,
engine/payload/locale/schema changes; numerical balance remains unaccepted.


Validation findings before closure: green99PASS. Broad engine finds two older
focused Rend payload proofs still assert generic-first Pitspawn/Griswold lists;
all their damage/Bleed/expiry/replay assertions pass. Update only final list
expectations/comment to the new native signatures, retain every payload proof.
Scoped lint finds chapter test's authored boolean now always true after all111
curves; remove redundant column/conditional, require all five ranges directly.
These are stale test assumptions, not runtime changes. Broad sweep's original
failures remain retained and must be reconciled with focused repaired runs.

Closure: docs/plans/evidence/p15-boss-signature-family.md. Native99PASS,
related468PASS; original full engine511files/14038cases had8stale oracle failures,
all reconciled by full focused repaired files (56+16+6cases PASS). Latest types
PASS12.443s and all touched scoped lint PASS. Frozen1536fights/arm and unchanged
controls independently audited. Inventory111authored/0pending, all numerical
acceptance remains unaccepted. No earned build/pacing claim.
