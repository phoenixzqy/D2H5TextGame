# P17 — Chapter-boss first-kill rewards

2026-11-04. Implements drop-tables §5 first-kill rewards under
[D09](../decisions/D09-chapter-boss-first-kills-v1.md) and BUG680, on
`b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus preserved local changes.
Constructed loot and native settlement evidence; no earned campaign, economy,
pacing or formal balance credit.

Each boss grants its bonus once per difficulty per save. Existing area-clear
ledgers consume eligibility, including historical clears; no migration or
retroactive award. Andariel grants a random unique; Duriel has exactly 5% Stone
of Jordan, otherwise a random unique excluding that template; Mephisto grants
unique armor/weapon; Diablo has exactly 3% Grandfather, otherwise an Elite-base
unique excluding that template; Baal grants a unique plus a Mal–Zod rune on
Hell only. Baal's unique also applies on Normal/Nightmare. The explicit Elite
allowlist follows items-spec §3. Named qlvl27/57 permits current Normal boss
drops while preserving equip requirements29/81 and actual ilvl.

The engine appends this reward after ordinary equipment, material bundles,
rarity guarantees and optional uniques. Exact preceding rewards remain intact;
future RNG advances intentionally. Impossible selected bonuses refuse the whole
bag without a rare fallback. Closed authored schema, source/template reference
checks and browser schema precompilation cover the new policy.

Only accepted native ordinary-area terminal victory with the surviving original
hero, original recorded matching boss and frozen difficulty can supply eligibility.
Find Item, direct public helpers, aborted/defeated/repeated settlements and
quest/endgame encounters cannot claim the bonus. Existing publication rollback
retains eligibility on failure. Clear ledger and inventory share the save snapshot.

## Verification

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p17-boss-first-kills-v1`.
Counts overlap and must not be summed.

| Check | Result / retained evidence |
| --- | --- |
| Engine reproduction |17/17 failed before implementation, then17/17 passed; `original-failure.log`, `initial-green.log` |
| Native reproduction |5 failed/1 passed before connection, then6/6 passed; `native-original-failure.log`, `native-initial-green.log` |
| Reference validation |30 passed/1 failed before missing validator was implemented; `reference-red.log` |
| Affected loot |247/247 across12files,6.52s; `affected-loot.log` |
| Final selected checks |89/89 across5files,9.06s; `final-selected.log` |
| Final new engine cases |31: five bosses×three difficulties, exact named branches/chance edges/exclusion, weights, Elite/type restrictions, rune endpoints, references, refusal, isolation, preceding rewards and following entropy |
| Final new native cases |11: first/repeat/duplicate, actual snapshot→decode→hydrate roundtrip, frozen Nightmare/Hell, rollback, abort, real defeat, Hell Baal rune, direct helper isolation, historical clears and whole-bag refusal before XP/inventory |
| Scoped strict types |Pass; `types-final.log` |
| Explicit no-ignore lint |Nine TS files pass; `lint.log`; initial four corrected test findings retained in `lint-initial.log` |
| Production build |Pass with VITE_E2E cleared; `production-build.log` |
| Actual offline precache |Required app chunks and PNG icons present; `precache.log` |
| Production bridge scan |Ten emitted JS chunks pass all five existing patterns; `bridge-scan.json` |

Local review reproduced an authority defect before fixing it: a direct helper
caller could pass the private boss identity as an excess runtime options field
and receive an extra Shadowfang at seed7. BUG680 records the finding and
`native-authority-red.log` retains its failing test. The identity now travels as
a separate private argument that the public helper never supplies. The final
regression compares complete rewards with and without injected public options.

No material local finding remains within this slice. This is not independent
umbrella approval. Existing chunk-size and optional art-manifest precache warnings
remain; the build does not establish performance or physical-device acceptance.

## Integrity and cleanup

All12 source/test/data hashes match `build-input-sha256.json` and
`source-sha256.json`. All766 emitted files matched `production-sha256.json`
before cleanup. Exact disposable `production/` and `types.config.json` were
removed and verified absent in `cleanup.json`. All processes are terminal; no
server started. Root retains the required packet and claimed human2 checkout
through umbrella review and owns eventual packet cleanup/worktree release.

BUG680 is resolved locally for its specified equipment guarantees, boss material
and ordinary/jewelry counts, optional uniques and first-kill rewards. Full P17
and private v1 remain incomplete.14/14ActI,3/14five-act Normal, formal0/210
remain unchanged. No full suite, campaign replay, new agent, install, commit,
push, publication or training-budget renewal.
