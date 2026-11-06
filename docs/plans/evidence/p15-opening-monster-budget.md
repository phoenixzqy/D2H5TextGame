# P15 — Opening monster attack correction

2026-10-30, HEADb5a0898 + uncommitted private-v1 work, retained human worktree2; root sole writer. [Contract](../decisions/P15-opening-monster-budget-v1.md), [BUG427](../../../production/bugs/BUG-427-opening-blood-moor-budget.md), [original screen](p15-current-payloads-intro.md).

Only three production Attack arrays change: Fallen32→20, QuillRat27.2→17, Zombie28.8→18. All growth, armor/HP/MR/resistance/speed/skills/rewards/starting-state/8–20 count rules stay exact. Existing literal factory, ordinary attack, summoned Zombie and Panic-family oracles adopt those deliberate new values. The role inventory mirrors them; acceptance remains unaccepted. No engine formula or starter power change.

## Verification

Packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`, prefix `p15-opening-budget-*`.

- Native regression RED:9 intended first-wave failures/5 passes across14 real creation/profile cases,18.416s. GREEN:14passes,15.934s; no assertion removed/weakened.
- Final consumers-v2:539passes/eightfiles,26.267s, including strict292loader cases, planner/factory, attack/compatibility, physical/Panic and inventory integrity.
- Strict incremental types:PASS198.344s. Scoped lint-v2:PASS14.390s, explicitly includes the campaign regression with --no-ignore.
- Production build:PASS20.027s,759precache entries. Existing chunk-size and2.57MB art-manifest precache warnings remain; this is not blanket performance/PWA acceptance.763actual output files hashed in build-manifest-v1 before cleanup.
- Public production Chromium-v2:PASS12.847s, zh-CN360×640/en1280×800. Fresh isolated contexts, public creation/free hire/first battle/Skip/Flee/Export; no bridge/store injection or debug power. Both exports arev32/L2/60currentXP/twoitems/oneordinal/native Rogue fielded; BloodMoor remains uncleared. UI Skip accelerates playback only. Clock fixed to the predeclared native Date1793304000000. Empty page/console/HTTP error channels and no horizontal overflow. Two screenshots retained; zh360 visually inspected. This is first-wave earned proof, not a full map win or observed human pacing.

All wrapper receipts exit0 for final runs, no timeout/live descendants. Earlier consumer-v1 remains245PASS/2FAIL: summoned Zombie still expected78 instead of new68, and the synchronized role inventory retained old bases. Both corrected without weakening assertions; full eightfile v2 rerun passes. V1 also named a nonexistent loader path, so only v2 includes all intended loader checks. Lint-v1 failed only because campaign tests are normally ignored; v2 explicitly checks them. Browser-v1 had an English-only wave-counter regex incompatible with Chinese "第2波/共3波"; v2 checks the actual localized counter numbers. Failed artifacts remain retained.

## Actual fresh 14-profile result

Original full-intro screen216.543s, candidate221.243s. Exactly one fresh process/case, unchanged native runSeed2601641432/ordinal0, actual starter/free Rogue/one legal point; preserve every nonwin. First-wave wins increase5→14. All14 still lose W2. Each first win grants160XP and actually reachesL2; no map clear is claimed.

| Profile | Before W1 | After W1 victory ms | After W1 hero HP | After W2 |
| --- | --- | ---: | ---: | --- |
| sorceress-cold | defeat | 15240 | 97 | defeat |
| sorceress-fire | defeat | 15240 | 97 | defeat |
| amazon-bow | victory | 9000 | 119 | defeat |
| amazon-javelin | defeat | 10668 | 100 | defeat |
| assassin-martial | defeat | 10668 | 121 | defeat |
| assassin-traps | victory | 6096 | 127 | defeat |
| necromancer-summon | defeat | 15240 | 124 | defeat |
| necromancer-bone | defeat | 9144 | 94 | defeat |
| barbarian-double-swing | defeat | 16764 | 96 | defeat |
| barbarian-double-throw | defeat | 16764 | 96 | defeat |
| paladin-zeal | victory | 10780 | 114 | defeat |
| paladin-holy-bolt | victory | 10780 | 114 | defeat |
| druid-fire | victory | 2874 | 140 | defeat |
| druid-summon | defeat | 18288 | 87 | defeat |

`intro-compare-v1.json` audits all14stable before/after source/campaign manifests, byte-identical fresh state/hire/admission/first player teams, matching8body roster/HP/defense/etc; only each first enemy's Attack scalar/range changes.28compressed journal hashes retained. Source manifest delta is exactly production act1 monster JSON, three reauthored oracle files and explicit campaign test discovery configuration. Separate campaign manifest adds the first-success regression. Exact JSON comparison against before-act1-v1 confirms only3Attack arrays and no other fields changed; all other monster rows are preserved.

## Earned Act I follow-through

`act1-v1`, cold profile, one fresh route/no recovery or favorable retry, technicalPASS22.073s. Existing route wins40BloodMoor first waves, earnsL6, equips only earned drops, then wins DenW1/W2 and loses DenW3 at2236ms.43played waves/42wins,895193.415ms raw combat (about14.92min),11750earnedXP/174items across the route; none are injected. This is raw logical combat, not observed player time or30–50-hour pacing.

Failure starts with hero49/180HP,143MP,Defense61 and Rogue27/196HP. Eleven L7 enemies include DarkOne rare leader Attack124, minion81 and Fallen65 minions/50trash. A DarkOne physical16 and affix Arcane38 finish the hero; it is not OOM. W2carry and the forced elite sequence remain unresolved. The single route does not establish all-class affordability or any full first-act clear. BUG427 stays open for broader opening progression; first-success portion is fixed locally.

## Exploratory study limits and cleanup

Study-v2:14fixed first-wave teams ×32 diagnostic seeds ×5numeric arms=2240fights. Native146/448wins; armor-only179/448; Attack20,Attack16,andAttack20+armor4 each448/448. This motivated retaining armor and choosing the smaller sufficient Attack correction. It is not a holdout or statistical balance acceptance. Replays-v3 corrects object-key-order hashing and verifies13original native recordings/results exactly; Necromancer-summon lacks its separate Mastery snapshot projection in this standalone study. Its complete native reruns above are authoritative. Study-v1 failed on the wrong CombatResult property name, with no production workaround. No arm was silently discarded.

Owned study caches absent. Disposable production bundle deleted only after both browser contexts/server and all consumers finished; exact manifest and cleanup-v1 retained, no cleanup failure. Evidence packet/source copies/recipes/logs/reports/journals/screenshots/public exports and the existing type cache deliberately remain for the active umbrella acceptance; root owns eventual cleanup. Worktree claim remains active. No commit/push/PR/dependency install/deploy; CI remains locally deleted by owner request. Current-source full-suite, later signatures/scaling, earned five-act/14-build/pacing/defeat-retry acceptance remain open; owner playtest follows implementation.
