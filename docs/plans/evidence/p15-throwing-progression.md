# P15 — Ordinary throwing weapon upgrades

BUG658 is locally fixed in retained uncommitted human2 source, base
`b5a0898806bfba369a2d84a1b6c41d0bbb057fce`. Throwing previously had only the
level1 knife and one ordinary Act I source. Five new bases at levels8/22/32/50/60
follow the established one-handed sword/claw damage curve, retain zero sockets,
and have bilingual names plus existing metadata-based dagger artwork.
Seventy append-only picks across28 ordinary campaign tables provide finite,
equip-eligible access. The [decision](../decisions/P15-throwing-weapon-progression-v1.md)
declares the exact tiers, envelopes, weights, compatibility and limits.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p15-throwing-progression-v1`.
Root retains this required packet and human2 through umbrella review and owns
eventual cleanup/release. No commit, push, publication, installation or new agent.

## Focused verification

- `red.json`: missing-ladder regression fails before implementation. The same
  selected run exposes the existing stale affix count, which omitted six prior
  ranged bases; its historical contract is preserved explicitly.
- `unit-outcomes.json`:176 distinct affected assertions have final passing
  outcomes:63 new loot/content,60 existing ranged,39 affix,8 Act II eligibility,
  one exact D08+ranged+throwing preservation, and5 native equipment cases.
  Source reports are `loot-green.json`, `preservation-equipment.json` and
  `equipment-final.json`. Initial failures remain retained. Pattern-filtered
  historical127 cases were skipped, never counted as passes or replayed.
- Native equipment verifies requirement rejection, exact upgrade Attack delta,
  Throwing Mastery continuity, shield retention and inventory custody for all
  five tiers. Real seeded reward materialization covers all28 affected tables;
  each declared finite source envelope offers exactly one added eligible tier.
- `green.json`:4/4 final Chromium passes,48.929s total, no skips/retries/flakes,
  at1280×800 and360×640 in en/zh-CN. Ordinary character creation/import/equip/
  export/reload controls prove all five names/icons, a native starter baseline,
  Winged Axe +67 Attack, retained shield/currencies/map, exact item custody and
  restored stats. Browser error/warning arrays are empty; no horizontal overflow.
- Eight final picker/detail PNGs in `screenshots.json` were visually inspected.
  Mobile list and detail content scroll within the sheet; captures do not claim
  every row or stat is simultaneously visible.
- Scoped strict TypeScript and explicit affected ESLint pass. Final metadata:
  `typecheck-capture-final-command.json`, `lint-capture-final-command.json`;
  `lint-final-command.json` also covers the other five affected TS files.
  Initial command failures were setup errors: omitted existing global bridge
  declaration and repository E2E ignore rule; original logs/config retained.
- `independent-preservation.json` separately verifies all91 prior bases, all38
  table identities/old fields/entries/order/weights, and all prior locale values.
  Current production JSON equals exact retained predecessors plus only the
  declared five bases,70 picks and ten translated names. `before-source.json`,
  before bytes, final hashes and `scoped.patch` authenticate the change.

The first browser loader attempt imported the engine XP module into Node and
failed on Ajv ESM resolution. A documented level60 XP fixture replaces that
runtime import. The next run exposes the constructed fixture's stale level1
stats and mobile center clicks hitting Details. Native starter equip establishes
the baseline and a slot-edge tap selects the intended control. A passing run's
detail PNGs caught the initial transparent animation frame; final captures use
Playwright's finite-animation completion. All earlier reports, source variants
and failed traces remain retained; only this affected spec was rerun.

## Acceptance boundaries and retained state

This closes the missing content path, not earned acquisition or campaign
viability. Extra family weight changes relative loot probabilities; provisional
economy/pacing, fairness and full balance remain unaccepted. No broad suite,
campaign replay, seed search, build, save migration or engine coefficient changed.
Self-review is recorded; no independent final approval is claimed.

The earned Double Throw level49/next709 export stays byte-identical, SHA256
`7091185addcaf28a06ba9e6630fd160391bfb87935ec37aa1b9be2dcab88244c`.
BUG656 remains open: no Act IV clear/claim or Act V;29 preparation admissions
and attempts706–708 remain exhausted. Intended totals remain14 individual Act I
clears and3 five-act Normal completions; formal balance0/210. BUG592 and full
private v1 remain open. Browser works; CI excluded; no pending owner answer.

`closure.json` records terminal/absent owned processes, closed Vite servers and
verified removal of exact disposable `vite-cache`, `playwright.config.mjs` and
`tsconfig.json`. Config archives, launcher, before bytes, diagnostic reports,
source identities and screenshots remain required evidence under root ownership.
