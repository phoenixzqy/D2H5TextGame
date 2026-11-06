# BUG-460 — Account for diagnostic item allocator history in replay comparisons

- Severity: Medium (QA comparison; ordinary combat remains functional)
- Status: Fixed locally in external replay comparison; independent audit passes
- Owner: root, campaign QA responsibility; no delegated writer
- Build: local `feat/playable-foundations`, HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`
- Environment: WSL, Node24.21.0 native production-store playback; no browser/locale requirement
- Seed: native normal challenge ordinal1165 from the audited earnedL55 save; no supplied diagnostic seed

## Reproduction

1. Run `p15-baal-earned-level55-shiver-v1` in the retained task packet. The first
   respec arm earns loot before the second arm's original native1165 trial.
2. Independently audit the second arm (`shiver10-warmth7`) and save its prepared
   state and successful terminal. Its new item suffixes include the earlier
   arm's process-local allocator consumption.
3. In a fresh process run `p15-earned-baal1165-eve-claim-v1` from that exact
   prepared save. All eight waves win; comparison fails before Eve Claim.

## Expected and actual

Expected: compare native replay rewards and state with explicit item-allocation
provenance. A fresh process resumes allocation from imported item highwater.

Actual: the test assumes byte-identical new item sequence IDs across diagnostic
arms and fresh processes. First new ID is `it-52ljp-1km2` in the fresh replay
versus `it-52ljp-1kot` in the prior diagnostic. The assertion dumps entire saves
and rejects a successful native combat replay before Claim. No Claim occurred.

## Root cause and correction contract

The process-local item allocator is not included in the saved diagnostic
preparation. Existing browser replay controls already reconcile this boundary.
Correct the external comparison using a declared, bijective mapping of exactly
the newly awarded IDs. Require identical item payloads apart from the sequence
ID, contiguous allocation, no collision with existing ownership, and the full
terminal state after that mapping. Preserve original IDs for all imported gear.
Do not alter production allocation, rewards, gameplay values, or native state.

## Evidence

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`

- `p15-earned-baal1165-eve-claim-v1.log` and `-exit.json`: failure after21.859s,
  no owned descendants left alive; exact disposable Vite cache removed.
- `p15-earned-baal1165-eve-claim-v1.raw.jsonl.gz`: original successful native
  combat waves and reward deltas, before the failed terminal comparison.
- `p15-baal-earned-level55-shiver-independent-audit-v1.json`: original successful
  control, all35 trials and their conserved item ownership.

Root retains the scripts, controls, failed attempt and audits as umbrella-goal
evidence until acceptance and consumer completion. No publication or commit.

## Verification

V2 proves a bijective mapping of exactly102 newly awarded IDs, identical item
payloads, contiguous allocation and full native terminal state. Its subsequent
Eve Claim succeeds, but a separate external assertion uses nonexistent
`map.replayOrdinals`; actual replay counters are stored in
`map.challengeOrdinals.nightmare/hell`. V3 corrects that test field and passes
22.173s. No production code or native item allocation is altered.

`p15-earned-baal1165-eve-independent-audit-v3.json` independently passes the
full source/preparation/combat/reward comparison after precisely that ID map,
native explicit Claim,125240XP/104items, mercXP, preserved gear and exact export.
Original V1/V2 failures and their journals remain retained. Production browser
V2 independently reconciles import highwater and all native quest rewards in
both locales/viewports. No commit is created; umbrella integration remains open.
