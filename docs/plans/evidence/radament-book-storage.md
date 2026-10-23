# Book of Skill definitions and source-bound save storage

2026-10-23. Definitions commit `94e66eb`; continuing v12 storage implementation.
This implements ADR-006's capacity-independent ledger, not Claim/Read or earned C2.

The authored Radament reward is 5000 XP plus `items/book_of_skill`; the JSON book
definition supplies its one-point Read effect. The loader validates a unique
item/source pair against the exact quest reward. Save v12 requires
`inventory.questItems`, keyed by `<questId>#reward:questItem`, with closed
`{ itemId, state: owned | consumed }` entries. Exact source completion, claimed
flag and objective flags are mandatory. Consumed receipts persist separately
from equippable gear; inventory reset clears the ledger.

Frozen v11 validation (including aura rules) precedes migration to an empty
ledger. Claimed historical quests manufacture neither books nor points. Trusted
builders default only an absent ledger; malformed present values are preserved
for rejection and present undefined throws. Current malformed/missing ledgers
are rejected before persistence replaces disk/live state. Existing synthetic
historical fixtures strip only the new ledger when constructing old versions;
historical assertions and explicit migration targets remain intact.

Independent QA found BUG-097: v1 inventory reconstruction discarded a reserved
ledger before the v11 check. A valid original-v1 control and three corruptions
prove 3 RED /37 passing controls, then 124 affected tests pass. Raw input now
rejects reserved fields for all historical versions before any migration.
QA independently approves final source/test adequacy and reports security PASS.

Definitions: initial causal RED, final325/3 pass. Codec/persistence: initial
27 codec +3 persistence failures; owned/consumed native/JSON, Save/reset/Continue,
repeated import, exact inventory and unchanged points now pass. First full run
reported14 fixture/version failures and one unsafe test-parse lint error;
these were corrected. Second full run: **8806/286 pass**,222.26s (over budget).
The subsequent type-only guard narrowing corrects TS2339; final engine4279/110,
typecheck, lint and production build pass. All four production JS chunks pass
the five-pattern test-bridge scan. Full8806 precedes only that equivalent guard
narrowing; final engine includes the actual narrowed guard and all codec cases.
Final build retains the existing >500k chunk /2.57MB manifest budget warnings.

Raw logs and exact ownership manifest remain root-owned through D11/C2/full-v1
consumers at `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-radament-book-j3ti74ac`.
Root removes retained diagnostic evidence when those consumers finish. Shared
tool caches remain untouched. No server/browser proof was run for storage.
All validation handles are terminal and independent readers released. Verified
disposable cleanup removes exactly dist/dist2/dist3 (2280files/123179981bytes),
remaining[]/failures[]; `cleanup.json`, `bridge3.json` and `ownership.json` retain
the exact paths and file inventory. No task-owned processes remain.

Claim, Read, Inventory UI, Atma and localized quest copy remain pending. No
earned Act II or C2–C4/full G0–G7 acceptance follows. Local commits only.
