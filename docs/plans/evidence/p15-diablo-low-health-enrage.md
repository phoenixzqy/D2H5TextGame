# P15 — Diablo low-health enrage, local verification

2026-11-05; root, solo. BUG753. Build b5a0898806bfba369a2d84a1b6c41d0bbb057fce
plus inherited local changes. No commit/merge, independent or owner sign-off.

Native manual/idle Chaos Sanctuary, seed13/ordinal450, now activates sticky
enrage at15%HP. Data authors speed2/+50% direct damage; chapter44800Life,
420Attack/460Defense/AS140 and reward source stay exact. Effective AS280 reaches
the existing400ms floor, with native first actions400/800/1200/1600ms. Ordinary
above-threshold actions remain1380/2760/4140/5520ms. Faster Charge lands during
Fire Breath's Burn and retains the existing x1.25 physical combo.

Verification:18new cases across `engine/combat/diablo-enrage.test.ts` and
`stores/combatHelpers.diablo-enrage.test.ts`;3selected Blood Raven cases and
4selected native self-buff/reflection cases.25distinct cases pass. Checks cover
threshold/dead/ordinary negatives, additive typed damage before mitigation,
non-default/omitted tuning, missed hits, captured Burn/old periodic potency,
pending phase, sticky healing/Chill, closed schema, immutable inputs and
recorded/plain deterministic parity. Strict scoped TypeScript603implementation/
data files has zero diagnostics; six changed TS files lint clean.

A temporary native-boss browser harness feeds the real recorded event through
the shared converter and actual CombatLog component. Chromium shows the literal
en/zh-CN notification at360x640 without overflow, and zh-CN at1280x800. No page
errors, console warnings/errors or failed requests. Screenshot inspected. This
is component/native diagnostic evidence, not a complete player combat flow,
earned campaign, formal balance acceptance or production PWA verification.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-diablo-enrage-mnlvsoxq`.
Retains original native RED, intermediate fixture/harness failures and corrections,
final logs, source baselines/review, browser result/screenshots and cleanup record.
Initial cadence oracle omitted the400ms cap; initial Charge oracle omitted the
existing Burn combo. Only test expectations changed. Temporary diagnostic JSON
caused browser overflow, with Vite's inline proxy caching the first attempted
style fix; wrapping its output fixed the harness without product changes.

Root retains this exact evidence directory through full-v1 acceptance, then
removes it. Temporary server/browser processes are closed and task-local Vite
cache removed; see packet cleanup record. No exhausted campaign/sample/retry
budget renewed. Historical14/14Normal completions/210checkpoint sources and
formal0/210balance acceptance are unchanged. Stun resistance, Duriel/Baal gaps,
pacing/economy/build/difficulty and integrated/owner acceptance remain open.
