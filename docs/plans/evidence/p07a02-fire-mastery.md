# P07a02 — automatic player Fire Mastery evidence

Date: 2026-10-21. Root owns writes, execution and cleanup in the claimed
`feat/playable-foundations` worktree. Producer, QA and design/technical reviewers
review independently and read-only. No remote publication or deployment.

## Accepted behavior and source

[D05](../decisions/D05-fire-mastery-v1.md) controls the authored level30, cap20,
+4% per allocated rank contract. It deliberately supersedes the legacy
level12/fixed30% promise. Exact authored/canonical aliases resolve their largest
valid finite positive integer allocation once, capped by copied authored tuning.
Missing, malformed and unrelated allocations resolve to zero. The immutable
definition independently validates authored metadata and alternate valid tuning.

`2fe7f4e` supplies schema, definition and rank resolution. `5d70cdb` adds automatic
composition through the existing Warmth boundary: Sorceress with finite eligible
level receives `.04 * masteryRank + .01 * warmthRank` fire increasedPct. Other
modifiers, damage types, stats, recovery and resource pools remain intact. The
runtime patch is seven additions/two replacements in `progression/warmth.ts`.
No combat, store or save runtime edit is needed. Burn derives from enhanced direct
damage once; periodic ticks and canonical refresh policy remain unchanged.

No combo, action, payment, cooldown or buff marker activates this passive. Native
new/wave/replay composition invalidates removed or ineligible allocation without
stacking, refilling, mutating recording/history or introducing persisted fields.
Real serialization/import/store tests mock only the disk adapter; actual durable
disk behavior has separate production browser evidence below.

`4c3de39` reconciles the Sorceress spec and both player locale descriptions to
level30/+4%/cap20/+80%, additive with Warmth/温暖. The distinct mercenary
`fire-mastery` descriptions retain their original bytes. `482662f` adds only the
two production Playwright test/config files. Runtime, native, copy and browser
increments have independent producer/QA approvals; GD/TD approve the contract
and copy reconciliation.

## Preserved failures and controls

Stage A schema behavioral RED has32failures/38controls. The missing-module
capability failure is retained separately. Definition/rank/typechecking initially
requires an Ajv generic correction from `SkillDef` to
`SkillDef & { readonly requiredLevel: number }`; assertions remain unchanged.
Final Stage A focused508, engine1566/67files and unit3870/172files pass, together
with types, lint and clean production bridge/build.

[BUG-059](../../../production/bugs/BUG-059-fire-mastery.md) precedes the runtime
patch. Pure composition behavioral RED has14failures/25controls; complete
prepatch RED has30failures/34controls across64tests/3files. Unchanged gameplay
oracles pass64/64 after the runtime patch. A real89-event prepatch recording and
result remain frozen byte-for-byte, SHA256:
`0a6c53176ff4184cc99bc676d785c2695ce45138ed09e033460265a1c683a054`.
Replay checks supplement this actual before/after control.

The initial runtime unit/type overlap is retained and excluded from accepted
serial gates. Reviewed exact-optional typing omits absent `skillLevels` through
conditional spread. Native test mock lint correction replaces an unnecessary
async wrapper with `Promise.resolve`; no behavioral assertion changes. All
attempts, proposed corrections, exact source snapshots and independent reviews
remain in the archive. Final accepted runtime/test hashes are indexed in
`runtime-accepted-source-freeze.json`.

## Production browser acceptance

Four cases pass: English/Chinese × desktop1280×800/CSS mobile360×640, one worker,
zero retries, maxFailures1,50s/case. A strict loopback preview on4349 reuses the
clean production build. Four JavaScript chunks are bridge-free and `__GAME__`
is absent. Only Date is fixed; native playback runs normally. There is no browser
internal-state/storage access, speedup, injected skill or fixture/seed search.

Each route creates an ordinary level1 Sorceress and proves Mastery locked,
passive/unlearned, with the localized disabled level30 control and unchanged
points/ranks. Ordinary export/import minimally prepares level30/two points,
FireBolt1 and a FireBolt-only combo. Natural core, equipment and resources remain;
there is no Warmth, mercenary, summon, added gear or clear flag. This is disclosed
eligibility preparation, not earned progression.

The real Allocate button gives rank1/one point/current4%. All nine combo slots
exclude the passive. Ordinary Save/status, closing the page, opening a fresh page
and Continue prove exact durable player/inventory/merc/map/formation/settings
parity through export. An ordinary Moor opening proves the literal hit and
ordered DOM MP. After Flee, another allocation gives rank2/zero points/current8%,
then repeats cold-page persistence and opening. Producer/QA independently check
all eight durable roundtrips and all eight openings against original attachments.

One reviewed native matrix captures ranks0/1/2 at fixed
`2026-10-20T12:00:00.000Z`, Blood Moor/ordinal0. Seed2330410254 produces
wave349193407; earliest FireBolt is cast1/event4 at1500ms, noncritical/nondodged.
Fallen A/堕落者 A has47HP, base roll33 and defense12:
`floor(33 * (1 + .04 * rank) - 12)` gives21/22/23. Rank1/rank2 leave25/24HP,
rendering53.19%/51.06%. Current resources retain the natural120HP/102MP;
level30 maxima are352/218 with recovery7. Ordered MP is102→112 natural recovery
→104 paid FireBolt. Later recovery106 is preserved separately. There is no
Mastery cast or buff. Capture SHA256:
`eed1e9d25ff46edd41d0672623a3b1e9b539a39f46e08454ebdde86bf31be14a`.

Observers retain20–22frames/case, capped at256frames/last8log lines. All36 extracted
attachments (468079bytes) match the original report bodies byte-for-byte. All
browser console/page-error arrays are empty. No horizontal overflow is observed
at checked points. Root visually inspects rank2 screenshots in all four cases.
The host lacks Chinese glyphs; mobile detail captures have a top-status overlay
and below-fold crop. DOM, mechanics and persistence pass; full glyph readability,
mobile readability and accessibility acceptance remain open.

## Final validation

All accepted final commands run serially in the claimed worktree. Exact command,
cwd, timestamps, deadlines, output hashes and process records are indexed.

| Increment | Focused | Engine | Full unit | Types | Lint | Clean production bridge/build |
| --- | --- | --- | --- | --- | --- | --- |
| Runtime | 64pass; native5/4.436s | 1625/69files/9.109s | 3934/175files/66.344s | 11.366s | 28.948s | 8.986s |
| Copy | 60/6.667s | unchanged runtime | 3934/175files/66.994s | 11.216s | 28.670s | 9.377s |
| Browser tests | 4browser/55.204s report,56.317s wrapper | unchanged runtime | 3934/175files/67.712s | 11.301s | 29.459s | unchanged validated copy build |

The browser increment changes only tests. All760 dist file hashes independently
match the copy build; engine/product/build/package/public sources retain their
accepted bytes. Every final command exits0 without stop reasons, signals or
survivors. Existing engine3s/unit15s timing goals remain missed. Browserslist,
chunk-size, optional art-precache and Node color warnings are retained. No new
coverage, earned campaign, numerical balance or full private-v1 acceptance.

Bounds: focused30/engine120/unit120/types90/lint90/build210/browser240seconds,
plus2s exact-owned cleanup;32MiB/file and64MiB aggregate RAW/dist/task .vite.

## Durable packet and cleanup handoff

[Packet](fixtures/p07a02-fire-mastery/packet.json) indexes333 safe regular RAW
records/17969355bytes,45 command metadata records,599 unchanged source
fingerprints and6839 PID/startTick identities, all absent without reuse. The
adjacent2218830-byte archive preserves originals, failures, source snapshots,
freezes, proposals, reviews, reports, captures and representative screenshots.
Packet SHA256:
`1a87fd4b2b02b8cc61d58e2e7b0885b7f8605acbe75dd003c7bdd93fc03b6ffb`.
Archive SHA256:
`585f9c544bba613651a44b9cfac30bccbe30a163113d2bdb65b652d9b87904e6`.

Producer and QA independently approve the complete packet and exact cleanup.
[Final review](fixtures/p07a02-fire-mastery/final-review.json) records verdicts
and all readers released. Evidence commit `24b2fa4` preserves the reviewed
packet/archive. [Cleanup](fixtures/p07a02-fire-mastery/cleanup.json) rechecks
333 RAW/archive records,599 source fingerprints,6839 absent process identities
and761 output hashes, then removes exactly333 RAW files,760 dist files and
`node_modules/.vite/vitest/results.json`. Absence of the old RAW/dist/task-cache
roots is verified; no cleanup signal is sent. The initial archival
inventory omitted that actual cache location; its retained correction adds the
final unit result before any cleanup. Eight browser temporary cache files were
already exactly inventoried, removed and verified absent. Shared caches,
pre-existing directories, source, history and durable evidence are preserved.
The umbrella worktree claim and full private-v1/C0–C4/G0–G7 objective continue.
Next root-owned source-only RAW is
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-might-w1jtf6hl`,
holding the hash-verified bounded runner and cleanup record. Root archives and
removes it after next-card consumers release. The next selected Paladin Might
aura slice begins with GD/TD contract reconciliation and independent concrete
plan/test review; no aura runtime change is implied by this closure.
