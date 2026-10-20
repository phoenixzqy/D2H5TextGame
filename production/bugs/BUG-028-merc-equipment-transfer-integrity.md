# BUG-028 — Conserve authoritative items during mercenary transfers

- Status: fixed; root/producer final review APPROVE. P03b05a evidence:
  docs/plans/evidence/p03b05a-merc-equipment-integrity.md.
- Severity: Critical (stale caller can replace saved item contents or consume
  unrelated same-ID container entries; transfer rejection is ambiguous).
- Owner: store/frontend developer; QA/root reproducer.
- Build:db83bbe,2026-10-20,Vitest1.6.1/jsdom on Ubuntu26.04,
  Node24.21.0/npm11.19.0. Direct-store reproduction has no browser/viewport/locale
  dependency; no physical-browser claim. Seed: not applicable.
- Contract: docs/plans/p03b05a-merc-equipment-integrity.md; accepted D09 integrity.

## Reproduce and expected/actual

1. Own actual InnerSight merc via authored factory/store. Put rare helm A with
   affix Map/base rolls/runes in backpack. Call equipOnMerc using stale same-ID
   caller with level99 and different fields. Expected complete stored A equipped
   and exactly one source index removed; actual caller fields replace stored
   contents, or valid A refuses when caller base is unknown.
2. Call the same action with a nonexistent source. Expected both stores unchanged;
   actual merc equipment is invented. A valid source with unknown owner similarly
   creates an orphan equipment map.
3. Store a sword under the requested ID while stale caller still says helm.
   Expected incompatible_slot/no publication; actual equips stale helm payload.
4. Swap against an equipped helm with same-ID backpack/stash survivors. Expected
   first backpack source only removed, full displacement appended once with
   equipped=false/no equipSlot. Store does not transfer inventory; UI separately
   calls removeItem, whose ID filter removes all backpack/stash matches, and
   adds displacement still flagged equipped=true.
5. Unequip current owned helm. Expected complete normalized return to backpack
   exactly once; current action only returns it, leaves equipSlot, and can remove
   legacy orphan gear for an absent owner.

## Genuine RED evidence

`npx vitest run --project ui src/stores/merc-equipment-transactions.test.ts --reporter=dot --silent`

07:12:05UTC:4failed/1file1.80s. Actual expected rare/Map-bearing helm received
caller normal/level99 without saved fields; missing source and incompatible
stored slot published invented equipment. Unknown-owner precedence returned null
(contract-only assertion, not itself an orphan observation).

Expanded07:12:52UTC:8failed/1file1.77s, before any runtime edit. Valid-source
unknown-owner now proves orphan map publication; duplicate swap and full unequip
prove missing inventory transfer; legacy orphan unequip mutates equipment.
Decisive failures retained here and in the regression source; no disposable
screenshot/log required for these direct state assertions.

Mounted actual MercsScreen RED at07:14:20UTC:
`npx vitest run --project ui src/features/mercs/MercsScreen.equipment-integrity.test.tsx --reporter=dot --silent`:
3failed/1file3.95s. Ordinary swap removes unrelated same-ID stash item;
en/zh stale-candidate capture changes current source to sword before handler,
then actual UI removes it and equips obsolete helm instead of refusing.
All failed on literal container state before feedback assertions. The unreached
zh no-compatible expectation was corrected to the existing authored copy before
the runtime fix. Browser fixture acceptance is separate follow-up evidence.

## Cause, workaround and boundary

Transfer ownership split between UI and mercStore. Null means both rejection and
successful empty-slot equip. The UI unconditionally removes the requested ID,
while the store trusts its supplied item/owner. Centralize preflight/current
source/complete synchronous transfer behind discriminated results; UI delegates
and preserves picker on refusal. Do not invent cross-domain atomic-subscriber
guarantees. Workaround: avoid same-ID/stale selections and inspect exports;
not a permanent solution. Preserve existing return capacity/eligibility policy
until separately reviewed guards. No schema/migration/economy change.

Security check: pass. Trusted local inventory operations and isolated tests;
no remote writes, credentials, permissions, policy bypass or dependencies.
