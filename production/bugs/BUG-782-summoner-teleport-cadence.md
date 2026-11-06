# BUG-782 — Give the Summoner an opportunity to cast Teleport

- Status: Fixed locally; focused verification complete, root self-review only.
- Severity: Medium — an authored defensive move never occurs in the native bar.
- Owner: root, engine/content responsibility, solo.
- Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus inherited local changes.
- Environment: WSL/Linux, Node/Vitest engine project. Browser/viewport/locale:
  not applicable to engine reproduction; browser integration follows below.
- Seed: factory7, battle13; native level28 boss Summoner.

## Reproduction

1. Build `monsters/act2.the-summoner` using the production factory and full bar.
2. Record combat against a constructed100,000Life passive tank with no dodge.
3. Inspect the Summoner's ordinary action events and paid status windows.

Expected: Fire Ball, Frost Nova and Lightning coexist with real finite Teleport
windows. Summon Adds remains governed by its separate startup/preparation path.

Actual: the first three attacks always offer a ready choice before Teleport;
no Teleport action/window exists. The old native-bar regression explicitly
accepted zero Teleport casts, although isolated Teleport mechanics work.

## Evidence and cause

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-summoner-cadence-l42tj9uu`.
`red-corrected-result.json`: two causal failures (missing native Teleport and
missing local cooldown metadata). Initial `red-result.json` also retains an
incorrect fixture-period assumption, corrected before touching production data.

The ordered bar has cooldowns3/3/2s at a1620ms action period. Higher priorities
cover all ordinary turns. This is authored cadence, not a broken Teleport resolver
or combat scheduler. There is no ordinary-player control to change the enemy bar.

## Intended correction

[Decision](../../docs/plans/decisions/P15-summoner-teleport-cadence-v1.md): use the
existing per-monster override field for Fire Ball6s and Frost Nova6s. Preserve
shared spells, skill order and Summoner defenses. Replace the stale zero-cast
oracle with real paid-window expectations. Historical earned results remain
historical; this does not establish current balance/pacing acceptance.

## Resolution and verification

The two local overrides expose Teleport at6480ms for1000ms without replacing
any advertised move. Two causal REDs become GREEN;18distinct affected cases
pass across native cadence, existing Summoner/cooldown and focused Teleport
controls. Scoped strict types (718 imported files), two-file lint and strict
schema for all38ActII definitions pass. Initial test typing/filter mistakes
are preserved rather than counted as passing controls.

Four Chromium en/zh mobile/desktop constructed native-recording projections
verify the actual paid chip, localized log and expiry on CombatScreen with no
browser/network issues. Initial generic-ID/placement/screenshot fixture issues
are preserved and corrected; no production identity behavior was patched.
See [complete evidence](../../docs/plans/evidence/p15-summoner-teleport-cadence.md).
Task processes/port/caches are absent; root retains the named packet for later
QA/review. Independent/full-v1 acceptance remains open.
