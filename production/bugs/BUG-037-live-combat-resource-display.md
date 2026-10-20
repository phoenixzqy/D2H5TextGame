# BUG-037 — Show live hero mana and use true combat resource maxima

- **Status:** Fixed; bounded UI source/unit/production display evidence accepted.
- **Severity:** High; combat hides live MP and can display incorrect HP ratios.
- **Owner / systems:** frontend integrator; `CombatScreen.tsx` and its tests.
- **Build:** `00cee90`, accepted engine/absolute mana transport `dd236eb`.
- **Environment:** Linux / Node24.21.0 / Vitest React DOM UI fixture; zh-CN/en.
  No actual browser/viewport result yet; desktop/mobile production proof remains.
- **Seed:** Not applicable; UI-only synthetic paused store teams, no simulation.
- **Contract:** D05 observable mana, producer-approved two-file UI prerequisite.

## Reproduction

1. Render the actual CombatScreen with paused active-combat teams, hero after
   a merc and summon, current HP64/max128 but cached stats.life120; use an
   enemy with current HP50/max200 but cached stats.life50.
2. Give the hero runtime MP53/max106 and cached stats.mana0. Set final outcome
   MP1 and persistent player metadata MP102 so they cannot substitute for the
   actual playback team's resource.
3. In each locale inspect the actual compact hero/enemy HP bars and readable
   hero MP group. After rendering, update playback-team MP to0 and61 without
   changing the outcome or persistent source; verify display follows the team.
4. Run `npx vitest run src/features/combat/CombatScreen.test.tsx
   --reporter=json --outputFile=/tmp/d2h5-root-warmth-ui-red.json`.

## Expected and actual

HP64/128 displays50%; enemy50/200 displays25%. Actual bars show53.33% and100%
because compact rendering divides by cached stats.life. The GameCard fallback
also constructs HP/MP bars using stats.life/mana rather than lifeMax/manaMax.

A full-width localized hero MP label/numeric/bar above the battlefield grid
must show53/106 at50%, follow actual team changes including0, and use the actual
hero even after merc/summon entries. No hero or nonpositive MP capacity omits
this resource strip while retaining cards. It must not use final-snap MP1,
persistent MP102 or cached stats.mana0. No resource mutation is authorized by
this display change.

Every current battlefield UnitCard uses sm+compact, which has HP only. The md
MP branch is unreachable here and CharacterHud is hidden on /combat; therefore
there is no visible live combat MP. Numeric MP inside narrow three-column unit
cards would be hard to read at360px; producer approved a full-width strip above
the main battlefield grid using existing StatBar and combat:mp translations.

## Evidence and root cause

Tests-only RED at09:21:05UTC: **2failed/10passed/12total**, zero pending, exit1
(wall5.457s). Both locale cases expose wrong hero/enemy HP percentages and the
missing localized MP group. Six original terminal-copy controls and four new
absence/capacity controls pass. Assertions after the missing-group lookup are
present for GREEN; they were not independently executed past that failure.
Raw root-owned evidence `/tmp/d2h5-root-warmth-ui-red.json`, matching `.log` and
`-typecheck.log`, retained through independent review.

UI source unchanged SHA256
`e8e554a431053de948b8f3756831a23fb4a8dff7a171e8e94bba91edaf9b46bf`;
new test SHA256
`f0c047acdb1a8e77e4f031a28d9dddbf55a3bb27312189bd2db780eb977e40a3`.
Initial tests-only typecheck failed with two TS4104 diagnostics: readonly
fixture arrays were assigned to mutable store team fields. Corrected only
those assignments to shallow array copies. Corrected RED remains
**2failed/10passed/12total**, zero pending, exit1; typecheck now exits0.
Corrected raw evidence uses `/tmp/d2h5-root-warmth-ui-red-corrected.json`,
matching `.log` and `-typecheck.log`; corrected test SHA256
`e29bf025ce8aa6c1f4c0766a0d388db45345f9f49fa0f549b04ea7b643c11c0f`.
Producer and QA independently **APPROVE / ADEQUATE** for corrected tests-only
RED. No UI source was changed before those verdicts.

Minimal root fix: use lifeMax/manaMax for existing bar maxima and MP capacity;
select actual player-side hero by inferKind; display runtime mana through the
existing localized StatBar inside a named full-width group. No engine, rewards,
carry, shared StatBar, persistence or layout-system changes. No per-event live
region noise. Unit/DOM proof does not certify360px layout or Warmth mechanics.

Security check: **PASS**. Local read-only resource presentation, no network,
credentials, permissions, dependency or validation-bypass changes.

## Bounded fix and validation

The two-file source/test change adds the existing StatBar inside a named
localized MP group above the battlefield grid, selects the actual player-side
inferred hero and uses its runtime mana/manaMax, including MP0. Existing
compact HP and fallback GameCard bars use true lifeMax/manaMax. No resource,
engine, persistence or shared StatBar mutation.

Frozen corrected tests unchanged through GREEN: **12passed/12total**, zero
failed/pending. The live53→0→61 assertions now execute, independently of final
outcomeMP1/persistentMP102. Precise selection boundary: merc/summon precede the
hero in store input; existing orderAlliesWithSummons sorts before Battlefield.
Explicit source lookup and no-hero control support selection correctness.

All checks exit0: focused12; related12/1file8.09s; full1667/125files28.11s;
`npm run typecheck`, `npm run lint`, `npm run build`9.27s; `git diff --check`.
Related/full exceed the configured5/15s budgets. Existing Browserslist,
chunk-size and large generated-manifest precache warnings remain.
Raw evidence `/tmp/d2h5-root-warmth-ui-green.json`, matching `.log`, and
`/tmp/d2h5-root-warmth-ui-{related,full,typecheck,lint,build}.log` consumed by
producer and QA, each **APPROVE / ADEQUATE** for bounded source/unit behavior.
Source SHA256
`78f783c0e4884a847e5eff6833dca594ffa3a4785d774db3a753d635d9b0c84f`;
test SHA256 remains `e29bf025ce8aa6c1f4c0766a0d388db45345f9f49fa0f549b04ea7b643c11c0f`.

## Production display evidence

Actual Vite production build, Chromium headless, fixed Date only at
2026-10-20T12:00:00.055Z and native timers. Ordinary fresh Sorceress → allocate
Fire Bolt1 → choose it as sole active skill → Enter → Pause/Resume shows
MP102→94/max102 before terminal state. Actual named progressbar reports94/102;
`__GAME__` absent; zero captured console warnings/errors and page errors.
No game-state injection, import, debug bridge or forced clicks.

**14/14** geometry checks pass: en/zh-CN ×320×640,360×640,412×915,640×360,
768×1024,1280×800,1920×1080. Strip is fully within horizontal bounds,12px above
the grid, with no document horizontal overflow. Width300px at360 and1116px at
1280. Root, QA and producer visually inspected both locales'360/1280 screenshots;
localized MP labels,94/102 and blue bar are readable. Independent browser
verdicts each **APPROVE / ADEQUATE** for this bounded display proof.

Environment diagnostic: host has no Chinese fonts (`fc-list :lang=zh` empty),
so initial screenshots showed missing glyphs despite correct DOM. Final proof
uses task-local NotoSansCJKsc-Regular.otf from
https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf
(SHA256 `2c76254f6fc379fddfce0a7e84fb5385bb135d3e399294f6eeb6680d0365b74b`),
FONTCONFIG_FILE and XDG_CACHE_HOME. First font attempt failed before launch
because XDG_CACHE_HOME changed the browser lookup; explicit existing
PLAYWRIGHT_BROWSERS_PATH corrected it, without installing/replacing browsers.
Final harness exits0 and reports its owned server stopped.

Scratch evidence was under `/tmp/d2h5-root-warmth-ui-browser`: exact harness,
results, initial/final logs/screenshots, failed-launch log, font and local
caches. Both reviewers consumed all required evidence. Root removes these,
the explicitly listed UI raw files and recreated build/test cache after review,
and records verified cleanup in the ledger.

No continuous recovery, Warmth browser, next-wave, save/reopen or campaign
acceptance follows from this bounded fix; full-screen accessibility, existing
narrow combat-card usability and icon appearance remain unaccepted.
