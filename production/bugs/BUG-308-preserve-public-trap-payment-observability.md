# BUG-308 — Preserve public trap payment observability across kill settlement

Status: Open — constructed browser fixture cannot establish an individual MP debit.
Severity: Medium — one new public acceptance case fails; native payment checks pass.
Build: c77fd58ac5a33dc3f9341238d5fc162211e2fd3c; VITE_E2E unset production build.
Environment: Chromium1280×800/en; constructed level30 Assassin in ActI Catacombs.
Engine seed: not pinned by this public test; failure is preserved with original
trace and DOM observations, not claimed as a fixed-seed reproduction.

## Reproduction

1. Run retained trap-combat.public.spec.ts through trap-combat.special.config.ts,
   selecting the English Death Sentry and Blade Shield cases.
2. Observe Death Sentry rank1 actual Lightning/Fire, corpse consumption, HP loss,
   a visible lifetime and27MP debit. At rank20, the first observed paid pulse
   kills eight enemies and every rendered MP observation is999203/999203.
3. The exact nominal-cost assertion fails; Blade Shield does not run because
   maxFailures is one. Preserve the failed result rather than rerunning unchanged.

Expected: public proof must observe a real positive payment and repeated typed
HP loss at both ranks, with corpse/reaction mechanics. A full-pool observation
does not prove a debit merely because a cast or kill occurred.

Actual: the first rank20 cast is paid and active, but its rendered batch ends at
the mana cap. The test assumes a rendered frame always preserves cap-minus-cost.
Native payment/lifecycle regressions already prove the real debit separately.

Evidence: retained trap-red/trap-combat-public-special.json, combat-special-report.json
rank20-failed-combat-proof, screenshot, error context and trace under
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-assassin-charges-zt17emhc.
All2536repository/eight external inputs and HEAD remain exact. Wake of Fire's
separate original public probe passes both ranks and online/offline continuation.

Affected systems: qa-engineer; root sole executor.
Root cause: the fixture allows the first ranked trap pulse to kill ordinary
targets. combat.ts deathEffects applies native orbs before the rendered batch
finishes; orbs.ts restores5% of maximum MP per MP orb. With a constructed999203MP
pool, one orb can erase the27MP debit. Regeneration is also a separate net-pool
influence. Public observations do not expose which recovery event occurred in
this original batch; no individual orb receipt is inferred from them.

Required correction: use an explicitly constructed unlocked native encounter
whose monsters survive the initial ranked pulse, preserve the exact-cost and
positive repeated typed HP assertions, and record its synthetic gate markers.
Do not disable orb drops, alter combat payment, reduce the tested rank, suppress
the assertion or claim this constructed setup as earned campaign progression.

Security check: pass for local fixture/report work. Genuine campaign/save
evidence stays unchanged; no dependencies, credentials, CI or remote actions.
