# P15 — Earned Act II caster equipment diagnostic, v1

Provisional2026-10-30, BUG441. Retain all earlier failures. This is a separate
policy, not a rewrite of the closed14build registry or automatic balance acceptance.

Clone bounded-v1 fresh L1 route and preserve its exact346-wave/entire-export
ActI prefix. Same allocation, original merc, route/order, authored-level training,
three attempts per area, six recovery cycles, L28/400admissions/1200s/20logical
combat-hour limits. No enemy/skill/stat/loot/data edits; only ActII preparation changes.

At ActII preparation, rank actual eligible owned backpack equipment using the
native comparison pipeline. Caster defense score is LifeMax times attackSpeed,
divided by mean received damage for60raw cold/lightning/arcane hits after native
resistance then flat MR, times magic hit chance. Candidate manaMax>=80, defense
at least80% and attackSpeed at least90% of the first ActII preparation baseline.
Strictly improve this score, deterministic item-ID ties. This permits explicit
physical-attack/resistance tradeoffs. Native equip controls eligibility/capacity.
Retain existing monotone merc equipment policy; do not switch merc or allocate
free points. Retain original monotone hero pass, then explicit caster pass.

Before preparation, keep top3eligible caster-score and top3net-stat hero
candidates per slot plus top3monotone merc candidates per slot, and all nonnormal
gear. Only nonshortlisted normal items may be discarded, using native bulkDiscard.
Retain actual full discarded payloads and exact before/after removal identities;
no income or equipped-item mutation is allowed. Move nonshortlisted retained
rares/uniques to native stash until bag<=90. If bag/stash capacity cannot be
resolved with those rules, stop as budget/constraint, never silently delete more.
No protected earned save or owner save is modified: fresh isolated native run only.

Independently audit earned item payloads against terminal ownership plus explicit
once-only discarded payloads (disjoint unique IDs); keep all raw reward deltas
unchanged. Native equip may alter only placement/projection flags. XP/currency/
materials and quest/point/save/source audits remain exact. Record every choice,
refusal, discard/transfer, failed fight and final state. A fresh completion still
needs browser follow-through and broader builds/pacing acceptance.

Plan review: bounded and reviewable; tests use native eligibility/comparison and
conservation checks at each mutation. Security check: pass; local fresh diagnostic
only, owner saves untouched, no installs/network/publication/CI/permission change.
