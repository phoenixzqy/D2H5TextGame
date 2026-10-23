# Fresh native17 v2 — single Far Oasis experiment

Status: implementation preparation only; campaign execution requires root launch
approval after the concrete implementation and specialist reviews pass. This is
a new character and a new run. It explicitly reexecutes the earned prefix; it
does not restore or continue the prior defeat, and it does not reconstruct a
save from retained observations.

The immutable `native17-first-defeat.json.gz`, its summary, the original
literal refusal, and `native17-frozen-plan.md` remain unchanged. The prior
Far Oasis W3 enemy victory remains an actual defeat. Any v2 result is separate
evidence and cannot replace it.

## Frozen prefix and change

Execute the same public production character creation, clock
`1792497600000`, ordinary Inner Sight Rogue hire, allocations, combos, forty
Blood Moor W1 wins/native W2 Flee operations, mandatory Den/Talk/Claim, at
most one hundred further Den challenges to exactly L12, original gear
selection and full Act I route. Keep the native capacity audit and every
original selector restriction. Execute the same earned Andariel Claim/Coif,
Act II quest starts, native tool recovery/assembly, Staff/Sun Claims and
Staff insertion, and unchanged `before-radament` checkpoint. Every first
refusal or actual nonwin in that prefix stops the new experiment.

Immediately before the first Far Oasis challenge, assert all three full
owned backpack payloads against the literals in
`tests/sim/production/fresh-campaign-policy.ts` (`freshCampaignV2`). Those
literals include affix ordering, exact values, native socket-capacity
presence/absence and every other instance field. Audit all three before
transferring any. Refuse on any missing item, payload drift or native
eligibility/service validation failure; never substitute another instance.

Transfer in this order through the existing production equipment commands:

1. Hero amulet `it-6ghhi-2hx`, brass amulet, rare L12: mana29,
   magic dodge3, life31, physical resistance8; no own socketCapacity.
2. Hero chest `it-111b8-2jg`, leather armor, rare L19: defense20,
   physical dodge4, life31, mana20, poison resistance18, lightning
   resistance15, physical resistance12; socketCapacity0.
3. Rogue head `it-23pcn-2ji`, skull cap, rare L19: defense14,
   armor defense11, life26, magic dodge2, poison resistance17,
   lightning resistance10, cold resistance18; socketCapacity1.

These are assertions about items earned during this fresh prefix, never
injected item instances. Preserve Coif of Glory and the Rogue's Blood
Crescent. Assert that core stats, skill ranks, unspent points, hero combo
and mercenary priorities do not change across these transfers. Existing
per-challenge policy freeze remains active.

## Bound and stopping rule

Launch Far Oasis exactly once through the ordinary production challenge
entry point. Use its naturally persisted ordinal and production seed;
ordinal107 is expected from the prefix but is never assigned or forced.
Stop immediately at its first refusal/nonwin, including a draw. If the
entire challenge wins with the hero alive, stop after Return to Map and
before Radament Claim, Book of Skill, Arcane or any other trial. No retry,
post-defeat alteration, extra farming or continuation is permitted.

The test retains the existing conservative maximum492-wave guard and
120-second timeout. Estimated duration is 70–100 seconds for one process;
the native path can stop earlier on refusal/nonwin. This estimate does not
authorize execution.

## Authentic capture and publication

At every normal stop, obtain production `snapshotStores()` and the exact
`exportCurrentSave()` string from the actual stopped live realm. Deep-copy
the snapshot, including native Maps, before cleanup. Attempt production
decode, retain its result/refusal, and compare the full native values and
earned-state hashes. Raw snapshot/export survive decoder refusal. Report
raw snapshot idleState and export's projected `readIdleBonus` idle metadata
separately; surface differences rather than normalize them away.

Publish the exact export string (when available) and a lossless capture
envelope while that realm still exists, before outer cleanup, post-run
provenance checks or primary-report assertions. The capture envelope
includes source-before-import/source-before fingerprints, frozen reference
hashes, experiment identity, native payloads, original stop status/refusal,
last-wave summary and terminal hash. Its source-after is explicitly absent
until the primary report supplies post-run validation. A publication error
names retained paths; exclusively created partial leaves are removed on
write failure. Native publication errors are serialized separately and do
not discard the completed campaign observation. The primary report is
still attempted after cleanup before the publication assertion fails. If
that write also fails, its terminal error carries the original stop and
native capture/publication diagnostic. No existing output may be overwritten.

For a new absolute external `FRESH_CAMPAIGN_REPORT_PATH`, companion files
are exactly `<path>.native-export.json` and `<path>.native-capture.json`.
Preflight all three before importing production runtime or starting combat.
After cleanup, publish the complete primary report before assertions can
fail; a primary encoding/write failure retains the independently published
native evidence. Native capture failure remains separate from the original
campaign stop. There is no IndexedDB write/read, browser Save/Continue,
offline reconciliation, historical-save authenticity, pacing or C2 claim.

## Launch handoff

Only the synthetic no-combat capture contracts, typecheck, scoped ESLint
and diff checks are authorized during preparation. Design and QA/save
specialists review the concrete diff before the root launch decision.
Security assessment: local harness/evidence only, no credentials, external
publication, bypasses, runtime/data changes or destructive operations.

After approval, the root creates a task-owned external scratch directory
and runs once from the claimed worktree:

```sh
trial_dir=$(mktemp -d /tmp/d2h5-fresh-native17-v2.XXXXXX)
FRESH_CAMPAIGN_STAGE=native17-v2-far-oasis FRESH_CAMPAIGN_REPORT_PATH="$trial_dir/report.json" npx vitest run --project sim-contracts tests/sim/production/fresh-campaign-screen.test.ts
```

Root owns those three exact output leaves and their empty scratch parent
until evidence is verified and retained in the requested deliverables.
Remove only disposable task-owned copies after every consumer has finished;
preserve any diagnostic evidence needed after a failed run and report its
exact remaining path and cleanup owner. This plan contains no execution or
acceptance result.
