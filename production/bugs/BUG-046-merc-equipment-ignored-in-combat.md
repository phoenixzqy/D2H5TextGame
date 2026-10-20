# BUG-046 — Compose canonical mercenary equipment into fresh combat

Status: reproduced; plan/final frozen RED independently approved before fix;
bounded runtime fixed; independent producer/QA final APPROVE, evidence ADEQUATE.
Severity: High — successful equipment transfers contribute no fresh combat stats.
Owner: engine-dev; root integrates, independent producer/QA review.

## Reproduction

Build995f1b2, Linux, Node24.21.0/Vitest1.6.1 ui/jsdom; locale/viewport not
applicable to synchronous store/recorded-combat repro. Seed7, challengeOrdinal0,
ActI BloodMoor. No browser acceptance is claimed by this repro.

1. Create real InnerSight rogueL3 from canonical definition, add/field via real
   mercStore, award2730XP through addExperience. Observe L6, core15/31/16/17,
   baseline lifeMax172/manaMax79/attack25/def26/speed122.
2. Add normal cap items/base/helm-cap with persisted baseRolls.defense6 to
   backpack and call real equipOnMerc(id,'head',cap). Transfer succeeds and
   removes backpack source, canonical map owns equipped cap.
3. Start real startSubAreaRun({subAreaId:'areas/act1-blood-moor',act:1,
   runSeed:7,challengeOrdinal:0}); read initial combat playerTeam merc.stats.
4. Repeat from reset with normal wp1h-short-sword persisted attack7 in weapon.

Expected: fresh combat defense32 with cap6, attack32 with sword7. Preserve
owned saved baseline and all XP/growth; gear projection never accumulates.
Actual: defense26 and attack25. Bare grown baseline control passes.

Regression: src/stores/merc-equipment-combat.test.ts. Genuine corrected RED:
3total/2failed/1control/0pending,exit1,4.193s;
report SHA25681eb9d9e4a784379d4162ee29099a15c3e60c5bdb2448a1639691136c190d91f.
Initial attempt also3/2failed/1control: sword genuine25vs32; cap assertion failed
before stat check because test typo inventory.items instead of actual backpack.
Original test/report preserved; only property corrected before frozen review.

## Root cause, scope and evidence

mercStore.equipOnMerc publishes gear separately in canonical mercEquipment.
combatHelpers.startSubAreaRun passes only getFieldedMerc baseline to
mercToCombatUnit, whose stats/resources ignore that map. Do not patch transfer,
persist equipped derived values or rederive growth baseline: existing growth
intentionally leaves other derived fields unchanged while increasing core/life.

Controlling decision: docs/plans/decisions/
P13c01-merc-equipment-combat-authority-v1.md. Reuse shared aggregate/converters and
G−B equipment delta over owned baseline, changed-speed finalfloor1, zero-delta
exact preservation, explicit pools and fresh-run boundary. Named-skill registered
damage policy, eligibility, save format, economy and no-gear recordings remain.
This does not establish cause of archived Den defeat or authorize stronger retry.

Security check: pass, owner-authorized local composition only. No external
request instructions, credentials, execution/config/security boundary changes.
Workaround: none through existing equip UI; defensive/crit/cadence equipment
needs the fresh-combat authority fix. Named-skill weapon scaling remains separate.

RAW=/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-merc-gear-p_il1gto.
Original assertions, failed attempts and exact command metadata were retained
until independent consumers finished; versioned evidence preserves their results
and hashes. Full plan/RED freeze preceded runtime; final validation and cleanup
are recorded in the linked evidence.

## Final independently approved RED

36total/33failed/3controls/0pending, exit1/4.456s. Both producer and QA verified
live test bytes against frozen copies and approved before runtime changes.
Report SHA2567590fc6a17bcf8efc5b5c40a9779410bb30a74c0a1346d732019db21a4ed1f33.
Helper SHA256aa8435710cad33e5bb4f563d444b3f08d4fffac7a7a59955490b553f94ab3166;
store SHA2565e6732f35593c4790d1d72d0d3b437ec17e520386dd83e183e815595af804a9a.
24 missing-helper feature cases plus 9 genuine adapter/caller failures; missing
module is not the standalone proof of the existing defect. Typed35 RED report
fa989b02d930526e0422558b4bd2f6576e86d164e2664a74a5766bda15790567 and original
35/full report c6387eb9f53b233824f6c74c7b92c0af5d4f1bf444e52a20f4aac24e5570ee0e
are retained. The sole final amendment adds noncanonical saved crit/MF/GF/
resistances to reject replacement by G, independently requested and reviewed.
Decision records exact resource correction and type/lint-only amendments;
RAW retained original failed fixture/test versions and command metadata through
independent review; exact task cleanup followed both retention releases.

## Source-review compatibility finding before corrective guard

Producer independently caught that selecting from one snapshot using find alone
changes the prior getFieldedMerc falsey-ID guard: an owned merc id empty string
and fieldedMercId empty string would now enter combat. Existing save string
schema accepts empty IDs and setFieldedMerc accepts this matching owned entry.
Expected: preserve prior hero-only team even if an empty-ID canonical map exists.
Observed source: old getter returns null for !fieldedMercId; new find matches
empty ID. Add a failing existing-path regression before restoring that guard;
no schema/fielding-policy expansion. This finding is specific to initial fix,
not claimed as the original equip omission.

Related first run650/649pass/1failure/0pending, exit1/27.782s, report
4c4065a20a4075d970e0efad7efe4183c10fd514a5789cf1fbd2e8f6b42e2065.
Sole merc-healing.test.ts failure requires old saved-stats reference identity,
with identical full values. Producer and QA approve replacing Object.is with
full deep equality plus fresh stats/resistances checks to enforce new frozen
isolation contract. All actual factory/pools/loadout/1588ms/heal43/determinism
oracles stay unchanged. Original source/report retained before amendment;
this single stale test is the justified six-code-file exception.

Empty-ID correction RED37total/36pass/1failure/0pending, exit1/4.609s; actual
['hero','merc'] versus expected ['hero'], prior getter-null check passes.
Report6c268d0d813d30a8c15cea289544ffbc65a54786e8b53496a740b60fe93b78c6;
store testc552c4a18a8d541328e791fd10f1df9a5ba8afce560b4073b33b1e8d492a33e5.
Producer and QA independently approved this appended case/guard before the
caller retained fieldedMercId ? same-snapshot find : undefined. No original36
assertions changed. Reviewed focused38/3files passes4.154s,0pending including
unchanged healing outcomes; reportdfa40c8cd461bdcb62d8430e68bd26d0ad67f212babb85eb97912a3b8cecef9f.

## Runtime validation and review

Root-cause helper/adapter/one-snapshot caller implemented. Producer and QA final
source APPROVE after compatibility guard and surgical healing oracle amendment.
Focused38/3,related651/53,fullcoverage2445/142pass0pending;T/L/purity52/build
pass. Exact commands/hashes/coverage/warnings/amendments and cleanup are in
docs/plans/evidence/p13c01a-merc-equipment-combat.md. Both final evidence reviews
APPROVE/ADEQUATE; all consumers released before exact RAW/dist/.vite removal
and verified absence. No A artifacts/processes or cleanup failures remain.
No browser/Den/fullP13 acceptance or BUG047fix is included.
