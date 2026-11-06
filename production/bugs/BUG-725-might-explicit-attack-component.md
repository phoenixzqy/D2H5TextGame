# BUG-725 — Apply Might Attack to explicit skill Attack components

- Status: Locally resolved in the retained working tree; no new commit.
- Severity: Medium — selected aura undercounts damage on already Attack-scaled skills.
- Owner: root / engine-dev responsibility (user requests no new agents).
- Build: local `feat/playable-foundations`, HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`;
  inherited `src/engine/combat/combat.ts` SHA256
  `b60d7cca8996b25e9ff4f6334908588e97547a328d5a32e5d893c70ac9db4242`.
- Environment: Linux/WSL, Node/Vitest pure-engine reproduction. Browser/viewport and
  locale do not participate in this calculation. Chromium confirmation below.
- Seed: 7.

## Reproduction

1. Use a living hero with Attack1000, selected rank20 player Might (+20% Attack,
   +60% physical increased damage), zero crit/dodge/defense/resistance.
2. Resolve a physical skill with fixed100 base and an explicit50% Attack component.
3. Run `node node_modules/vitest/vitest.mjs run --project engine src/engine/combat/might-attack-component.test.ts --no-cache`.

Expected: `floor((100 + 1000 * 1.2 * .5) * 1.6) = 1120`.
Actual: 960, because the explicit Attack component omits Might's Attack bonus.
Native Zeal rank20 likewise increases only6080 instead of7296 for an additional
1000 Attack. Native fielded Basic/Pierce Arrow increases1600 instead of1920.

## Root cause and scope

`buildDamageInput` includes stat-aura and Heart of Wolverine Attack modifiers,
but omits `activeMightAura(...).attackPct` from explicit Attack-derived components.
Its physical increased modifier is already present. Basic attacks consume both.
The controlling [selected Might contract](../../docs/plans/decisions/D05-selected-might-aura-v1.md)
requires both bonuses; fixed skill bases acquire no new Attack scaling.

Fix at this shared component boundary, preserving source/recipient eligibility,
fractional Attack, mitigation order, authoritative stats and complete no-aura
recordings. No tuning, schema, save, campaign profile or weapon-policy change.
This bug does not establish a Zeal campaign victory or renew spent attempts.

## Evidence and verification

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-might-attack-component-_vrzk0bi`.
`combat.ts.before` preserves production preimage. `red-attempt2.log` and
`red-attempt2-exit.json` record genuine behavioral RED:18 failed/8 passed out of26.
Earlier `red.log` is only a deprecated CLI option failure before collection.
Regression: `src/engine/combat/might-attack-component.test.ts`.
The final improved fractional-precision regression records19 failed/7 passed in
`red-final.log`; all26cases then pass without changing those test bytes.

## Resolution — 2026-11-04

Resolve the existing eligible Might projection once at the shared damage-input
boundary and add its Attack percentage to existing explicit Attack components.
Reuse its physical increased modifier without changing eligibility or damage order.
All126tests in seven affected files pass, as do scoped strict TypeScript and
explicit lint for both changed TS paths. Native Zeal rank1/2/20, Basic/Pierce
Arrow and no-aura controls also pass in Chromium147.0.7727.15 at360×640.
Browser checks use constructed inputs, not an earned campaign; no campaign
clear or formal cell is certified. Page console/errors/failed requests are empty.
The terminal-only Browserslist age notice is retained, with no dependency change.

See [fix evidence](../../docs/plans/evidence/p15-might-attack-component.md) for
commands, hashes, retained logs and verified exact cleanup. The browser process,
port and task cache are absent; executed compiler configuration is archived.
Historical Zeal attempts and rejected weapon comparison remain unchanged.

Subsequent [earned Izual verification](../../docs/plans/evidence/p15-zeal-might-earned-izual.md)
qualifies the repair against retained ordinal713 wave5 (draw60s→victory55.4s)
and one new native ordinal714 admission (five wins/Fallen Angel Claim/49→49,
next715). Original recording-schema failure is retained and separately explained;
no diagnostic save is adopted. The new native admission counts explicitly as
attempt4, preserving three prior draws and the terminal controller. Full
custody/economy/XP/quest/save/clock/source/restoration readback passes. This
qualifies Izual only; Act IV/Normal and broader acceptance remain unfinished.

Workaround: basic attacks use both bonuses, but do not replace intended skill
behavior. Root retains required evidence through umbrella acceptance, then
removes exact owned paths; disposables/processes must be cleaned before handoff.
