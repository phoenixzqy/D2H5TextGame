# BUG-457 — Diagnose endgame UI wave completion in the bilingual native test

Status: root cause identified and fixture repaired locally; focused verification passed.
Severity: local acceptance failure caused by a constructed test fixture.
Affected systems: CombatScreen functional test fixture; runtime unchanged.
Environment: WSL, Node24.21.0, Vitest/React18 fake timers, current privatev1 source.

Run `src/features/combat/CombatScreen.endgame.test.tsx`. Its constructed native
dungeon fixture drains four waves and expects the victory panel in both locales.
The zh-CN case reports no `victory-panel`; en and the other11 cases pass.
It fails in both the full ordinary suite and a focused file run, so broader
file pollution alone does not explain it. No balance or earned evidence is
claimed for this constructed fixture.

Evidence: task packet `d2-counted-source-z3jj3xa1`, `bug456-full-unit-v1.log`
and `bug456-endgame-ui-isolation-v1.log`/exit. Focused run12/13passes; exit1,
all owned processes terminated. Full run timed out1200s with642passingfiles,
11378announced passing tests plus this failed file; no full-green claim.

Next: inspect actual per-wave playback/outcomes/timer advancement, distinguish
fixture combat failure from missed UI scheduling, and retain the failing test.
No production tuning, CI, installs, agents, commits, pushes, PRs or deployments.

Root cause: `createMockPlayer` uses a clock-derived hero ID, which changes
the native endgame seed. The oversized finisher retains ordinary hit chance.
Missed enemies can kill this otherwise ordinary challenger while the finisher
is on cooldown or slowed by Chill. There is no demonstrated locale/scheduler
defect. Native fixed-ID screen finds28/32wins; IDs6/7/24/30fail in waves2/4.
Thorns-type substitution has the same failures; vitality500 still fails one
ID, so neither workaround is used in the final test.

Fixed-ID bilingual RED:4failures/11passes, exactly real fixture defeats on
IDs6/7 in both locales. Final test uses the existing damage-effect
`alwaysHits:true` capability on the synthetic finisher and retains all four
known failing IDs in both locales. Its hero stats, real native recordings,
cooldowns, wave progression, rewards and retry/refusal assertions remain.
Diagnostic output removed. No production source or game-data change.

Causal64trial screen: unchanged control28/32, always-hit fixture32/32.
Final focused test plus act-context regression:26tests/2filesPASS14.164s
(19endgame+7context). Scope lint/type verification recorded in the execution
ledger when terminal. Full ordinary suite timeout/failure history retained;
focused success is not a complete-suite pass.

Final message formatting correction uses explicit `String(wave+1)` for the
repository's typed lint rule. Final endgame19testsPASS15.831s, scopedlint
PASS9.086s and unchanged-source strictTSCV2PASS140.580s. Earlier lint error
and TSCV1PASS137.734s retained separately. Rehashed2070prior source inputs:
only this test changed; runtime/JSON unchanged. No remaining fixture failure
observed. Full ordinary acceptance remains open after its earlier timeout.
