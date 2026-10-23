# P03b06 — Equipment picker instance identity

BUG090 fixed: the already-equipped gate now compares persistent item IDs. The
previous base/rarity/affix-count comparison incorrectly disabled distinct rolled
upgrades. Distinct equal-roll items also remain legal swaps. Ownership, capacity,
eligibility, derived statistics and save contracts continue through existing
store actions. The [approved contract](../decisions/D02-D07-earned-equipment-preparation-v1.md)
also defines the subsequent single equipment-prepared route.

Frozen RED:3failures/11passing controls. Regressions cover normal Attack5→9,
one-affix roll1→5, actual derived Attack+4 and exact transferred IDs; equal-roll
different-ID swapping; and same-ID stale-projection refusal. Focused35tests/2files
pass. A fixture guard replaces lint-invalid non-null assertions without changing
assertions. Producer independently APPROVE/security pass; final QA ADEQUATE.

Final `npm test -- --maxWorkers=4 --minWorkers=1`:8546tests/273files pass in187.78s.
All756frozen source/test/config hashes unchanged. `npm run typecheck` and
`npm run lint` pass, including104engine-test purity checks. Production build with
VITE_E2E unset passes; all4emitted JS chunks pass the repository's five bridge
patterns. Unit timing exceeds the15sbudget; existing build/precache warnings and
BUG089's separate node-project type error remain unaccepted.

Production Chromium:4passed,0skipped/unexpected/flaky/retries/pageerrors;
en/zh-CN ×360×640/1280×800. Ordinary creation→Import→exact initial Export→equipment
slot keyboard activation→select earned boots→compare→Equip→Save→page close→Continue
proves DEF69→70, exact candidate/returned IDs, unchanged other player/domain data
and complete reopened export equality. No state/storage/debug-bridge mutation.
The fixture is the original earned L12 save, SHA
`8c46c4f4026116360356a2d17dcde3d723310969a25664f85bc291a1886d2afc`.
This is imported-checkpoint integration, not fresh acquisition or C1 acceptance.

Comparison69→70 is proven by DOM assertions and actual exported statistics.
Screenshots show candidate selection and enabled Equip; the shared scroll area
leaves comparison outside the captured viewport. No visual comparison acceptance
is claimed. The first browser attempt clicked nested Details instead of the slot;
its failure is retained. The accepted test activates the actual slot with Enter.

Exact native config, frozen inputs, RED/final logs, browser reports/screenshots,
build scan and [summary/hashes](fixtures/p03b06-earned-preparation.summary.json)
are retained at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-equip-instance-3lpy4n6g`.
Root owns retention through progression/C1 and cleanup after dependent readers
finish. See that root's cleanup receipt for removed disposable paths.

## One prepared route

[Exact executed script](fixtures/p03b06-earned-preparation.route.mjs) restores only
the original unique L12 save. Once-only deterministic equipment preparation uses
ordinary stores and current-item/ID tie rules, hero before Rogue. The complete
prepared input and chosen IDs were frozen in `prepared-input.json` before combat.
Hero Defense120; Rogue Attack43/Defense77. Clock1792497600000, seed2223645302,
ordinals102–106; Frost Nova2/Ice Blast8 and Inner Sight→Pierce→Basic unchanged.
No farming, tuning, allocations, seed search, resource commands or retries.

| Area | Combat ms | Earned XP | Result |
| --- | ---: | ---: | --- |
| Blood Moor |28812|1460|Victory,3waves|
| Cold Plains |57048|3100|Victory,4waves|
| Burial Grounds |112296|3130|Victory,4waves|
| Dark Wood |127008|6600|Victory,5waves|
| Catacombs |158192|7070|Defeat,W5of6; stop|

Compared with the preceding approved route, preparation advances past Catacombs
W4, then loses to14Dark Stalkers in W5 at31400ms. Andariel is not reached. Hero
enters that wave96/262HP and184/188MP; Rogue125/252HP. Hero dies with full mana,
Rogue survives52HP and13enemies remain. This identifies the observed stop, not a
proven formula defect or authorization for outcome-driven tuning.

Initial full-save equality, preparation item-ID conservation, production entry
resources, between-wave hero resource carry and unchanged source hashes pass.
All173new item awards reconcile3737→3910unique items; final wave grants no rewards.
Final diagnostic save SHA
`393ea39af07b0381345bebdf775e3a83a802bad563ad2592dd7d52b78d888811`.
No failed-export continuation, earned boss, fresh UI campaign, C1 or balance gate
is accepted. Next diagnose this retained elite encounter before choosing a fix.
