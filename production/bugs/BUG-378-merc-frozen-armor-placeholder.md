# BUG-378 — Mercenary Frozen Armor has no Defense or melee Chill

- Severity: High — advertised signature ability has no functional effect.
- Status: Open — native repair verified; broader acceptance pending.
- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, existing claimed worktree.
- Environment: native Vitest/Linux; browser and viewport do not apply.
- Locale: native mechanics independent of zh-CN/en presentation.
- Seed: 7; literal ranks 1 and 20.
- Owners: engine-dev / content-designer.

## Reproduction

1. Load actual `mercs/act3-iron-wolf-frozen-armor` through pool → owned factory
   → combat projection, preserving its sole `mskill-frozen-armor` loadout.
2. Use the fixed native zombie strike300, zero resistances, merc Defense20 and
   source speed100 / merc speed263 in the frozen primary fixture.
3. Run `src/stores/merc-frozen-armor-primary.test.ts`.

Expected: one paid ordinary cast at400ms, CD6 and zeroMP. Flat self Defense120
reduces the1700ms incoming hit to160; the native melee attacker receives one
canonical Chill expiring3700ms. Native archer and unknown basics remain noncontact.

Actual before repair: incoming damage280 at1700ms, no melee Chill, at both ranks. All six
primary tests fail on the intended assertions, without collection errors.

Root cause: the placeholder buff adds only a marker, uses CD0, and supplies no
paid potency or native melee-delivery consumer. Repair authored data/adapter,
paid Defense projection and actual whole-strike dispatch together. No workaround.

## Evidence

Primary SHA256 `0eeaf85deca421c54f37ed234f1995a6dc27c47588bd3300ed7b3544e0fe19cf`.
Causal RED: exit1, 6failed/0passed,9.340297s, unchanged2109-input map
`345054081f129a2374b4e22d9209cf01f4838f793187a3dc4dae444ce5bf4a5d`.
Independent producer review approves the freeze and causal failure.

Root retains required exact evidence through unfinished acceptance at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-native-delivery-njav4t8c`:
`armor-primary-freeze.json`, `armor-primary-red.log`, JSON report and
before/after/terminal receipts. Root owns eventual exact-path cleanup.
No browser, earned campaign, pacing, balance or full-v1 acceptance is claimed.

## Native repair and remaining acceptance

The authored skill is now active/self/CD6/zeroMP and grants copied flat Defense120
after one paid cast. Native whole-strike melee dispatch applies canonical Chill
once per qualifying strike, independently of basicHit. Authenticated special
bodies, fresh equipment, carried potency and factory qualification are covered;
existing player Armor behavior is preserved. No persistent save shape changes.

Focused449/16, boundary audit and external Vite/PWA build pass. Final types and
full lint pass after independently approved test-only corrections; all failures
and precise correction receipts remain retained. Audited ordinary B units pass
21631 tests across1019 files, zero failed/pending/todo, on unchanged inputs.
Independent producer review approves the completed native evidence.
Detailed bindings, retained evidence, build warnings and cleanup are recorded in
[the native checkpoint evidence](../../docs/plans/evidence/native-damage-delivery.md).

The original six-case RED and frozen primary are retained. The installed primary
adds only an explicit missing-Chill presence guard; its assertions are unchanged.
The bug stays Open for broader earned/browser/balance and full-v1 acceptance.
