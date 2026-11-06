# P15 — Fire Ball earned-rank throughput

2026-11-01. Type: numeric tuning. Root sole writer; retained human2 claim.
References: BUG539, D04-sorceress-direct-fire-v1.md, skills-spec §3.1.

| Parameter | Before | Candidate | Reason |
| --- | --- | --- | --- |
| Fire Ball scaling.damagePerLevel | 7 | 120 | rank8 clears ordinary242Defense after50%fire |

Rank1 stays70–100; rank8 becomes910–940, cap20 becomes2350–2380. The coefficient
is a provisional curve knob; no numeric safe range was previously accepted.
Rank8 minimum mitigated hit becomes213 before crit/Inner Sight, supplying about
6000 damage over28 casts instead of a one-point floor. All existing20MP/1s,
level12/cap20/prerequisites, single-target/Burn, hit/dodge/crit and ordinary
resistance/Defense behavior remain. Other fire skills and global mitigation stay.
This supersedes only D04's +7 number, not its functional identity.

Retain current/native and projected18/24 failures. Freeze native and next-entry
Radament inputs; compare16 seeds per input before/after without any settlement.
Add a real registered rank8 armor regression and retain RED before changing JSON.
Update authored literal expectations in catalog and en/zh preview tests. Existing
schema has the field; native Ajv checks replace absent validate:data script.
Run affected direct-fire/mitigation/Burn/registry/schema/UI cases and scoped types/lint.
Bind the precise source transition, then qualify all five Far waves from exact
actual14/20955/119 state before native continuation. Preserve partial rewards,
Cube/action chronology, gear/materials/reset counters and the original Rogue.

Acceptance: schema-valid data; real rank8 noncritical hit>200 at242Defense/50%fire;
paired frozen-seed throughput and whole-area success; exact native continuation
and independent custody/quest/income readback. A narrow pass does not close
cross-build fairness, holdouts, later-act viability, economy or30–50hour pacing.
No authoring permission is pending: the existing complete-v1 implementation scope
and owner instruction to resolve routine implementation choices authorize this
local reversible tuning. No publication or new dependency is involved.
Security check: pass; local first-party numeric data/test change only.
Plan review: bounded root fix, no per-boss exception or save grant; large early
rank-power change requires the still-open whole-game balance gate before ship.
