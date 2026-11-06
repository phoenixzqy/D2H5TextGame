# BUG-388 — Complete the three town mercenary side quests

- Severity: High — three advertised side objectives/rewards have no executable path.
- Status: Resolved locally; bounded current30 acceptance with reviewed unit reconciliation.
- Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus preserved local changes.
- Environment: Linux/WSL static source/cross-reference reproduction.
- Browser/viewport: not applicable to this source-routing reproduction.
- Locale: zh-CN and en advertise the named companions.
- Seed: not applicable to missing objective publication and town discovery.
- Affected systems: engine-dev, frontend-dev, content-designer; root integrates.

## Reproduction

1. Read the Act I Kashya, Act II Greiz and Act III Asheara side quests in
   `src/data/quests/side.json`: each requires exact `obj-hire`/`mercId` and
   rewards that same `mercenaryUnlock`.
2. Compare `HIREABLE_IDS_BY_ACT` in `src/data/loaders/mercs.ts`: the exact Rogue
   Trainee, Blessed Aim and Frozen Armor targets exist in the pool but none is
   offered by the ordinary Hire roster.
3. Follow `hireMerc` in `src/stores/mercStore.ts`: ordinary ownership/fielding
   does not publish these side objectives or source receipts. Follow
   `claimReward.ts`: these three unlock reward bundles remain unsupported.
4. Follow `src/data/loaders/towns.ts`: dialogue-driven Act II town NPC discovery
   includes Atma/Drognan, but no canonical Greiz dialogue/current-town entry.

Expected: complete the authored exact recruit objective at its captain, then
separately Claim one-time ensure-owned support while preserving investment.

Actual: none of the three exact hire side paths can complete through the
advertised roster; Greiz also has no reachable current-town source.

## Evidence and repair boundary

Producer’s read-only family audit reproduces all three paths and existing hero
gates1/12/18 plus fresh merc levels3/10/16. The
[bounded family draft](../../docs/design/town-enlistment-family.md) preserves
the exact definitions/prerequisites and proposes accepted explicit Warband
Enlist/Re-enlist mechanics with one shared future save boundary. Independent
DESIGN-REVIEW APPROVE ratifies the dedicated action policy. No runtime, save30,
replacement global roster or broader recruitment economy is implemented here.
Nihlathak/current29 acceptance precedes this family’s runtime work. No CI,
commit/push, deployment, owner answer or playtest hold is imposed.

## Implementation handoff

Nihlathak/current29 is accepted locally with uninterrupted22900 tests/1082 files
and exact final source manifests. Explicit disjoint owner handoffs are active;
literal accepted29 equality precedes live family widening. Runtime and bounded
acceptance are still pending. [Current evidence](../../docs/plans/evidence/town-enlistment-family.md)
records checks as they complete without claiming earned campaign acceptance.


## Final-suite regression (2026-10-30)

Full ordinary unit-v2 reproduced12 failed assertions across3 files (1,087 passed
files/23,192 passed tests;1,090 total files/23,204 total tests), exit1.
The early family JSON-record guard preserved rejection but replaced the existing
receipt-specific diagnostic in11 assertions. One older ActII roster assertion
omitted the newly authored canonical Greiz. Preserve this complete failed log.
Correct the upstream guard's field-specific errors without moving validation or
weakening rejection/getter protections; add Greiz to the exact expected roster.
Existing receipt assertions remain intact. Final acceptance is still pending.

## Resolution

The two-file final correction passes focused180/4+13/1 and both scoped lint
checks. Independent CODE-REVIEW APPROVE and TEST-EVIDENCE ADEQUATE confirm
unchanged admission/descriptor order and exact canonical roster coverage.
All1090files/23204tests were exercised in the broad run; all12 failures are
accounted for and rerun successfully. The broad run remains exit1, explicitly
not an uninterrupted full-green result. Final strict types-v3/build-v3 and
headed bilingual browser-v3 pass. Browser checks cover fresh/retained/replacement
Claim branches and exact save/import/close/reopen, with762 stable bundle files.
Independent browser evidence is ADEQUATE/UX APPROVE; exact browser disposables
are removed and every owned port is closed. Authoritative retained receipt:
`d2-town-enlistment-roe6f2v5/current30-acceptance.json`.
See [current evidence](../../docs/plans/evidence/town-enlistment-family.md)
for scope limits. No earned-campaign, balance, pacing or full-private-v1 claim.
