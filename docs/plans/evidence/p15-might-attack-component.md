# P15 — Might Attack contribution on explicit skill components

2026-11-04. BUG725 is locally resolved, uncommitted. Root owns implementation
and verification; this is not independent final acceptance. The preceding goal
turn was status-only/no progress; this turn changes production and records
behavioral evidence. Full private v1 remains active/incomplete.

## Defect and correction

The [selected Might contract](../decisions/D05-selected-might-aura-v1.md) preserves
both +1% Attack and +3% physical increased damage per rank. Basic attacks consume
both; explicit skill Attack components previously omitted the first modifier.
`buildDamageInput` now resolves the existing eligible Might projection once,
adds its Attack percentage alongside the existing Attack modifiers, and reuses
its physical increased modifier. Fixed skill bases acquire no new Attack scaling.
No source/recipient rules, stats, tuning, schema, save, profile or gear change.

An independent arithmetic example is fixed100 plus50% of Attack1000 at Might20:
`floor((100 + 1000 * 1.2 * .5) * 1.6) = 1120`, formerly960.
Attack5.8/Might1 yields106; premature Attack flooring yields105. The new
regression covers ranked/direct coefficients, all explicit damage types,
fielded mercenary versus excluded recipients, source suppression/CC,
mitigation order, deterministic complete recordings and input/stat immutability.
Existing Might cases retain fixed-base, source-death and ordinary basic controls.

## Validation

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-might-attack-component-_vrzk0bi`.

- `combat.ts.before` is the exact inherited production preimage;
  SHA256 `b60d7cca8996b25e9ff4f6334908588e97547a328d5a32e5d893c70ac9db4242`.
- `red.log` records a CLI failure before collection; it is not behavioral RED.
  `red-attempt2.log` records18failing/8passing cases. A corrected fractional
  precision oracle and warning-free native source fixture then produce the
  final genuine RED:19failing/7passing (`red-final.log`).
- `green.log`:126passing tests in seven files,9.21s Vitest duration.
  Command: `node node_modules/vitest/vitest.mjs run --project engine
  src/engine/combat/might-attack-component.test.ts src/engine/combat/might.test.ts
  src/engine/combat/attack-damage.test.ts src/engine/combat/stat-auras.test.ts
  src/engine/combat/druid-ally-auras.test.ts src/engine/combat/merc-elemental-arrows.test.ts
  src/engine/skills/zeal-attack-growth.test.ts --no-cache`.
- Scoped strict TypeScript and explicit two-file ESLint pass with empty logs;
  executed configuration is retained as `executed-tsconfig.json`.
- `browser-result.json`:seven constructed native checks in real Chromium
  147.0.7727.15,360×640,zh-CN context, using the real authored Might composer,
  registry and combat module. Adding1000Attack changes Zeal rank1/2/20 damage
  by0/384/7296; fielded Basic/Pierce Arrow by1920 each. Basic1000Attack resolves
  1920; no-aura Zeal20 delta remains3800. Complete recordings repeat exactly,
  settlement agrees, input/authoritative stats remain unchanged.
- Browser console, page errors and failed requests are empty. The terminal-only
  Browserslist age notice is retained; no dependency update is needed for this fix.
- No full suite, build, install, agent, commit, push or completed campaign replay.

Final production SHA256:
`6a89202e61b90ba9c6fc074d926a6093990c3d2c2921bf8dc4e30afec4de12d9`.
Regression SHA256 is identical in final RED and GREEN:
`452e60416d51e3de3fd4e39664a03872f7fcb50eecd69eaf6ae8d4c4b0ea1b4b`.
Command argv/exits/timings are retained in the corresponding `*-exit.json` files.
This establishes local regression coverage for BUG725, not a full-suite audit.

## Cleanup and next action

`cleanup.json` confirms owned browser PID4164144 absent, port5173 closed, exact
`vite-cache` removed and temporary `tsconfig.json` archived/absent. No cleanup
failure. Root retains the named packet, preimage, scripts and logs through
umbrella acceptance, then removes the exact packet. Claimed human2 remains in
use for the unfinished umbrella; inherited source/history/evidence are preserved.

Counts stay **14/14 Act I,13/14 intended Normal,formal0/210**. No campaign
admission, earned retry or historical allowance is renewed. Zeal's earned
checkpoint remains level49/next714; three Izual draws and the rejected owned
weapon comparison remain historical. The earlier conclusion that no production
damage defect was established predates this genuine RED. Next freeze a bounded
post-fix Zeal evaluation with explicit cost/attempt accounting; never promote
a diagnostic victory or erase spent attempts. Wider economy/pacing, higher
difficulties/endgame/app/soak and independent acceptance remain open. No user
answer, browser or CI hold exists.
