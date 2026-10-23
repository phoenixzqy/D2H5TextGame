# Duriel credit and explicit quest reward cache

2026-10-23. Data/UI `5d5f0d0`, runtime/tests `afdd39a`.
[Contract](../decisions/D11-duriel-quest-rewards-v1.md).
This completes D11 H3 integration, not an earned Duriel victory or Act II/C2.
Historical C0/C1 acceptance remains narrow; C2–C4 and full G0–G7 remain open.
Local only; no push, pull request or deployment.

Seven Tombs now matches the actual canonical Duriel/Tal Rasha encounter.
The existing ordered, qualified recorded-wave settlement requires the opening
before a new victory; no banking or later backfill. Combat retains its ordinary
boss table, XP and independent currency income. Claim separately pays12000 hero
XP,9000 fielded-merc XP, and five deterministic quest-table picks once.

The closed authored profile fixes table/ilvl/picks. Selection uses replacement,
noDrop0 and MF0, without live gear, player level, navigation or clock. The private
seed binds player ID, quest ID and the profile. Existing forced-rarity/aggregate
rune/gold-to-shards semantics remain; no exact socketable rune or guaranteed
equipment identity is promised. Only table currencies normalize to actual
inventory destinations. Direct numeric quest currencies retain their behavior.

Whole-bag validation precedes generation; private preparation refuses incomplete
bags. Combined safe destination totals precede publication. All prepared items
survive backpack overflow. Shared locking, participating rollback, explicit
restoration failure and claimed-last settlement remain. No save format change,
crash atomicity or observer-wide atomicity is claimed.

## Validation

- Full unit: **9102 tests /303 files PASS**,187.50s,exit0.
- Final engine: **4357 /112 PASS**,30.09s,exit0.
- Initial engine:4356/112 before the extra canonical planner regression.
- Claim/adjacent:168/4 PASS; final new Claim file19/19 PASS.
- Recorded quest settlement:55/55 PASS, including six new constructed Duriel cases.
- Data/UI:377 focused/adjacent PASS; final37/37 PASS.
- Final typecheck, full lint plus changed-test lint, clean production build and
  four-chunk debug-bridge scan PASS. `git diff --check` passes.
- Production browser: **2/2 PASS**,en/zh-CN,69.281s,retry0,skip0,flaky0,
  unexpected0,errors[],pageErrors[]. No production test bridge.
- Frozen639 source/config files,760 build files,4 harness/oracle files and1
  earned input match after browser verification:drift[],added[]. All635 files
  under `src/` are included in that source count.

Causal tests: data/UI seven expected failures plus30 controls; new engine API
23 failing cases before implementation; ordinary output and following-RNG
snapshots captured before extraction remain unchanged. Claim initially had
eight expected failures/eight controls before support. Its first GREEN attempt
exposed three fixture assumptions: hired merc has216 prior cumulative XP,
export projects lastOnline, and high-ilvl table currency entries remain eligible.
Corrections assert the9000 delta, initialize metadata under the fixed clock and
inject a genuinely all-ineligible table. The failed attempt is retained.
Typecheck also caught an optional test-helper type; it was narrowed before the
final full suite. No runtime change followed the final full-suite source.

## Constructed production proof

Input is the exact earned Staff-inserted save with only Seven Tombs' completion
status and kill objective constructed. Import/export is exact. No combat or
earned kill is represented by this fixture.

Ordinary keyboard Claim grants exactly four seeded equipment items (three rare
Long Swords and one Venom Ward),21534 rune shards,12000 hero XP and9000 merc XP.
Those identities describe this fixture's seed, not a general reward guarantee.
Full item properties match the production TC oracle, apart from allocated IDs.
Full-save comparisons admit only those grants and the claimed flag. All4057
prior gear identities, values, order and allocation remain exact;4061 total IDs
are distinct after Claim. Other quest receipts and resources remain exact.

Before Claim, paid, and reimported-paid saves survive Save→close→new-page
Continue with exact IndexedDB/export equality. Two settled-save reimports and
disabled duplicate Claim attempts do not repay. Five sizes per locale cover
360×640,412×915,640×360,1280×800,1920×1080,44px Claim and no document/main
horizontal overflow. Cache label, controls and feedback are localized.
Existing Seven Tombs title/description/objective text falls back to English in
zh-CN; this slice does not claim complete narrative localization or full G5.

Versioned deliverables under `fixtures/`:

- `duriel-constructed-input.json.gz` — explicitly constructed completion input.
- `duriel-constructed-paid.json.gz` — exact settled English save.
- `duriel-cache.spec.ts.txt` — exact production browser script.
- `duriel-cache-oracle.json` — seeded item properties/currency oracle.

Producer-H3 APPROVE/security PASS independently checks all frozen files,
full unit and browser results. QA-H3 final APPROVE/security PASS independently
verifies the complete saves, all prior gear values/order/allocation, exact
fixture copies and the complete frozen packet. No material findings. Both
reviewers explicitly released all readers before cleanup.

Raw evidence root:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-duriel-v44tgpgo`.
Root owns retained diagnostic evidence through H3/C2/umbrella consumers. This
is required handoff evidence; remove it only when those consumers finish.
Exact task-owned `dist` and `browser-output` directories were removed and their
absence verified after readers released. All15 tracked command sessions are
terminal; owned preview port34567 is closed. `cleanup.json` records remaining
disposable paths[] and failures[]. `artifact-inventory.json` names every retained
diagnostic file; no shared package/compiler caches were removed.

Next: earned Act II progression, including the unresolved Radament preparation
route and eventual real Duriel victory. Tainted Sun's resistance reward and
Canyon unlock metadata, later acts, all skills and full campaign pacing remain.
