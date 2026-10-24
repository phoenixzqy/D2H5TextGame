# D05 — Global summon passives / BUG175

2026-10-24. Runtime `0b5e202`, display `fe636fb`, baseline `5b6d549`.
Root sole writer; local implementation and verification complete. Independent
acceptance and earned class/build balance remain open.
[Contract](../decisions/D05-global-summon-passives-v1.md).

Summon Mastery now grants +5% maximum life/+2% Attack per allocated rank;
Summon Resist grants +2 percentage points to all six engine resistances per rank.
Authored unlocks30/24 and caps20 remain unchanged. Exact aliases resolve max-once;
class/level guards and Resist's existing Golem/Clay prerequisite apply. Strict
per-ID schemas reject unrelated mechanics and invalid/missing coefficients.
Independent copied tuning and wave projections are immutable.

All three creation paths share fresh composition: prepared batches, ordinary
summons/Revive and selected-item Iron Golem. Recipients are owned skeletons,
mages, the four golems and revived minions. Local/global percentages add over
fresh rank-scaled stats, after Iron item inheritance. Local Defense/Attack Speed
remain intact. No preloaded summon retrofit/refill, hero resource change, extra
cost/CD/RNG, identity/cap/corpse policy, item debit or save-version change.
The bilingual copy and fresh summon previews use the same arithmetic, including
six resistance rows. Ordinary allocation affects the next wave; unlocked replay
retains original pools and income; Iron replay remains locked without a second debit.

## Verification

- Native reproduction: two causal RED failures on baseline; fresh Clay remained
  life233.2/Attack24/physical10/other resists0 despite both passives. GREEN:
  life244.2/Attack24.48/physical12/other resists2 at all three life fields.
- Schema: two RED tests/two passing controls; UI: four RED cases before copy fix.
- Focused seven-file run:147PASS,11.85s. Covers rank1/cap across seven summon
  templates, direct mitigation of all six damage types, additive local/global
  stats, invalid/foreign/dead/other-template controls, preloaded damaged summons,
  insufficient MP/overflow before payment, deterministic replay and native
  learning/reset/next-wave pools, Iron item ordering/one debit/locked replay.
- `npm run test:engine`:5910PASS/191files,60.69s.
- `npm test -- --reporter=dot`:11966PASS/484files, two existing skips,398.04s.
  All1173source/test/config hashes, HEAD and full working state stayed unchanged
  throughout the full run; final verification is retained.
- Typecheck, standard lint, explicit browser-file and final changed-file lint PASS.
  `VITE_E2E=false` production build PASS; all four JS chunks pass all five
  repository bridge-symbol patterns. Existing bundle/PWA-manifest warnings and
  test/performance budgets remain unresolved.
- Production browser8/8,95.79s: both passives × en/zh-CN × desktop1280×800 /
  mobile360×640. Zero retries/skips/flaky results or captured errors; ordinary
  learning/rank-up, active-option exclusion,44px allocation controls and no page
  overflow. Eight complete player/inventory/map/mercs/formation Continue pairs
  independently rechecked exact. Two representative screenshots inspected.

Earlier test-authoring errors are retained: one ordinary-Revive oracle used120
base life instead of the actual150; copied Iron assertions initially lacked their
pool helper; strict TypeScript required optional projections to be omitted and
JSON preview rows to pass the real validator. Corrected checks pass; no gameplay
assertion, timeout or required check was weakened. A schema formatting helper's
missing Python import was corrected before final validation.

## Retention and limits

[Fixtures](fixtures/global-summon-passives/) retain67byte-verified raw files in
`raw-evidence.tar.gz`,18terminal process records, source hashes and browser report.
The report embeds all24attachments (16screenshots/eight exact save pairs); their
hashes and original extraction names are in attachments.json. Only two representative
PNGs are also stored separately. Cleanup receipt records removal of task-owned
build/browser/scratch output and closure of4457. Shared caches are preserved.

The earned Ancients save remains byte-exact at decompressed SHA256
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`,
nextNormal402. No genuine campaign action occurred. Skill inventory retains213IDs,
now189unverified; these two receive bounded-functional/independent-acceptance-open
status only. C2–C4, fullG0–G7, earned builds, pacing and final QA remain incomplete.
Root self-review only; no independent review, remote publication or deployment.
