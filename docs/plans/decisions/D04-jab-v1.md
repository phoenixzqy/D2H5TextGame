# D04 — Jab bounded repeated attempts

2026-10-25. Preimplementation author contract for reproduced BUG203. Root sole
writer; independent design/QA and earned balance remain open. No Jab change or
functionality credit yet. Separate Impale verification remains frozen.

Preserve actual Physical30–45/+3rank, single enemy,5MP,1second cooldown,
unlock1/cap20, no prerequisite, no weapon-stat contribution or equipment gate.
Both existing descriptions promise repeated hits; implement that promise rather
than removing it. Select three independent attempts per accepted cast as an
explicit provisional v1 adaptation. The existing prose proves multiplicity,
not this number, and synthetic evidence does not establish its earned balance.

Use actual `hitSequence:{strikes:3}` through the existing JSON→registered-effect
pipeline and shared bounded sequence runtime. Extend the closed schema's
capability ownership to actual Jab alongside Fury; require Jab's exact active,
Physical,single-target identity and sequence metadata. Do not permit unrelated
skills/contradictory payloads or add a global repeated-attack default. Preserve
Fury's existing five attempts and original-pool rotation exactly.

The original target pool contains one living enemy. Each attempt independently
rolls hit/base/critical and settles ordinary Defense, resistance, personal
shields, reflection, death/corpse/orbs and combo behavior. Misses consume attempts;
no guaranteed hits. One action/5MP payment/cooldown commits for the cast. Stop
when the caster dies or the original target dies; do not acquire another target
or fabricate three hits after an early death. No saved paid state, migration,
resource refill or genuine campaign action.

Write REDs first: native ranks1/2/20, multiple actual event/HP settlements,
miss/crit/Defense/resistance, shield depletion across strikes, reflection/source
death, target death/one corpse/reward, singleton pool with other living enemies,
one resource/cooldown commitment and exact cooldown boundary. Native class,
unlock/rank/alias/MAX/mana/cooldown authority and immutable exact replay remain
required. Pair Fury and ordinary sibling controls so repeated attempts cannot
leak to another skill or alter Fury's existing target selection. Update the
existing Impale Jab-sibling regression from one expected Jab event to the real
authored sequence, while still requiring every Jab attempt to remain Defense-
sensitive and free of Impale bypass/Bleed; do not weaken its mitigation check.

Use the shared display's sequence metadata for current/next/unlearned/MAX;
explain three attempts, damage per attempt and one paid cast truthfully in both
locales. Public allocation/configuration and real battle logs must agree.
Require production en/zh-CN desktop/mobile, exact five-domain Save-close-new-page-
Continue, five-size geometry and individually inspected screenshots. Browser
synthetic imports must be disclosed, not promoted to earned build acceptance.

Order: REDs→closed schema and minimal JSON→native causal/compatibility→shared
presentation opt-in and bilingual copy→essential focused/data/engine/types/lint/
build/browser prechecks→freeze final bytes→one complete useful full suite→local
commits/blob audit→one-row inventory/evidence/verified exact cleanup. Preserve
all failed evidence. No remote operations or release/worktree replacement.

Author security check: pass, scoped local gameplay/schema/display/tests only.
Author plan review: ready; existing shared runtime supports the specified single
original target, per-attempt settlement and stop semantics. This is author
review, not independent approval or earned balance signoff.
