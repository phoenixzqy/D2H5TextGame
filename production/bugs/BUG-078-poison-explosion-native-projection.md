# BUG-078 — Project actual Poison Explosion allocation into native waves

Status: Fixed in `4daa9c6e817651b4e043664c8b1f5dc48d07ccda`.
Severity: High — native PE cannot cast after a kill; no ordinary control restores
missing authority. Other skills work, but removing PE is not a feature workaround.

## Reproduction

- Baseline `a7deb7bd867bea4c701ac1d318e2e210204c948b`; Linux/Node24.21.0/Vitest1.6.1 UI project with
  jsdom. Browser/viewport/locale N/A for this store integration reproduction.
- Run seed7, act1 Blood Moor, manual native wave; real stores and production
  skills/monsters. Imported L18/Dagger1/PE1/points/survival gear are explicitly
  unearned scaffolding; only disk I/O is mocked.
- Command: `node_modules/.bin/vitest run --project ui src/stores/poison-explosion-native.test.ts`.

1. Set an eligible Necromancer Player with Dagger1/PE1 and priority[PE,Dagger].
2. Start a native sub-area run through startSubAreaRun and inspect its published
   deeply frozen engine input and events.
3. Confirm the real living enemies die; inspect the PE projection and casts.

Expected: independent Player-derived `poisonExplosion` authority enables supply
from an actual first kill, then PE spends15MP and one shared body at its scheduled
action. Actual: no `poisonExplosion` field and no PE action, despite actual kills.
The first RED failed locating the missing cast; the explicit projection RED then
failed `undefined` versus `[{sourceHeroId:'corpse-native-hero',rank:1}]` after the
complete real enemy-death assertion passed. Both prepatch logs are retained.

## Evidence and ownership

Root-owned raw logs/receipts/source captures:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-poison-native-sed442jn/red.log`
and `red-projection.log` with matching receipts. Root retains until umbrella
consumers finish, then removes. Regression: `src/stores/poison-explosion-native.test.ts`.
Affected owner: frontend-dev/native stores, engine-dev projection seam; QA reviews.
Root cause: stageWave only composes CE, so the new engine PE gate correctly rejects
the absent authority. Add independent PE composition with the existing current
Player/run hero ID check and snapshot spread. Generic snapshot cloning/freezing,
recording/replay, persistence and reward settlement already accept the full input;
no infrastructure or save-format change is indicated. Native replay/rewards/save
proof follows; earnedL18/browser/balance/feel remain separate.


## Resolution and validation

Compose PE from the actual current Player only when its identity matches the run
hero, adjacent to CE, and include its independent one-entry snapshot projection.
The existing generic staging path clones and deep-freezes it. No replay, reward,
status scheduler or save-format infrastructure change was necessary.

The18 native regression cases use production data/stores and only mock disk I/O.
They cover actual Dagger opening/kill/PE payment and shared consumption, exact
plain/recorded output, independent frozen PE/CE authority, unchanged current
publication on refresh, upgraded next-wave projection with real fractional carry
and empty supply, unlocked replay using captured original resources/current rank,
prerequisite removal/restoration, alias ranks, malformed/ineligible/missing slot
controls, changed Player receipt rejection, complete slain-enemy XP/loot and
exact-once retry inventory, Iron-locked replay identity/rearm, and validated
save/import with no transient corpse/projection state. Imported L18 and separate
L30 Iron fixtures are explicitly unearned.

Final focused229/6 pass5.20s (wrapper6.316s); full8128/257 pass141.16s
(wrapper142.776s); types21.909s, lint/purity52.652s, production build/bridge
scan10.333s pass. Four production chunks contain no bridge. Independent
GD/TD/code APPROVE and QA ADEQUATE reviewed the native cases. Final publication
review and cleanup follow in ledger v1cg.

Raw fixture/debug failures remain: dot events have no damageType; seed7 PE spread
on a dodging survivor caps10x1HP/s (2@7700 and13@9000); energy26 is required for
real fractional carry; wrong Player identity rejects at receipt binding; callback
braces resolve the sole final lint failure without behavioral edits. The final
bytes were revalidated after that stylistic correction. Full15s/related5s budgets
and existing Browserslist/chunk/precache warnings remain open. Localized feedback,
Skills, production browser/mobile/a11y, earnedL18, balance/feel and full D06 remain
open; store validation does not establish those acceptances.
