# Bone defenses implementation and author review

DESIGN-REVIEW: CONCERNS

All eight required design sections are present in D06-bone-defenses-v1.md.
Non-spatial combat, no dodge mutation, JSON ownership, skill cooldown invariant,
bilingual/mobile and save boundaries are explicit. Missing pillar documents and
independent numerical/feel review remain ship concerns; this is author review,
not independent acceptance. Existing monster Prison remains a separate ability.

Plan review: ready for bounded local implementation, not final acceptance.
Security check: pass; local first-party code/data/tests, no dependencies, secrets,
permission/CI/network changes or genuine campaign action. Sole root writer/reviewer.

Ordered increments, each <=5 production/test/config paths and docs separately:

1. Prison authored schema/data, immutable definition and literal tests (4 paths).
   Preserve original native RED; new tests first prove missing timing/contract.
2. Paid Prison payload types, adapter and status lifecycle (up to5 paths); exact
   application/expiry/rebase/boss/negative tests, no scheduler claim yet.
3. Prison scheduling plus strict learned/native rank and registry qualification,
   actual positive/negative combat tests (up to5 paths). Update original native
   witness only by rerunning unchanged; Wall RED must remain RED until fixed.
4. Wall schema/data, immutable definition/pool and tests (<=5 paths), then shared
   damage settlement/availability/native projection in further <=5-path increments.
5. Native integration/replay/save, truthful bilingual previews and descriptions,
   production browser cases split into <=5-path increments.
6. Run appropriate engine/full units/types/lint/build/browser with frozen source
   and HEAD. Retain every failure; no assertion weakening, retries/timeout tuning
   or fixture/resource changes to manufacture acceptance. Author-review diff.
7. Retain/read-back verify raw evidence and exact task-owned cleanup after all
   consumers finish. Credit skills only after complete functional/public proof.

Material plan gaps resolved before implementation: channels share action blocking;
Prison is not Cleansing-sensitive; Wall must precede mana diversion and be counted
in periodic lethal prediction; no marker-only or implicit learned-rank power;
finite wave carry cannot refill or extend; rank21 requires paid Command provenance.
No undocumented overwrite of existing behavior/tests. Partial foundations confer
no skill credit. Full-v1 scope remains the execution ledger and original plans.
