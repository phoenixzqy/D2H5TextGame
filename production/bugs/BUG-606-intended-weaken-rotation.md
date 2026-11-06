# BUG-606 — Use learned Weaken in the intended bone rotation

Status: fixed locally; conditional earned clears verified; population validation pending. Severity: Medium.
Found: 2026-11-02. Owner: root (campaign policy/QA responsibility).
Base: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus retained local changes,
production source authority77. Environment: Linux/WSL native campaign Vitest;
no browser, viewport or locale dependency. Timestamp1793304000000; combat seed7.

## Reproduction

1. Create a native Necromancer and sequentially grant fixture XP through20.
2. Allocate available points with necromancer-bone-intended-v1 at every level.
3. Project the complete native hero and Corpse Explosion authority.
4. Record combat against two stationary constructed targets, with1/10000Life.
   Supply neither a curse nor a corpse.

Expected: learned rank1 Weaken pays6Mana and applies its finite all-enemy curse
before offensive filler; the first real kill still makes CE the next hero action.
Actual: Weaken is learned but never casts, because the intended priority omits it.
The focused regression reproduces the missing cast before any policy correction.
Workaround: the player can put Weaken into the combo using the native skill UI.

Evidence: p15-intended-weaken-red-v2.json (one failed selected assertion;
50excluded cases) under
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1.
The v1 fixture failed character-name validation and is retained as a fixture
error, not a bug reproduction. Regression:
tests/campaign/intended-growth.regression.test.ts, named
`pays for learned Weaken before offensive filler without delaying the first earned corpse at native level 20`.
Affected system: intended campaign evaluation/preparation policy; production
Weaken mechanics and the player's configurable rotation already exist.

The earned defensive pilot loses its bounded Dry Hills attempts with large
lightning/cold damage and available Mana. It motivates this check, but does not
prove that this omission alone explains the route failure.

## Plan and review

Add only Weaken to the intended bone JSON priority after Decrepify and before
Amplify Damage. Preserve CE-first priority, every allocation target, other
profiles, historical evidence, native budgets and D04-Weaken tuning. Verify
actual payment/status onset/expiry and first real-kill CE consumption/damage;
run affected growth/rotation/registration cases and scoped strict types/lint.

Plan review: ready. Stationary targets prove rotation/payment, not incoming
damage reduction or earned survival. Existing Weaken consumer coverage proves
the damage rule; a separate declared earned pilot is required for survival.
Security check: pass; local policy/test/docs only, no dependency, credential,
network, CI, resource-grant, publication or production-data changes.

## Diagnosed revision before acceptance

The additive priority proposal fails three affected first-kill checks. The
retained p15-intended-weaken-diagnosis-v1.json proves a1500ms hero action cycle
alternating Bone Wall, Weaken and Amplify, with no damaging action through60s.
Do not weaken the existing first-kill assertions or inject a companion to mask it.

Revised plan: declare a bone-specific combo policy selecting the first learned
curse from the ordered Decrepify/Weaken/Amplify preferences. Keep its original
position relative to CE, Bone Wall and Teeth; omit the two alternate curses
from the submitted native combo. This is a preparation choice, not a new global
curse exclusivity rule. Verify sequential20/24 paid Weaken/Decrepify plus solo
first-kill/CE, alongside the existing early/later growth/rotation controls.
The profile declaration and policy type identify the new behavior explicitly;
historical profiles retain their existing combo behavior. Plan review: ready.

## Local resolution

The revised bone-survival-curse-v1 policy passes eight selected native cases
(44 excluded), final scoped strict types and explicit lint, all exit0.
Evidence: p15-intended-weaken-selection-green-v2.json/.log/-exit.json and
p15-intended-weaken-types-v3-exit.json / p15-intended-weaken-lint-v3-exit.json
in the retained packet. Parameterized levels20/24 verify native paid Weaken6 /
Decrepify20, real finite all-enemy status and first-kill CE without alternate
curse starvation. Existing sequential/batched growth, registration and native
first-corpse checks at6/12/24 remain passing. No production mechanic/data tuning.
These checks resolve the policy defect; they do not prove earned-route survival.

## Conditional earned follow-up

The original survival-curse branch clears Dry Hills but exhausts three Far Oasis
draws. Removing Teeth is worse and rejected. Already learned Amplify clears Far
Oasis in one admission/five wins; a declared destination preference now selects
it there and restores the defensive default elsewhere. Eleven distinct affected
cases plus final scoped types/lint pass, production authority77 unchanged.
The authenticated successor clears Lost City in one admission/six wins and
completes Staff preparation using native claims/Read/growth. Independent full
readback passes. Lost City entry22 is below whole-challenge target26; these
conditional clears do not establish population/pacing or full preparation-policy
acceptance. Retained failures/costs remain. See
[complete evidence and next action](../../docs/balance/2026-11-02-intended-survival-curse.md#conditional-comparisons-and-area-specific-preparation).


Successor update: [Act II training evidence](../../docs/balance/2026-11-02-intended-act2-training.md)
retains both terminal Arcane-preparation comparisons. BUG607's shared lower-level
selection is fixed locally; corrected Dry Hills farming still loses after one
clear. BUG608 records the separate caster damage/party survival finding. Arcane
is unentered; no further curse preference or production tuning has been added.
