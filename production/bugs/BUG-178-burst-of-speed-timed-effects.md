# BUG-178 — Apply and expire paid Burst of Speed effects

Severity: High. Status: reproduced; implementation in progress.
Owner: root (engine/frontend/content). Baseline `f2de6a0`.
Environment: Vitest Node, no browser/viewport/locale required for engine repro.
Seed: 7. Evidence: retained `red-native.log` and `red-native.test.ts` in task
scratch recorded by the eventual D05 evidence report.

1. Give an eligible level-30 Assassin Burst of Speed 20 and place it in priority.
2. Provide exactly 9 MP and run against a permanently stunned durable enemy.
3. Inspect actual action times, status observations and later recast behavior.

Expected: the paid cast increases attack cadence and physical dodge, expires at
a finite authored duration, then can recast after expiry/cooldown with enough MP.
Actual: first follow-up remains at 3400ms rather than 3080ms; no timed status or
expiry is observed; even an ample-MP source casts only once. All three causal
native tests fail. Existing descriptions also promise unsupported movement speed.

Root cause: the generic buff consumer stores only a permanent activeBuffIds marker;
its duration/statMods are not consumed by combat. Burst has no paid runtime payload,
no cadence/dodge consumer and no expiry-based recast path. No workaround exists
for missing effects. Resolve this without interpreting unrelated buffs' incomplete
metadata or changing earned campaign state.

During self-review, a real-engine playback reproduction also proves that the
ordinary buff event leaves a permanent marker and duplicate onset display even
when the new engine status expires. Finite buff events now explicitly declare
status-owned presentation; the playback consumer retains the FX but delegates
visible lifetime to complete status observations. This transient event field
changes no persisted save format. Both original failures are retained.
