# ORMU-14 — Admit the finite Ormus proof only in live25

Status: implemented and independently reviewed; integrated feature acceptance remains open.
Producer/technical plan APPROVE. Depends on protected quest helpers and literal24.

Scope: quest-domain.ts, validate.ts, helper descriptor checks and ormus-proof.test.ts.
An optional supplied Ormus domain never falls back to live when omitted. Current
validation admits the exact finite proof and checks its reciprocal own-data graph
before generic ledger normalization. Receipt getters, hidden fields, invalid
values and symbols cannot supply proof or be evaluated. Only version25's native
schema admits the new source; frozen JSON/campaign/Act5/endgame readers stay
unchanged. No migration infers proof or rewrites proofless legacy history.

QA: actual reciprocal partial/full graph; proofless sparse completed/claimed;
literal23/24 reject new proof before migration; orphan/mismatched/contradictory
graphs; malformed descriptors through native/public ledger boundaries; canonical
identity/source getters; coexistence with Hell, achievement, endgame and service.
RED4/14 failures precede wiring (three positive proof admissions and one getter
evaluation failure); GREEN317/8 includes14 new cases. Independent review APPROVE.
Final integration type/lint/full tests remain tracked at the next checkpoint.
