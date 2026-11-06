# BUG-514 — Preserve enemy summoners' paid cooldown after minion death

Status: local uncommitted fix; scoped regression and native validation passed. Severity: High. Owner: root / engine.
Environment: WSL, Node24.21; pure engine (viewport/locale not applicable).
Base HEAD: b5a0898806bfba369a2d84a1b6c41d0bbb057fce, current dirty source.

## Reproduction and evidence

1. Restore the earned Double Throw level35/next888 export in
   `p15-barbarian-double-throw-chaos-continuation-v1.json`.
2. Run the restored-store `balanced-armor-life` comparison in
   `p15-barbarian-next-bloody-policy-v7.spec.json`, with the exact native
   wave seed retained in its output. Reach Bloody Foothills W5 with Leap Attack.
3. Inspect `monster.summon_adds` action clocks for each Warped Shaman.

The recorded owner `enemy-act5.warped-shaman-1-1d24` casts at0 and3480ms;
`enemy-act5.warped-shaman-3-d14c` casts at8700 and12180ms. Authored cooldown
is5000ms. Minions die between these casts. Raw input, seed and events are
retained in root's packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p15-barbarian-next-bloody-policy-v7.json`.

Expected: hostile summon replacement respects its paid cooldown and receives
no player summon mana refund. Actual: generic summon death effects refund
the owner's summon cost and delete its cooldown regardless of owner side.
The existing player replacement workaround has leaked into enemy mechanics.

## Bounded correction and verification plan

Restrict that existing death refund/reset to player-owned summons. Preserve
player replacement controls, enemy cap2, summon stats, all authored costs and
cooldowns, summon-first targeting, drops and RNG rules. Prove the native
enemy replacement cadence with actual minion deaths; retain existing player
refund/replacement tests and enemy caster controls. Then forecast the saved
unfinished area under the corrected source before any native admission.
No success, campaign completion or pacing claim follows from the unit fix.

Root review: ready; the side check belongs at the refund/reset origin.
Security check: pass; local deterministic engine change, no dependencies,
network, permissions, save format, grants or audit bypass. Independent review
and earned balance acceptance remain open. No workaround is published.

## Completed local verification

Implemented: refund/reset now requires both dead summon and owner to be
player-side. bug514-red-v1 reproduces a3740ms interval against5000ms;
bug514-green-v1 retains39passes and exposes two stale fixture assertions,
corrected separately by BUG515 (three parameterized controls pass).
Scoped bug514/515 types/lint pass. Current source bindings are retained;
Bloody888 native clears all six waves after the subsequent BUG517 correction,
with exact forecast agreement. No claim that this fix alone clears the area.
Independent review and remaining earned matrix/balance acceptance stay open.
