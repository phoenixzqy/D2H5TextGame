# BUG-146 — Calibrate Summoner durability at the earned Act II checkpoint

- Severity: High; native progression screen is unreliable even after legal adaptation.
- Status: Locally calibrated and verified; independent acceptance pending.
- Build: `d288eba`; Node production-store/engine projections, not browser claims.
- Browser reference: retained earned Chromium/en/360×640 Radament256 save.
- Owners: root (game/level design, content, engine regression and QA).

## Reproduction

1. Restore unchanged genuine Radament256 final, raw SHA256
   `a22721de7f38951892de573d7994ccab3d4ddfa44b62148a28a5afff426012ee`.
2. Equip only owned backpack body-slot items from the frozen defensive loadout.
   Preserve attack, attack speed and critical stats. Spend no skill point.
3. Native Arcane entry uses next ordinal257; fixed seeds1–64 are diagnostic
   projections only. Frost Nova first for trash; prepare original Ice Blast
   first for the sixth wave while the fifth recording is already frozen.
4. Run native recording, playback, settlement and resource carry. Preserve
   every failed row and assert zero XP/items on nonwins.

Expected: earned, appropriately adapted progression has a reasonably reliable
path through this non-chapter boss under the unchanged60-second deadline.

Actual: 2/32 screen and3/32 holdout clears.59/64 reach the boss; five die in
earlier caster packs.54 boss-wave failures are draws. Surviving boss damage
has median6618 versus median9791HP. Unadapted gear instead mostly dies in
caster packs; those deaths do not establish a life defect.

## Cause and evidence

The generated encounter is **level28**, not the authored25 or an inferred27.
Its old780–980 base and78–98 growth, then native3×boss scaling, produce
8658–10878HP. Calculations are internally consistent; this is an uncalibrated
content curve, not an arithmetic bug or proof that mitigation is incorrect.

Exact scripts/loadout/rows: root-owned
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-act2-progression-jbutorzz`:
`control-screen.mjs`, `before-control.json`, `defensive-loadout.json`, plus the
unadapted/Blizzard decomposition and incoming-damage trace. No simulated state
is promoted and genuine ordinal257 remains unused.

Workaround: no reliable workaround established. Defensive equipment addresses
pack survival; rank1 Blizzard alone or combined did not improve clearance.
Cold Mastery is unavailable at this L24 checkpoint. Duriel is a separate case.

See `docs/plans/decisions/D11-summoner-durability-v1.md` for the bounded candidate,
regression/measurement conditions and explicit remaining balance coverage.

## Local correction

Only life450–550/growth45–55 applied. Two production-data regressions first
fail against old values, then pass. Native fixed-group clears5→55/64 with
identical attempted non-boss prefixes; isolated81→918/1000. Focused2/2,
engine5485/165, full11285/426 plus two existing skips, typecheck/lint and
production build pass. Full suite542.25s exceeds budget. Ordinary earned browser
attempt and independent/broad-balance acceptance remain pending here.
