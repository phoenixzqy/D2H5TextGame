# P15 — Invested Blizzard growth

2026-11-04. Type: numeric tuning. Root owns the retained human2 worktree.
References: `docs/design/skills-spec.md`, playable-target G2/G3/G7 and
[BUG643](../../../production/bugs/BUG-643-cold-static-field-priority-starvation.md).
The full private-v1 scope authorizes this reversible tuning. This is a new
provisional authoring decision, not a finding that the old engine violated its
data contract or independent design/balance approval.

## Cause and change

The retained Ancients control has Blizzard20, Nova20, Cold Mastery20 and Ice
Blast19. It draws after four earlier waves win; Prayer died in the preceding
wave. Static Field has400damage events totaling90,119, Blizzard54landed hits
totaling19,366 and Nova24totaling1,638. Static cannot finish targets. Rejected
order and owned-weapon comparisons remain closed, with no adopted preparation.

Blizzard's scalar per-rank damage grows by8, reaching237–277 at rank20. Meteor
already grows by80, reaching1,620–1,670. Both unlock at24, target all enemies and
have a four-second internal cooldown. Use that existing growth budget for the
Cold finisher; do not add Attack scaling or change first-eligible selection.

| Parameter in `src/data/skills/sorceress.json` | Before | After |
| --- | ---: | ---: |
| Blizzard `scaling.damagePerLevel` | 8 | 80 |

Rank1 remains85–125; rank2 becomes165–205; rank20 becomes1,605–1,645. MP35,
four-second cooldown, one attempt per enemy, Chill, unlocks/prerequisites and
all other skills remain exact. No save shape, schema extension or migration.
This supersedes only Blizzard's old +8 increment. The existing schema permits
numeric growth; no accepted global safe band exists, so80 remains provisional.

Against a constructed Cold75/MagicResist146 target in ActV with source-owned
Cold Mastery91, effective Cold resistance is−16. Noncritical Blizzard20 changes
from128–175 to1,715–1,762. Resistance precedes flat Magic Resist. With no mastery,
the new range is255–265. Rank1 can still reach the one-damage floor against this
late target; very high Magic Resist must continue to mitigate invested damage.
These are isolated hit bounds, not campaign DPS or viability. Meteor's different
MP50/Burn/armor-melt/Fire-Defense pipeline prevents any equal-DPS inference.

Correction during verification: the original estimate wrongly inferred35points
of enemy penetration from `snapshot.act: 5`. The actual engine only uses the
defender's explicit `resistPenalty`; retained Frozen Terrors have none. Corrected
the estimates/test expectations above, with original RED and initial post-edit
failures retained. This changes neither the chosen coefficient nor enemy input.

## Verification and limits

Before JSON changes, add paid native one-cast RED cases at ranks1/2/20 with and
without source-owned mastery. Assert exact seeded HP loss, MP35 debit, one
action, Chill and registered cooldown. Include high Magic Resist, Attack
independence, insufficient MP, natural seeded miss, input immutability and one
deterministic replay. Constructed fixtures grant no campaign credit.

After the one-value edit, update only stale authored preview growth and real
Summoner rank20 bounds:96–126 becomes1,122–1,152 at Cold25/MagicResist81 in ActII.
Preserve all original assertions/seeds. Run those affected cases, existing Cold
Mastery contracts and Blizzard geometry, scoped strict types and explicit lint.
Actual Ajv contracts replace the nonexistent `validate:data` npm script.

No retained-encounter replay, native campaign admission, new training, farming,
ordering or equipment trial is included. The genuine Cold successor remains
level73/next1225; original200-training and diagnostic budgets remain closed.
BUG643 remains open until legal native progression succeeds under a new bounded
prospective plan. Early-rank fairness, population/holdout balance, acquisition,
economy/pacing, higher difficulties and independent acceptance remain open.
Counts remain14 intended ActI/7 intended Normal/formal0of210; privatev1 incomplete.

Plan review: ready after adding the affected Summoner literal, distinguishing
raw growth from DPS and retaining failures/closed budgets. Security check: pass
for authorized local data/tests/docs; no credentials, network or permissions.
No broad checks/build, agents/install/commit/push/CI/publication. Root retains
the required external `d2-blizzard-growth-hcw0sxn5` packet and human2 through
umbrella review, then owns exact cleanup/release.

## Local implementation result

[Verification](../../balance/2026-11-04-blizzard-investment-growth.md) records the
one-value edit and84unique affected passes, scoped strict types and explicit lint.
Original discovery/estimate failures and corrected RED remain retained. No native
campaign admission or formal acceptance; BUG643 remains Open at73/next1225.

## Later native progression result

The separate [bounded continuation](../evidence/p15-cold-post-blizzard-act5.md)
wins Ancients1225 and Throne1226,15waves total, with original priority/earned
gear. Actual74/next1227 completes Normal and all saved quest/title/unlock rewards.
BUG643 is locally resolved for intended progression. Earlier no-admission results
above remain historical tuning-slice statements; population/holdout/fairness/
pacing and independent acceptance remain open. Counts14ActI/8Normal/formal0of210.
