# ORMU-13 — Protect the Ormus clear and Talk graph

Status: implemented and independently reviewed; integrated feature acceptance remains open.
Producer-approved helper/store card. Depends on approved Ormus contract and Save25.

Scope: pure ormus-quest.ts and tests, mapStore.ts and mapStore.ormus.test.ts.
Canonical own tracked rows may earn a first clear only while unclaimed and no
own proof key exists. Proofless legacy flags remain inert history. A present
proof requires first=true and Talk/status consistency; durable validity survives
Claim. Protected Talk accepts own Talk=false; Claim requires completed, both own
true flags, proof and unclaimed. Generic clear/Talk/boss/monster/object events
skip Ormus while preserving unrelated quest behavior and area history.

QA: proofless partial/completed/claimed history, malformed and inherited rows,
own invalid proof, ordered Talk and Claim, reciprocal graph refusal. Four causal
generic-event failures precede the guards. Pure helper RED is a missing-module
capability failure, not a behavioral failure. GREEN46/4 includes helper16,
generic-event4, existing map19 and historical unique binding7. Also strengthens
historical aggregation/migration assertions after catalog activation, per review.

Live25 receipt schema/graph wiring, run authority, actual Talk/Claim and quest data
activation follow later. No earned quest or browser acceptance follows this card.

Independent review APPROVE. Targeted zero-warning lint passes. Full typecheck v3
passes through this card, catalog and UI; it predates the next save-proof slice.
