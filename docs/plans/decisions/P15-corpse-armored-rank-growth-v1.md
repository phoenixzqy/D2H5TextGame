# P15 — Earned-rank damage for the Defense-ignoring corpse blast

2026-11-03. Owner: root. Type: provisional numeric tuning; implemented; focused functional checks pass. Full private-v1 and formal 0/210 balance acceptance remain open.

## Evidence and decision

Native admission 1604, Highlands wave 4, creates its first corpse at 1600 ms,
casts CE 14 times and never falls below 596 Mana. The cast sequence deals 22,542
direct Fire damage across the entire pack. Two survivors started at 11,409 and
21,147 Life. CE20 still has only 164–194 base damage. Payment, corpse supply,
curse application and target selection work; this is insufficient rank damage,
not evidence of a resistance, mana or scheduler defect. Source events and the
saved-event diagnostic are retained under `p15-1604w4-saved-diagnostic-v1.json`.

Change CE's JSON `scaling.damagePerLevel` from 6 to 80 while retaining its current
Defense bypass. Rank 1 stays 50–80; rank 6 becomes 450–480; rank 20 becomes
1570–1600. This uses the existing Meteor rank-growth magnitude as a reference
for a late-rank all-enemy spell. CE additionally requires a real finite corpse.
It is a material power change, not a bug fix or proof of class parity. Keep
20 MP, 2 s cooldown, Fire mitigation/dodge/crit/absorption, Ignite, strict actual
Player authority, FIFO corpse payment and wave reset. No new schema/save field,
resource grant, monster change or rotation change.

The earlier +80 ordinary-Defense experiment remains rejected: 96/100 clears
still violated its frozen no-new-fatal/no-win-regression rule. Its old results
are neither reclassified nor replayed. The present contract includes the later,
independently delivered Defense bypass and uses a different earned successor.
This explicitly supersedes D06-defense-v1's prohibition on revisiting numeric
growth for development. It does not reopen that experiment, its budgets or its
acceptance sample. No result here can count toward the 210 formal cells.

## Implementation and verification

Update JSON, its independent exact semantic guard, literal engine damage
oracles and bilingual current/next preview oracles together. Descriptions already
interpolate the actual range, so no additional UI or translation code is needed.
Preserve negative guard tests and add an explicit stale +6 rejection case.
First demonstrate the new damage assertions failing against current production;
then run only CE definition/combat/Skills, native corpse lifecycle and shared
consumer controls plus scoped strict types/lint/schema loading. Reuse earlier
unaffected browser evidence; numeric previews have direct bilingual UI checks.

After functional checks, freeze current source and continue only from the actual
earned next-1605 save. Any native continuation must have its own finite resource
bound, keep all old costs and failed rewards, and preserve the terminal status
of the prior first-nonwin training stage. Do not retry old ordinals or select
another coefficient from results. Native progression may inform the remaining
work, but does not establish fairness, safety, pacing or final acceptance.

Plan review: ready for this source correction; broad balance remains unproven.
Security check: pass; authorized local first-party numeric source/tests/docs.
The owner's ongoing full-implementation authorization covers this routine
design choice. No agents, installation, commit, push or publication.

## Functional outcome

Seven behavioral assertions failed before the coefficient change. The focused
seven-file run passed351cases and exposed two existing PE fixture failures.
Exact prechange production bytes reproduce both; [BUG619](../../../production/bugs/BUG-619-poison-native-fixture-preconditions.md)
records the stale automatic-focus timeline and the nonfractional energy26
precondition, their corrected strict oracles and two passing targeted cases.
The resulting union is353distinct passing cases. Four changed TS/TSX paths
passed explicit lint; the repaired PE file independently passes lint. Scoped
strict types pass with the existing UI test setup included. Numeric bilingual
previews pass; no duplicate browser or earlier-act campaign run was needed.

This is functional correctness only. Freeze the final source and observe only
new native populations from next1605. Preserve every prior controller's terminal
state and costs; the next stage may use at most77training entries, the unused
remainder of83after6were actually spent, and at most1Ancients entry. Stop at
first nonwin/technical failure, level75or bounds. No coefficient sweep or
backdated baseline is authorized by this outcome.
