# BUG-153 — Preserve affixes above item level99

Severity: High. Status: corrected locally; independent acceptance pending.
Owner: root/content/loot QA. Runtime7441227 plus BUG152 equipment-band data;
unchanged item roller and affix data. Node24.21.0/Vite SSR, no browser interaction;
locale/viewport not applicable. Seed3286157777.

1. Load actual `loadAwardPools()` and call production `rollItem` with base
   `items/base/armor-archon-plate`, rarity magic or rare, ilvl99,100,102.
2. Use a fresh `createRng(3286157777)` for each isolated boundary call.
3. Inspect the materialized item and actual prefix/suffix eligibility.

Expected: supported Nightmare item levels100–102 can materialize the authored
magic/rare bonuses. Existing highest affix tiers should remain usable across
the supported item-level envelope, with finite reviewed bounds.
Actual: magic/rare99 produces2/6 affixes; both rarities at100 and102 produce0.
All prefix/suffix highest `ilvlMax` values are99, so the real item roller has
no eligible affixes. The actual Nightmare Throne/chapter plan reaches102.
BUG152 exposes legal base drops there; it does not fix this separate tier pool.

Evidence: `high-level-affix-audit.mjs` and `.json` in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-static-field-27sv3iop`.
These are isolated production materialization diagnostics, not earned items.
Root retains them through full-v1 consumers and removes them afterward.
Affected files: `src/data/items/affixes-prefix.json`,
`src/data/items/affixes-suffix.json`, `src/engine/loot/rollItem.ts`.
Do not cap/rewrite ilvl, inject fallback affixes, change affix values/weights
or alter previously earned item payloads to conceal the gap.

Security check: pass. Local authored data and deterministic regression tests;
no dependencies, credentials, networking, permissions, CI or publication.

Correction: [finite D08 contract](../../docs/plans/decisions/D08-nightmare-affix-envelope-v1.md)
extends exactly16 highest-tier maxima99→102. Production roller/crafting code,
all authored values/weights and existing items are unchanged. The new30-test
regression has25 causal failures before the correction and passes afterward,
including all75 affixable bases and actual caster-recipe costs/identity/replay.
The complete14850-call item stream at1–99 remains identical for the fixed seed.
[Validation evidence](../../docs/plans/evidence/d08-nightmare-affix-envelope.md)
records passing focused/engine/types/lint/build and full11502/439files with
2existing skips, exit0,420.78s. Full G4/economy acceptance remains open.
