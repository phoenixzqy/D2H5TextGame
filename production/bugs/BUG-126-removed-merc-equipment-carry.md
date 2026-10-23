# BUG-126 — Remove equipment bonuses when the run-bound mercenary leaves the roster

Severity: Medium (P2)
Status: Fixed locally in `2dd0865`; integrated validation passed
Owner: engine-dev / qa-engineer

## Reproduction

Base `0456f35` plus the uncommitted Exile integration; Vitest/jsdom,
locale-independent, viewport not applicable. Blood Moor run seed7,
challengeOrdinal0. A declared synthetic hero finisher isolates wave carry;
the reproduction certifies no earned progression or encounter balance.

1. Field the canonical grown Inner Sight Rogue with saved defense35 and a
   constructed level60 allowing a real Exile Monarch transfer.
2. Start the production run. The equipped initial defense is382.8.
3. Either unequip then dismiss the Rogue, or call `removeMerc` directly.
   Select a different owned mercenary with defense999 as a retargeting control.
4. Finish playback of the actual won wave and advance to the next wave.

Expected: the original run-bound mercenary keeps its identity and carried HP/MP,
clamped to bare maxima, with bare defense35 and no removed equipment bonuses.
The current recording stays unchanged and the selected replacement is not added.

Actual: the missing-owned branch retains defense382.8, maxLife237, Magic Find25
and socket/word resistances from the removed equipment. The prior recording is
unchanged, but the new wave carries bonuses without an authoritative owner.

Evidence:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-exile-grant-8gn5xy3v/exile-removed-merc-red.log`:
2 failing dismissal/removal assertions,21 passing controls, terminal exit1.
Regression: `src/stores/merc-equipment-combat.test.ts`.

Root cause: new-wave projection uses current owned equipment only while the
original roster entity exists; otherwise it reuses the previous geared carry.
Capture a separate bare baseline for the original identity at run start and
use it when ownership disappears. Never infer bare stats by dividing bonuses.

Workaround: unequip while the original mercenary remains owned until a fresh run.

## Local correction

`ActiveRun` captures a separate bare `mercToCombatUnit` snapshot for the original
run-bound identity at start. At the next wave, an existing owned original still
uses its current canonical equipment; a removed original uses the captured bare
snapshot. Only existing matching carry is projected, so no missing/dead mercenary
is revived and selecting a replacement cannot retarget the run. Carried HP/MP
clamp to the projected maxima without refilling; current recording stays exact.

`exile-removed-merc-green.log`:38 passes across merc-equipment-combat,
equipment-percent-projection and existing Might lifecycle tests. Independent
read-only residual source review: CLEAR, including baseline aliasing and absent/
dead carry. Final source/test checkpoint `a2b008c`: engine5251/148 and complete
unit10868/394 with2existing skips pass, along with typecheck/lint/production
build and12/12 scoped production browser checks. Exact logs/commands and limits:
`docs/plans/evidence/d10-exile-grant.md`. This closes the reproduced carry defect,
not earned campaign or encounter-balance acceptance.
