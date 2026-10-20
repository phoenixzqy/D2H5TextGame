# BUG-048 — Admit Act I chapter-boss equipment at its actual level

Status: Fixed in `5b13f4f`; independent producer/QA APPROVE / ADEQUATE.
Severity: High — all equipment rows unavailable in the manual chapter-boss path.
Owner: content-designer; independent producer/design/QA review.

## Reproduction

Input6ec6206, Linux/Vitest Node+jsdom, locale-independent. Browser/viewport N/A:
structural data/store reproduction, no claim of earned combat victory. Seed1.

1. Resolve real `a1-catacombs`, then its manual challenge plan, ordinal0.
2. Build the chapter-boss wave: area12 + difficulty bonus2 + chapter bonus5 =19.
3. Read its `loot/act1-boss` table through the production loader.
4. All seven equipment rows have maxLevel14; strict actual-level filtering
   excludes every one at19. Only direct non-equipment rewards remain eligible.

Expected: authored Act I boss equipment remains eligible at actual boss level19.
Actual: zero eligible equipment rows, regardless of seed/MF. Rune max18 also
excludes runes, explicitly deferred to D10/P12b rather than silently expanded.
Evidence: maps/sub-areas/act1.json Catacombs, combat/sub-area-run.ts chapter
level, loot/treasure-classes.json Act I table, loot/drop-roller.ts strict bands.
Original whole TC SHA227b40353263e7adcc9048c11bbebda578d987eb1cf32b6872391745e8be0f30.
Workaround: other loot sources; no workaround within this boss equipment table.

## Reviewed correction and proof

Producer/QA exact plan READY and design D08-CONTRACT APPROVE before edits.
Only seven equipment maxLevel14→19; preserve minima9/10/12, weights, rarity,
all direct rows, rune cap18, pick/noDrop rules and every other table. Existing
drop-table schema accepts integer maxima; no schema/save change. Root owns
treasure-classes.json and combatHelpers.act1-boss-loot.test.ts, narrow docs.
Security check: pass. Local authored loot eligibility, no credentials, external
instructions, network, permissions, export implementation or validation changes.

Freeze tests before data edit, obtain independent genuine RED review. Boundaries
equipment8=0/9=4/10=5/12,14,19=7/20=0; direct rows remain eligible8/20.
Real manual plan→built boss→explicit synthetic slain boundary→production
awardLootForVictory(seed1)→complete generated items in inventory and exported
save. Source-only seed reconstruction selects helm/gold/amulet/kite/kite;
four equipment instances are rare, ilvl19, distinct IDs, baseRolls and affixes.
This is structural consumer proof, not earned victory, guaranteed gear,
unique materialization, reload persistence or economy/balance acceptance.

Frozen GREEN then schema/data/loot/planner/consumer regressions, engine/full
unit/type/lint/guarded build. No build overlaps fingerprint tests. No new browser
recipe needed for this bounded source correction. Independent final diff/evidence
audit before exact cleanup and commit; closing ledger separately. Broader D08,
D10, Andariel quest identity, all earned bosses, C0–C4/G0–G7 remain open.
RAW=/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-act1-boss-loot-vhq5v4id;
root owns exact cleanup after producer/QA retention release.


## Frozen RED

TestSHA7f4d9d2073bb2e51c4f5ec85655e0b45cd9af3807dd32d5ef76f7dcd5aaab6f7;
original TC remains227b4035. Ten tests: two genuine failures (level19 zero gear
rows versus7; real award empty versus source-derived fourbases), eight controls
pass,0pending, exit1/4.096s. No setup/import failure. Controls establish actual
boss L19/table, equipment minima/boundaries below19/above19, unchanged rune cap
and eligible direct rewards outside gear band. Test and original TC frozen in
RAW; independent producer/QA review requested before any data edit.


Independent QA approved pre-data oracle amendment: bases.json amu-brass has no
baseDamage/baseDefense, rollItem.ts rollBaseStats correctly returns{}. Assert
exact empty baseRolls for amulet and positive defense for helm/kites; retain
nonempty affixes, complete item equality and every other assertion. Original
frozen test/RED preserved, not rewritten. Rerun amended frozen RED before data
edit; no runtime/data changes yet.

Producer and design independently corroborated the same source-backed assertion
amendment. Amended frozen test SHA38b49fea972ca4caae77408d26334b0c53d6032d5faf69b0af6e32c27e324dc5;
amended RED report1babe35e94c180f71fe3de87378d2e3de392cea10d9764e442902d5785209c75,
10tests=2same genuinefail/8controls/0pending, exit1/4.108s; original evidence
unchanged. Await final amendedRED approval; data still original227b4035.


Producer and QA independently APPROVE amended frozenRED before data edit.
Changed only seven Act I item maxima14→19; exact JSON-path diff retained.
Original and amended test attempts remain immutable. Frozen GREEN follows.


## Validation packet

Frozen amended test38b49fea unchanged; exact seven-field data correction final
TC SHAab10000aaa7810b75c1de66bf36c430a4f91e96fb8cc9b22910c1c9d8e62346e.
Frozen GREEN10/1/0pending4.195s, focused schema/data/loot/planner/consumer336/11
5.494s, engine1011/52/0pending7.081s; fullunit2465/143/0pending36.272s.
TypeScript13.112s and full lint39.800s/purity52 pass. Guarded native production
build passed after unit/fingerprint consumers finished, no overlap. Existing
test budgets exceeded, unchanged thresholds. No redundant coverage/browser for
this scoped data fix; no engine/runtime/schema/save changes.

Versioned bug048-outcome.json retains all nine exact command argv/exit/wall/log
hashes, six report hashes/counts, original/amendedRED and GREEN assertions,
source hashes, exact seven JSON paths and limitations. Original frozen test is
also versioned as bug048-original-frozen-test.ts.txt; no evidence rewritten.
Node24.21.0/npm11.19.0, Linux. Existing build warnings (old Browserslist, large
chunks, generated manifest excluded from precache) remain unchanged.
Independent final source/evidence audit and retention release precede exact
RAW/dist/.vite cleanup and commit. Broader C/G gates remain open.


## Independent acceptance and cleanup

Producer and QA independently APPROVE / ADEQUATE with no findings. Exact
recursive comparison proves all38tables unchanged except seven Act I maxima;
allnine command/log records, sixreports and preserved original/amended/GREEN
assertions verified. Frozen source and real inventory/export checks accepted
only for this bounded D08 structural fix. Both released RAW retention.
Exact owned RAW above, worktree dist and node_modules/.vite removed with
portable APIs and absence verified. No test/server process remains. Original
checkout read-only/clean; root claim continues. Next candidate P04a05 qualified
Andariel objective contract retained outside repo at
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-andariel-objective-vxzoooqx;
root owns eventual removal after its consumers release. No next runtime edit
before reviewed contract and genuine RED. Full v1/C/G remain open.
