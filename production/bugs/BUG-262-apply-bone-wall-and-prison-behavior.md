# BUG-262 — Apply actual Bone Wall defense and Bone Prison control

- Severity: High — two advertised active skills pay without their promised effect.
- Status: Reproduced at `d703e60e`; implementation pending.
- Owner: root acting as engine/content/QA owner; no delegation.
- Environment: native stores and pure TS engine under Vitest/jsdom, Linux/Node.
  No browser viewport or locale applies. Engine seed7, ordinary production data.
  Explicit synthetic level24, prerequisite allocations and diagnostic pools.

## Reproduction

1. Create a Necromancer with Bone Armor1, Bone Wall1 and Bone Prison1; slot
   only the skill under test. Start actual Blood Moor through native stores,
   seed7/ordinal0, and advance recorded playback through its first actual cast.
2. Capture the actual paid hero/enemy state and rebase its status clocks.
3. Hold the hero to prevent future actions; use an identical controlled living
   attacker in both branches. Compare Wall's actual paid marker against only
   that marker removed. Require an actual positive incoming HP loss control.
4. Compare Prison's actual paid enemy status against only that status removed;
   the living enemy has a real scheduled action inside the trapped interval.

Expected: Wall changes actual incoming HP loss; Prison changes actual permitted
enemy actions while trapped. Paid feedback alone cannot establish either.

Actual: both meaningful assertions fail,2failed/0passed, exit1/7.924s.
Wall and marker-removed control both end99975/100000HP. Prison and its control
both permit one enemy action. The native production cast/marker assertions and
positive damage/action controls pass before each decisive failure.

## Cause and evidence

JSON declares Wall as self `bone-wall` and Prison as all-enemy `bone-prison`.
The generic adapter maps Wall to an indefinite buff ID with no defensive
consumer. Prison becomes a fallback one-second status; neither scheduling nor
damage/avoidance reads it. No player-specific implementation exists. The
similarly named monster skill is a separate stub and does not implement these
player skills.

Root retains exact external `native-repro.test.ts`/workspace, both complete
branch recordings and command receipt/log under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-bone-defenses-6z98386v`.
Original log SHA256:
`19621557e9e4565369fd390b134c209a022ec9e2d98e88f03cbc3bf12361d228`.

Define bounded non-spatial Wall/Prison contracts before changing runtime.
Preserve unlocks, prerequisite chain, rank/cost/CD scaling, native authority,
determinism, save version and genuine campaign. Any newly authored duration or
capacity must be identified as provisional tuning, not an existing balance
approval. Root owns retention/read-back and exact task cleanup after consumers
finish; independent/earned balance acceptance remains open.
