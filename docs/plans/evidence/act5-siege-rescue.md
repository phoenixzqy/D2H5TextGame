# Act V: constructed Siege and Rescue browser delivery

2026-10-23. Runtime revision `69828f682684ce5fd737bdff801619a57bdadb29`;
local branch `feat/playable-foundations`. This proves the first two main
quest flows with constructed combat power. Fresh earned campaign, complete
Act V and C2 acceptance remain open.

## Proven behavior

Both locales import the untouched actual v16 Act IV browser export through
Settings and compare player, inventory, map, mercenaries and formation with
the production decoder's migration. Independent QA also compared original
fields directly: all 441 backpack items retain their historical fields;
412 backpack/equipped items receive explicit capacity defaults. The player
equipment mirror is repaired from actual equipped inventory. Currencies,
quest items and existing map state remain unchanged; no Act V proof or
entitlement is invented.

The initial test reaches an actual draw before Shenk because its empty combo
cannot clear summoning Warped Shamans in time. That failed run is preserved
in [BUG-108](../../../production/bugs/BUG-108-act5-functional-browser-preparation.md).
The revised fixture adds only the attested Crit Chance, Crit Damage and Mana
modifiers to its existing synthetic cap, recomposes through production code,
and selects already-learned Frost Nova through Skills. This is explicitly
artificial combat preparation. It grants no quest proof or quest reward.

Ordinary UI starts all five main quests. Cages remain disabled before Frigid
Highlands is cleared. Actual Shenk victory supplies the source receipt;
separate Siege Claim grants 10000 hero / 7500 mercenary XP and one available
socket service. Actual Frigid victory enables three distinct cage controls,
used by keyboard in order 3,1,2. Freeing them grants no player/mercenary XP.
Separate Rescue Claim grants 8000 hero / 6000 mercenary XP, one extra skill
point and +5 to each of the six resistance channels. Level-up point changes
are accounted for separately, while backpack, stash, equipment and currencies
remain exact across these claims.

Save→close→new-page Continue preserves exact player, inventory, map,
mercenaries and formation, including both claimed flags, all three cage
receipts, the resistance bonus and available socket charge. There is no
browser debug bridge, captured console/page error or horizontal overflow.
The inspected essential controls are at least 44×44 CSS pixels.

## Validation and provenance

| Check | Result |
| --- | --- |
| Production Chromium, 360×640, en and zh-CN | 2/2 PASS; 168.295s; retry/skipped/unexpected/flaky 0; global errors `[]` |
| Final full typecheck | PASS |
| Explicit scoped lint with `--no-ignore --max-warnings=0` | PASS; repository default lint excludes `tests/**/*.ts` |
| Independent QA source and report review | ADEQUATE for this bounded slice |
| Integrated runtime baseline | 10068 unit tests / 351 files PASS; engine subset 4692 / 129; full lint/typecheck/build PASS |

The build was produced at `70fb0ac`; the following `69828f6` changes only unit
fixtures. Production code is identical. Existing build warnings and exceeded
test-time budgets remain unresolved.

Exact browser command, from the claimed worktree:

```sh
ACT5_DELIVERY_DIST=/tmp/d2h5-a5-integration-650ka_is/dist \
ACT5_DELIVERY_OUTPUT=/tmp/d2h5-a5-integration-650ka_is/browser-prepared \
ACT5_INPUT_SAVE=/tmp/d2h5-a5-integration-650ka_is/act4-completed-constructed-input.json \
PWA_PORT=4361 npx playwright test --config tests/pwa/act5-delivery.config.ts --project=mobile-small
```

SHA256 identifiers:

- Original actual Act IV export: `08d2531df6df82f1c305b02136515b5bd8e97d368af14f9cd6e8b962f076eb79`.
- Separately prepared variant: `f2c74dfcf15f48d2a86e74fbd44e12205c8a022d3dc376cf71b73153ff33cbce`.
- Frozen spec: `acdfbdb3d17619c73fd31778d6c763b3f62d109cf1df6f955a9c2a1a93edfbc1`.
- Frozen config: `113759960a8cb15067205830e076e26b5444f46edc08d3d17bf226895ff939b2`.
- Passing `browser-prepared/report.json`: `4430add6f44482fff7b77ef33f848ada53d7daad449f3adf19d1458837625640`.
- Original failed `browser-prefix/report.json`: `f8d5b340bff47fa31645bc9ed19edb935b12e4a9738adcd2e30749613fbf4e49`.

## Limits and ownership

This does not prove Prison, Rite, Eve, service consumption, titles, Nightmare,
five-viewport coverage, all skills/classes, earned balance or the 30–50-hour
campaign target. C0/C1 retain their historical bounded acceptance; C2 remains
underway and C3/C4 remain open. No deployment or remote operation occurred.

Root retains the exact original/revised test inputs, both browser reports,
inline attachments, original failure traces and validation logs under
`/tmp/d2h5-a5-integration-650ka_is`. Reports are required review evidence;
root owns removal after Act V/umbrella consumers finish and compact evidence
is preserved. Oracle caches and transient Playwright directories were removed
by their owners. The two extracted screenshot copies were removed after
inspection; originals remain inline. The task-owned `dist/` remains for the
next Act V browser slice and will be removed after its final consumer. Preview
4361 terminated normally with Playwright. Shared caches are preserved.
