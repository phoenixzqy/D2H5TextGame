# BUG-780 — Register Blood Lord and Frozen Terror artwork

- Status: Fixed locally, uncommitted — current source and evidence recorded below
- Severity: Medium — readable fallback exists, but two reachable identities lack art
- Owners: frontend-dev / art-director (existing asset registration and source review)
- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited working changes
- Environment: WSL, Chromium 147, en at 360×640; earlier en/zh-CN mobile/desktop evidence agrees
- Seed: 780 for two constructed native monster units; no encounter admission or battle

## Reproduction

1. Construct champion `monsters/act5.blood-lord` and `monsters/act5.frozen-terror`
   through `buildEnemiesForWave` with the authored definitions.
2. Display them on the actual paused `CombatScreen` with canonical native IDs.
3. Inspect the cards, image resolution and console.

Expected: Both identities have their own registered, loadable monster art;
localized names and immunity indicators remain readable.

Actual: Both canonical helpers return `null`, neither card contains an image,
and the console reports missing `act5.blood-lord` / `act5.frozen-terror` keys.
The readable initials fallback works. This also prevented the preceding champion
immunity browser run from meeting its clean-console gate.

## Cause and proposed repair

Neither identity has a generated asset or curated override. Register two
attributed static official bestiary images via the existing override data.
Blizzard's Blood Lord page identifies Blood Lord; its Frozen Horror page
explicitly lists Frozen Terror among that family's variants. Keep unknown-ID
fallbacks and all resolver/gameplay semantics. No AI generation is needed.

## Evidence

`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-act5-art-ps4qdjjb/`:
`before-browser-result.json`, `before-combat-en-360.png`, `sources.json`,
downloaded source GIFs and deterministic first-frame conversion record.
The baseline passes its reproduction assertions: two null resolutions, no
monster images and four missing-key warnings, with no browser/network errors.

Earlier related evidence: [champion immunity](../../docs/plans/evidence/p15-act5-champion-immunity.md).

## Workaround

Localized names and initials identify the monsters until assets are registered.

## Resolution

Two attributed, static official bestiary PNGs now resolve through the existing
canonical override data; no resolver or gameplay code changed. Both sprites are
256×256, together 54,263 bytes. The formerly absent Blood Lord IDs in the
fallback test are replaced with actual absent identities, preserving all five
negative cases and the otherwise-absent canonical override control.

Nine affected helper/override unit cases pass; explicit changed-test lint and
strict override JSON schema validation pass. Four actual paused `CombatScreen`
cases (en/zh-CN ×360×640/1280×800) verify both native IDs, decoded local images,
localized nonempty alt text, visible images/immunity lists and no horizontal
overflow, with zero browser warnings/errors or failed/bad network requests.
Root visually inspected the source PNGs and final mobile/desktop screenshots.
The original BUG775 browser result remains `passed:false`; this is separate,
new artwork verification and does not rerun its closed combat diagnostics.

Evidence: [artwork closeout](../../docs/plans/evidence/p16-act5-champion-artwork.md),
`after-browser-result.json`, screenshots, `unit-result.json`, `asset-audit.json`
and source hashes in the packet above. Root self-review only; no independent
or whole-game acceptance, production offline reload, pacing or balance claim.
