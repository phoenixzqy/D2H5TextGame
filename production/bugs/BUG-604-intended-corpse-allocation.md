# BUG-604 — Learn the intended Corpse Explosion signature at level six

Status: fixed locally, uncommitted; scoped verification passed. Severity: Medium.
Found: 2026-11-02. Owner: root (campaign policy/QA responsibility).
Base: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus retained uncommitted
source authority76. Environment: Linux/WSL native campaign Vitest, no browser
or viewport; locale-independent. Profile: necromancer-bone-intended-v1.

## Reproduction

1. Create a fresh native Necromancer at timestamp1793304000000.
2. Allocate native earned points using the intended profile and shared initial
   Inner Sight Rogue, equipment, recovery and training rules.
3. Run the declared P15 intended corpse Act II pilot v1. Admission seeds are
   the native hash of canonical area ID and recorded start clock in its journal.
4. Inspect the terminal level-seven skill ranks and recorded hero actions.

Expected: learn Corpse Explosion at its level-six unlock, before optional
Weaken/Dim Vision points, and use it after a real allied kill.
Actual: Weaken and Dim Vision are bought first. The pilot exhausts opening
training at level7 without CE learned or cast. The generic growth check allows
signatures two levels after unlock and misses this boundary.

Evidence: p15-intended-corpse-act2-pilot-v1.json, its full journal and passing
independent p15-intended-corpse-pilot-readback-v1.json, retained under
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1.
The original reader failed because it omitted42enemy-resurrection consumptions;
the corrected reader verifies every such consumption against a native action
and revive event. That was a reader defect, not a production corpse defect.

## Quick design and implementation plan

Move only the first CE rank target before Weaken/Dim Vision, after the existing
Teeth/Bone Armor/Amplify targets. Preserve native budgets, prerequisite order,
later targets, other profiles, historical runs and production mechanics/data.
Add level6 to the native real-kill/paid-cast fixture and require the sequential
growth case to learn CE at6. Retain RED evidence before the JSON correction.
Run only affected Necromancer growth/rotation and registration checks, scoped
strict types/lint. Any subsequent pilot must start fresh with frozen inputs;
do not extend the failed v1 history or claim population/balance acceptance.

Plan review: ready; verify both sequential and batched level-six allocation,
as well as later native casts. CE priority alone cannot create a first corpse;
the retained pilot tests earned acquisition/first-kill viability separately.
Security check: pass; local policy/test/docs only, no dependencies, credentials,
network, CI, production grants, resets or publication. Root-only execution.

## Resolution and verification

The first CE target now precedes optional curses. The new sequential level-six
assertion reproduces RED before the correction; the batched fixture already
passes and is not claimed as a reproduction. Six selected native cases pass
afterward, including real-kill/corpse/mana/damage cases at6/12/24, sequential
and batched growth, and all-profile registration. Scoped types/lint pass.
Regression: tests/campaign/intended-growth.regression.test.ts. No commit was
created under the owner's session constraints.

Fresh pilot v2 learns CE at6, clears Act I and reaches18, then loses all three
Rocky Waste attempts. It records1753CE casts/consumptions and35060mana paid.
Full journal readback reconciles native/exported earned state, all corpse
consumers and frozen inputs. The reader also needed native negative-zero score
decoding; both original failures and corrected readers remain in the packet.
This closes the allocation defect, not earned five-act viability or balance.
