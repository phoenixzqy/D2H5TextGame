# BUG786 — Add the missing Fire Enchanted affix

- Severity: High — the advertised affix cannot be rolled or execute its mechanic.
- Status: Locally implemented and verified; uncommitted.
- Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus inherited local changes.
- Environment: WSL/Linux native engine; browser/viewport not required for reproduction. Both locales affected. Browser verification will use Chromium at 360×640 and 1280×800.
- Seed: 7.
- Affected systems: content-designer, engine-dev, writer; root owns this solo increment.

## Reproduction

1. Inspect the live `src/data/elite/elite-config.json` pool.
2. Find `elite-affix/fire-enchanted`, promised by monster-spec §9.
3. Construct a native carrier through `buildEnemiesForWave` and settle its death.

Expected: a distinct rollable Fire Enchanted affix adds 50 fire resistance percentage points (existing cap 75), then explodes once on hostile death for 50 base fire AOE damage against living opponents. Extra Fire Damage remains its separate Fire Ball affix.

Actual: Fire Enchanted is absent. The legacy AI descriptor is unused by native wave construction. The only fire-labelled live entry is Extra Fire Damage; it grants Fire Ball and no death explosion. The existing native death explosion is specific to Stygian Dolls.

## Evidence and root cause

`docs/design/monster-spec.md §9`, live elite JSON, `src/engine/ai/policy.ts`, `src/engine/skills/monster-death-explosion.ts`. Causal regression: `src/stores/combatHelpers.fire-enchanted.test.ts`.

Retained packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-fire-enchanted-kyss8yrx`; includes original preimages and frozen security/plan review. Initial RED result read was attempted while handle 42947 was still live and returned FileNotFoundError; the same handle is retained and will be polled to terminal before inspecting its report. No restart or production change on that observation failure.

No gameplay workaround. No pending user question; owner playtest follows implementation. Full-v1 and balance acceptance remain open.

## Resolution

Distinct authored affix and frozen on-death skill now use native resistance
construction and the shared private death transaction, retaining independent
Doll payloads. [Evidence](../../docs/plans/evidence/p15-fire-enchanted.md):88
initial affected cases and68 final selected cases pass; scoped strict types,
lint and four bilingual mobile/desktop CombatLog fixtures pass. The115-case
latest executed union excludes unselected tests and keeps duplicate parameter
occurrences distinct. See BUG787 for two independently reproduced stale Doll
fixtures. Initial failures remain preserved. Root self-review only; no commit
or independent/full-v1 acceptance claim.
