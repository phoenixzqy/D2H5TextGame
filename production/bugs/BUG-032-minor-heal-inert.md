# BUG-032 — Connect authored Minor Heal to actual ally healing

- **Status:** Open. Authored registration corrected in `091d9b0`; runtime proof and fix pending.
- **Severity:** High; the intended mercenary healing feature has no healing effect.
- **Owner / affected systems:** engine-dev; skill registry, ranged healing, combat targeting and actual-heal events.
- **Reproduction input:** `a6f572818c1f0af8e4690eaaea1130838384310e`.
- **Environment:** Linux, Node 24.21.0, Vitest engine project. Browser, viewport and locale are not applicable to this registry/factory reproduction.
- **Seed:** No combat or RNG is used by this registration reproduction. The separate planned seed-1 runtime oracle is not executed evidence yet.
- **Controlling contract:** `docs/plans/decisions/D04-minor-heal-v1.md`.

## Reproduction

1. Load the default registry and resolve the actual ID `mskill-minor-heal`.
2. Independently load the actual `mercs/tavern-acolyte-priestess` row using `loadMercPool`, construct it through `createMercFromDef`, and resolve its unchanged signature/combo ID.
3. Inspect the authored row in `src/data/skills/mercenary.json`: active, single-ally, cooldown 4 seconds, levels 1–20, no mana cost, heal 30–50 to an ally.
4. Run the added real-registry/factory regressions before any effect/mapper/registry implementation edit:

```sh
npx vitest run --project engine src/engine/skills/registry.test.ts --reporter=dot --silent
```

At **2026-10-20 08:11:28 UTC**, exit 1: **3 failed / 48 passed**, 51 tests, **1.10 s**. The actual direct registry, actual Acolyte factory loadout and repeated-default-load assertions fail. Unrelated merc/aura controls pass. Root independently reviewed the exact test diff; producer independently reviewed the same RED and approved before source implementation.

## Expected and actual

Expected registered definition has exact production ID, `target: 'single-ally'`, cooldown 4, mana cost 0, minimum level 1, and `effects: [{ kind: 'heal', amountRange: [30, 50], target: 'ally' }]`. It has no self-buff flags or invented rank growth. Repeated default loading must restore this authored definition without adding aliases or changing unrelated mercenary/aura skills.

Actual resolution is the mercenary stub: `target: 'self'`, `isBuff: true`, and `effects: [{ kind: 'buff', id: 'minor_heal', duration: -1 }]`. The Acolyte's correct factory signature/loadout resolves this same inert buff. No healing primitive reaches combat from the actual definition.

The tests establish the registry/factory mismatch. They do not yet reproduce ranged healing, lowest-ratio targeting, capped actual heal events, cooldown/availability or browser playback. Registration alone will not satisfy those runtime requirements. Acolyte tavern data/factory availability does not establish ordinary UI or earned recruitment.

## Root cause and bounded correction

Default registration uses a placeholder for this actual authored skill. P08a03a adds a pure, exact-row, independently immutable JSON adapter and overrides only Minor Heal after mercenary stubs. P08a03b must separately reproduce and implement deterministic target/amount resolution and pure-heal availability in the existing combat pipeline. Preserve all other mercenary/aura skills, exact ID, data tuning, resources, save format and acquisition behavior.

## Workaround and evidence

There is no workaround for obtaining the intended Minor Heal effect from this registry. Use other functioning combat skills while the feature is repaired. Durable reproduction is the P08a03a block in `src/engine/skills/registry.test.ts` and the exact RED above. No disposable screenshot or log is required for this pure-engine report.

Security check: **PASS**. Trusted local deterministic skill/combat work. No credentials, external publication, dependencies, permission changes or validation bypass.


## Authored registration resolution only

Worker `ea37e9956819af41edd0763c6f7a2c7bbe68665b` was integrated as
`091d9b0`. Exact-ID registration now supplies the JSON-authored ranged heal
with independent deep freezing, no alternative ID or unrelated stub change.
This is not yet a combat-healing fix. The separate mapper suite initially failed
to collect because its module did not exist; the three registry failures above
are the actual behavior reproduction. Final focused 71, engine 631, related 733
and full 1469 tests passed; typecheck, lint, build and coverage passed. Exact
commands, timing misses and independent coverage counts are in the ledger.
Root and producer final source/evidence verdicts were APPROVE / ADEQUATE.
The worker removed verified task-owned outputs, left clean Git state and
released worktree-3. Runtime seed-1 reproduction must precede combat changes.
