# BUG-508 — Apply campaign boss policy before the boss recording is staged

Status: fixed locally in the retained external driver; uncommitted.
Severity: Medium. Owner: root / qa-engineer. Affects the external campaign
continuation driver, not the game's recording or player skill-order semantics.
Environment: WSL, Node24, feat/playable-foundations;
base b5a0898806bfba369a2d84a1b6c41d0bbb057fce. Browser/viewport/locale: not
applicable to deterministic store/engine execution.
Run seed: 1630370445; ordinal881; boss index4.

Reproduction:
1. From the root packet's earned Throw35/next881/35actions source, run
   p15-barbarian-izual-policy-continuation-v4.ts through the owned launcher.
2. Allow Plains W1–W4 to settle. Settling W4 stages the W5 recording immediately.
3. The driver's index4 branch calls setComboOrder([barbarian.double_throw])
   after W5 has been staged, then plays the original recording.
4. Read W5's initialPlayerTeam: the hero still has Howl, Double Throw,
   Double Swing and Bash. Its result is a60s draw,395.89HP/119MP remaining.

Expected: the selected primary-only rotation is in the actual boss recording.
Actual: the declared policy differs from the immutable recorded input. The
five-wave predictor passes with primary-only; the actual run uses the old order.
The four ordinary-wave resources match the forecast exactly, isolating the
difference to boss configuration timing. No Izual clear or proof was earned.

Root cause: the driver schedules a next-wave configuration change after the
previous wave's advanceWaveOrFinish has already simulated that next wave.
src/stores/playerStore.ts:setComboOrder updates player configuration, while
src/stores/combatHelpers.ts:stageWave captures it for a new recording.
An installed recording remains immutable unless the explicit replay path is used.

Correction: set boss configuration while the penultimate recording is still
installed, before its settlement stages the boss. Preserve the penultimate
recording and its actual outcome. Assert the actual boss opening skillOrder
matches the selected order before playback. Do not change recording semantics,
replay a settled wave or grant rewards. Retain the failed881 attempt's earned
successor35/93521XP/next882/35actions; only forecast/admit882 next.

Evidence packet:
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1
- p15-barbarian-next-plains-policy-v1.json: passing five-wave forecast.
- p15-barbarian-double-throw-izual-continuation-v1.json and its.raw.jsonl.gz:
  actual old order, partial rewards, native economy/quest audits and successor.
- p15-barbarian-izual-policy-continuation-v4.ts: preserved executed driver.

Security check: pass. Local owned verification scheduling and assertions only;
no credentials, CI, permissions, infrastructure, external messages or deployment.
No game-source change is required. Verification uses the next earned ordinal;
earlier acts, completed campaigns and the settled881 encounter must not replay.

Validation: p15-barbarian-izual-policy-continuation-v5.ts configures the next
wave before the penultimate settlement, then asserts the actual installed boss
skillOrder before playback. Native882 preserves all ordinary-wave timings and
resources from its forecast and records primary-only for Izual; the actual boss
victory exactly matches173.89HP/44MP/44187.569ms. This proves scheduling works.
Scoped strict types/lint passed before execution. The later refused quest claim
is separately tracked as BUG509, not a policy-timing failure. No engine replay
semantics, previously settled waves or earned rewards were changed.
