# BUG787 — Correct stale Doll regression fixtures

- Severity: Medium — two focused regression checks give false failures.
- Status: Corrected and locally verified; uncommitted.
- Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus inherited changes.
- Environment: WSL/Linux, Node/Vitest; no browser rendering involved. Both locales unaffected.
- Seed: 7.
- Affected systems: qa-engineer; root owns this solo correction.

## Reproduction

1. Run only the City Damned W6 and converted-poisoned-victim cases in `src/engine/combat/monster-death-explosion.test.ts`.
2. Repeat those two cases with the packet's Vite load override supplying exact pre-Fire-Enchanted production sources, leaving repository sources untouched.

Expected: assertions reflect the current authored treasure roster, and the poison/corpse ordering fixture actually converts its intended surviving victim before the two original bursts.

Actual: both sources fail identically. W6 is an authored one-monster treasure encounter, deliberately exempt from ordinary challenge roster fitting, whereas the test expects thirteen Dolls. The ordering fixture's intended victim has 2HP while neighboring Dolls have 1HP; native player targeting selects the lowest-life neighbor, kills it at500ms and never converts the intended victim.

## Root cause and correction

Stale test assumptions after prior treasure-roster/targeting changes, not a BUG786 gameplay regression. Assert the exact one L53 rare Doll and native482Attack. Keep the death-closure/poison-spread/corpse-order assertions intact; give the two sibling death sources3HP and3HP/s Ignite to preserve their1000ms deaths while leaving the2HP intended victim first in the lowest-life targeting order. No production targeting, RNG, map, damage or affix rule change.

Evidence: `baseline-doll.json`, `baseline-doll.log`, `baseline-overrides.json`, original `green-doll-regressions.json` in `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-fire-enchanted-kyss8yrx`. The load override's first run lacked the repository @ alias and collected no tests; `initial-baseline-*` retains that failure. Corrected baseline executed exactly the two failing cases. Exact source preimages and hashes are retained. No full-suite or campaign rerun.

Workaround: none needed in gameplay. Full private-v1 acceptance remains open.

## Verification

Both corrected fixtures pass in `final-corrected.json` (68 selected cases
passed,23 unselected). Strict scoped types import931 files with zero diagnostics;
the corrected test file lints clean. The exact pre-Fire baseline still documents
the original two failures. Historical thirteen-Doll evidence remains historical;
current authored W6 has one L53 rare treasure Doll. No production rule change.
