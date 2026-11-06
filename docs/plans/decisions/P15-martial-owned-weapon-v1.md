# P15 — Martial owned offensive claw preparation

2026-11-03. Addresses [BUG664](../../../production/bugs/BUG-664-martial-owned-claw-selection.md).
The retained Act IV failure BUG652 remains Open.

The retained level49 hero keeps a socketed Wrist Blade because all-stat
nondecrease rejects the loss of4MagicResist on multiple eligible owned Greater
Claws. The best candidate's existing native basic physical expectation improves
278.710037→329.673792. Reuse `physical-offense-v1` in the intended Martial profile
from level1, the authored Talon/Tiger/claw-mastery unlock. Store that transition
in campaign JSON. This preparation proxy includes native capped cadence and
critical overflow; it is not measured skill damage, survival or boss acceptance.

Keep the existing first-claw acquisition precedence and later claw affinity,
strict eligibility (including base requirement over item level), deterministic
score/ID ordering, native staging/equip/capacity refusal, reservations and native
resource clamps. Armor, other profiles, historical preparation and global
comparison rules retain their current behavior. No damage tuning, skill priority
change, gifts, income, healing, admissions or renewed exhausted budgets.

Write affected RED cases for offensive tradeoffs, level1/49 behavior, ineligible
claws and stronger nonclaws. Reuse existing custody/economy/idempotence coverage;
run only the equipment regression file plus scoped strict types/lint. Any exact
retained native preparation check gets a separate prospective zero-combat plan,
retains all intermediate/partial outcomes and cannot restart on failure.

Plan review: ready; diagnose first, reuse shared policy, distinguish preparation
from encounter acceptance and preserve original saves/failed attempts.
Security check: pass; authorized local evaluation uses existing owned native
transactions, with no external communication, credentials, permissions, install
or CI changes. Root retains human2/required evidence through umbrella review;
no new agents, commit, push or publication.

## Result

Implemented locally. All39equipment cases, final scoped strict types and
explicit two-path lint pass. The retained native check selects the expected
owned Greater Claws in28actions; a second preparation is byte-exact unchanged.
Whole-save reconstruction verifies all394items, current resources and unrelated
progression at each action. No combat or earned-clear claim; BUG652 remains Open.
[Evidence](../evidence/p15-martial-owned-weapon.md) records original failures,
exact successor, limitations and verified disposable cleanup. Root self-review
is not independent final QA.
