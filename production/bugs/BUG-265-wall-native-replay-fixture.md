# BUG-265 — Exercise the actual locked-replay publication policy

- Severity: Low; author native-test setup, no reproduced replay regression.
- Status: Corrected in `5591aa6b`; ordinary and actual locked replay paths verified.
- Owner: root; independent acceptance remains open.
- Environment: Vitest jsdom, synthetic level30Necromancer, seed7/ordinal0;
  locale and browser viewport are not applicable.
- Base: 4ab9d984 plus native Wall projection/test increment.

## Reproduction and cause

The first `bone-defenses-native-green` run passes6tests and fails1 at line80.
The draft advances playback, allocates Wall1->2, explicitly requests replay,
then incorrectly expects the current cursor and recording to remain unchanged.
Playback progress does not lock an ordinary wave. The existing explicit replay
API intentionally resets the cursor and recomputes current configuration.
Only the published `ironGolemReplayLocked` policy reuses the exact original input
and recording. Ordinary allocation without explicit replay remains frozen until
the next accepted wave. See combatHelpers.ts's refresh API and stageWave policy.

## Correction boundary and evidence

Retain the original test and complete120660byte failure log in the active bone
task. In the ordinary carry case, verify allocation alone preserves recording,
then next-wave fresh learned authority and finite carried power. Keep repeated
unlocked replay checks at the next wave. Add a distinct fixture with legally
configured Iron Golem and its prerequisites to exercise actual locked replay;
expect the original baseline recording and cursor reset to zero. Do not change
replay policy, timing, protection, resources, fixtures' earned status or assertions
to pretend ordinary playback progress creates a lock. All fixtures are synthetic;
no genuine campaign or sacrifice is performed. No skill credit follows this fix.

## Integrated validation at bdc747b8

Full18359tests/845files/two existing opt-in skips, engine9382/352, strict types, lint, official build/bridge and756URLprecache pass. Regression: src/stores/bone-defenses-native.test.ts. Original failures are preserved; details and immutable receipts are in docs/plans/evidence/d06-bone-defenses-core.md and its integrated packet. No new inventory credit or independent/earned/full-v1 acceptance.
