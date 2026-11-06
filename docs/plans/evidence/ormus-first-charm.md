# Ormus first-charm implementation and bounded browser evidence

Date: 2026-10-29. Head: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`
plus preserved local changes, in root’s claimed `feat/playable-foundations`
worktree. [Contract](../../design/ormus-charm.md),
[ADR-014](../../decisions/ADR-014-first-charm-ownership.md),
[BUG-382](../../../production/bugs/BUG-382-ormus-charm-unreachable.md).
CI is excluded by the owner; owner playtesting follows implementation.

## Result and boundary

The advertised side quest now has an executable full Normal manual Flayer
Jungle clear → actual current-town Ormus Talk → explicit journal Claim route.
It grants one exact named Small Charm and5000hero/3750captured-fielded-mercXP
when a merc is present. One canonical hero charm slot supplies Life20/Mana10;
carried/stashed/mirrored/merc copies supply no effect. Literal24 authority is
frozen, and save25 preserves historical ownership through reviewed recovery.

This is bounded functionality. The production browser imports a constructed
level32 Necromancer with an overpowered cap and no allocated skills, then earns
all six actual native ordinary-area waves through public Enter/Skip controls.
There is no store injection or test bridge. It does not demonstrate earned
campaign balance, a viable build, sustain, active-hour pacing, offline accrual,
all viewport/accessibility/performance gates, or owner playtest acceptance.
Fixed Date aids exact round-trip comparison and limits timing claims.

## Implementation and causal checks

Protected clear uses private issued-run authority, opaque native witnesses,
bound receipts and verified accepted settlement. Invalid/replayed/replaced/
incomplete/idle/replay-difficulty runs cannot issue proof. Clear/proof settlement
rolls back together. The final focused native check passes210/5.

Protected Talk requires actual unlocked Act III town Ormus and validated clear;
publishes only Talk/completed, preserves proof and grants no income. Town keeps
its remembered field area. Action/native/Cain controls pass69/3; localized
Town+Talk passes16/2. Independent design/source review APPROVE.

Protected Claim requires the real clear/Talk graph before preparation. It
reuses the exact unique constructor and private deterministic RNG, retains
full-bag overflow, captures the merc recipient before callbacks, publishes
claimed last and verifies every participating publication. Deep scoped rollback
removes reward transfers, restores source/XP/recipient gear, preserves unrelated
journals/gear writes and recomposes the restored hero from surviving canonical
gear. Failed restoration is explicit. Corrected causal RED-v3 has10 failures;
noncharm-equip silent/throw RED2 and removed-pre-equipped-merc RED1 precede the
review repairs. The repaired Claim/generic/boundary checks pass90/3. Earlier
faulty fixture RED variants are retained diagnostics, not causal proof.
Independent final source review APPROVE.

Authored objectives/reward and both locale instructions match the actual route.
The journal renders actual Ormus objective flags even for proofless completed
legacy history; completed status does not invent Talk. Catalog/UI checks pass
71/6, with two causal legacy-flag-rendering failures before the repair.
Independent source/data/locale alignment review APPROVE.

## Production browser v6

Both headed WSL Chromium cases pass: zh-CN360×640 and en1280×800. Production
build uses `VITE_E2E=false`; `typeof window.__GAME__==='undefined'` is asserted.
The driver owns its localhost port0 server and persistent profiles.

- Actual six-wave manual clear produces clear proof and first objective;
  Talk remains false and no reward exists. Claim is unavailable.
- Actual Ormus interaction completes Talk; player state is unchanged and no
  charm is automatically granted.
- Explicit journal Claim yields one exact `items/unique/ormus-charm` on
  `items/base/small-charm`,5000 hero XP, and claimed=true.
- The116-item backpack retains the one reward in visible ordinary overflow.
  Public normal-item bulk discard makes room before equip/remove; the charm
  remains owned. No deletion/injection bypass is used.
- Equip transfers the actual reward to the canonical charm slot and changes
  maxima by Life20/Mana10; remove restores prior maxima and exactly one bag
  copy. Current resources are preserved/clamped by existing composition.
- Public Save, export and actual read-only IndexedDB data match exactly after
  the same Map→entry-array normalization used by production JSON encoding.
  Public reimport/export is exactly equal. Actual browser context close,
  relaunch and Continue reproduce the entire saved snapshot exactly.
- No page, console, HTTP errors or warnings are recorded. Document width does
  not exceed viewport width at each captured state. This is not a full G5
  nested-overflow/touch/contrast/accessibility acceptance.

All762 built-file hashes are unchanged before/after. An independent evidence
review verifies exports, native proof order, exact income/ownership, preserved
resources and all bundle hashes. Supplemental public-import visual captures
scroll the actual charm slot, detail modal and journal card into view.
Independent final evidence verdict is ADEQUATE for bounded functionality.
Settled visual-v2 frames show localized slot/card and readable +20/+10 modal;
Details/Unequip buttons measure44px. A nonblocking reward-icon fallback glyph
observation is tracked as BUG-384. Full ordinary units pass22,247/22,247 across1,057 files.

## Local checks and retained evidence

Fresh production build exit0 (15.44s), full strict typecheck exit0 (188.49s),
full zero-warning lint with8GiB heap exit0 (343.12s); engine-purity check passes
453 engine test files. The production build retains its existing chunk warning
and generated-art-manifest precache exclusion. Full ordinary units pass22,247/22,247 across1,057 files (exit0,1238.12s
wrapper duration). The older21,897/1,036 result predates Ormus. Unit-discovery
boundary checks also pass14/14; whitespace checks pass. No runtime/test source
changed after the current checks; all2011 manifest entries were reverified.

Exact root-owned retained packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-ormus-urhb34ei`.
Key evidence: `ormus-claim-repair-green.log`, `ormus-activation-green.log`,
`ormus-current-types.log.json`, `ormus-full-lint.log.json`,
`ormus-production-build.log.json`, `ormus-full-units.log.json`,
`current25-acceptance.json`, `browser-ormus-v6.mjs`,
`browser-v6/result.json`, all corresponding exported states, and
`browser-ormus-visual-v2.mjs` / `browser-visual-v2` settled screenshots.

Historical browser v1–v5 failures are harness diagnostics: nonexistent/hidden
Claim assumptions, unopened Act III accordion, reward beyond first inventory
page, auto-closed details, and Playwright serialization of raw Map values.
The v5 Map→{} mismatch is not a production save defect; v6 normalizes actual
Map values exactly like `serialize.ts`. No product fix follows these driver
errors. Readers are released. All8 disposable browser profiles and the task build are
removed; recorded final ports do not accept connections and no profile process
references remain. Exact receipts: `browser-driver-cleanup-v1.json` and
`browser-final-cleanup.json`; `ownership.json` has no disposable paths. Runtime/
test hashes are retained in `source-manifest-current25.json`. Root retains
scripts/results/manifests through
unfinished umbrella acceptance and owns eventual evidence removal.
