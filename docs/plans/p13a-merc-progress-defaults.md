# P13a — level-aware missing mercenary progress

Status: accepted implementation8e6076e; root/producer plan/source/final review
APPROVE. Validation and remaining gaps are in execution-ledger.md. This bounded
P13 child fixes the existing quarantined defect; it does not settle D10/D11 or
close recruitment/economy/earned-progression acceptance.

## Observed problem and contract

`mercStore.initialProgress()` always uses level1's60XP, including newly hired
authored mercenaries starting at reqLevel3 or higher. Missing-entry getter and
award paths repeat this default; MercCard independently shows50. Existing
`mercXpForLevel(L)=floor(60*L*1.30^(L-1))` is authoritative: L3=304 and L10=6362.
A fresh L10 merc awarded60XP must stay L10/XP60 with unchanged stats.

Initialize a new merc's progress from its actual level. For an owned merc whose
progress entry is absent, getter and positive-XP award use the owned level;
unknown-ID reads retain the existing harmless level1 fallback and unknown-ID
awards remain no-ops. Reading defaults must not mutate store/save state.
MercCard uses the authoritative getter for fallback rather than its own curve.
Preserve subscriptions to saved progress and level updates.

Explicit progress entries remain authoritative, including noncanonical saved
thresholds. Preserve hydration, schema version, explicit XP/thresholds, factory
reqLevel, merc share `floor(total awarded heroXP*0.75)`, curve and per-level
gains. Repairing historical explicit thresholds/phantom gains needs a separate
compatibility policy. This fix requires no schema bump or migration.

## Implementation and verification

Worker ownership: mercStore.ts/test, MercsScreen.tsx/test,
combatHelpers.test.ts and existing docs/bugs/quarantined-merc-xp-initial-progress.md.
Root owns this control and execution ledger. No data/curve/gacha/reward redesign.
Do not revert other contributors' changes. Use a separately claimed worktree.

Before runtime edits retain genuine RED for new-L10 and missing-entry defaults,
UI fallback and the restored deterministic real-combat XP path. Replace the
skipped combat case with explicit startSubAreaRun runSeed/challengeOrdinal and
a fixed fixture whose actual merc share is at least60 but below6362; assert
that precondition and complete level/residual/threshold result. No weakened
expectations, synthetic XP as a substitute for actual combat, timing seeds or
soft skips. Separate direct store cases cover exact threshold, residual/multiple
levels, absent owned progress, no-fielded/unknown controls, explicit custom
progress preservation and actual authored hire initialization.

UI regression observes a missing-entry owned merc at its actual level, an owned
level update while progress is still absent, and later explicit progress
publication. Run related/fast loop, full unit, typecheck/lint and build;
record timing-budget failures separately. Review code/test/evidence before
integration. Correct stale shop-scaling/migration/approximate-number claims in
the existing quarantine report while retaining historical observation evidence.

Ordinary earned recruitment/fielding/combat L3→L4 at304XP, exact stat gains and
save/reload remain a separate P13 acceptance card. High-power integration
fixtures establish wiring, not earned progression, pacing or full campaign.
