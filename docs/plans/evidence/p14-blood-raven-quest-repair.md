# P14 — Blood Raven objective and trainee reward repair

Status: implemented and verified locally; focused/persistence/full-unit/types/lint/
build and four ordinary production browser cases pass. Evidence retained and
disposable task outputs cleaned.
Full P14/C2–C4/G0–G7/private-v1 acceptance remains open.

## Behavior

The authored quest previously referred to obsolete monster and area IDs. Its
canonical native victory therefore could not satisfy the tracked kill objective.
Only that objective's source IDs now use `monsters/act1.blood-raven` and
`areas/act1-burial-grounds`. Shared exact-source matching stays intact. A later
Kashya Talk completes the quest without paying its reward automatically.

Explicit Claim now executes the actual authored trainee reward. It grants1500
hero XP and the normal1125 XP to the previously fielded mercenary, captured
before publication. If no instance of the authored trainee is owned, the real
JSON definition creates its level3 body without changing fielded selection.
Existing canonical or suffixed trainees retain their baseline, equipment and
progress; a previously fielded trainee receives legitimate XP/level gains.

Whole-bundle preflight rejects unknown unlock identities, missing definitions
and unsupported mixed rewards before writes. The shared transaction guard covers
publication and rollback; roster, progress, equipment and selection participate
where recruitment writes them. Failed restoration throws explicitly. No save
version bump, shards, pity, free upgrades, replacement gear or historical quest
credit is introduced. Six Act I areas,29 campaign areas and the Act II gate stay
as accepted in the [repair plan](../p14-act1-quest-repairs.md).

## Causal checks and scope

- Native final victory reproduction: one failure/five passing controls before
  correcting the objective IDs. Kill credit was false after actual native final
  settlement; no historical clear or diagnostic save was promoted.
- Authored reward reproduction:11 failures/four passing refusal controls before
  implementation. A new real persistence-boundary case independently fails with
  `unsupported-rewards` before the repair.
- Final focused run:488/488 across seven files,21.93s Vitest duration/
  22.922919254s wrapper wall. This includes six native integration cases,
  15 trainee reward cases, nine actual persistence cases, existing Claim,
  qualified-kill/Talk controls and320 real Ajv quest-loader checks.
- The first GREEN attempt exposed an invalid synthetic cap after the original
  kill assertions passed: its native socket capacity was omitted. The original
 487-pass/one-failure log is preserved. Setting that constructed cap's capacity
  to zero corrects the fixture; save validation and all assertions remain intact.
- Full typecheck passes121.065598417s. Production build passes13.203871214s into
  a task-local output directory. Its existing large-chunk and non-precached
  generated-manifest warnings remain; this is not a performance-budget signoff.
- The repository has no `validate:data` script. The real quest-loader Ajv tests
  cover the changed document instead; no validator or schema was weakened.
- Independent bounded final source/test review: APPROVE, no material findings;
  readers released. Static review only, no independent runtime QA.

The native and reward fixtures construct completion or strong equipment to test
wiring and failure safety. They establish no earned combat viability, economy
or pacing. The ordinary browser runner uses fresh isolated contexts, UI import
of explicitly constructed strength, real Start/Enter/Skip/Talk/Claim/Save/Continue
controls, no debug bridge and no injected stores. Date is fixed while ordinary
timers run; these saves never enter genuine ancestry. All four browser cases pass95.10725567s total:en/zh-CN at360×640/1280×800.
Each earns four actual native wave victories, records kill then ordered Talk,
grants1500heroXP/one level3trainee with preserved selection, and verifies exact
player/mercenary/inventory/map/formation Save-close-Continue state. No captured
page or console errors. The preview port39621 is closed after runner completion.
Final full lint passes246.092328138s; all1810 frozen inputs and the genuine
fixture hash remain exact after browser/lint consumers finish.

The repaired tree's original full-unit run63329 is terminal0 and consumed:
**20001 passed across946 files, two existing opt-in skips**,1262.42s Vitest/
1264.793522288s wrapper. The configured15s full-suite budget remains exceeded;
no timing-budget signoff is claimed. All1810 frozen runtime/config/test inputs,
HEAD`370aecb2` and the genuine earned-endgame4 gzip hash remain exact after
terminal completion. No duplicate full run was started. BUG326/327 are fixed
locally under this bounded functional verification; broader earned acceptance
and other Act I quest paths remain open.

## Evidence retention and cleanup

All original unit/type/lint/build/browser processes finished; recorded wrappers
and children are absent and preview39621 is closed. Independent review readers
are released. Root streamed/read-back verified864 archive members and every
original file hash, then removed exactly844 files/21 directories including the
raw task root, with remaining[]/failures[] and root absent. This removes task-local
build/browser outputs while preserving original REDs, the fixture-correction
failure, source proposal, check receipts and browser evidence in the archive.
Shared caches and the registered umbrella worktree remain intact.

Root retains these exact artifacts through full-v1/independent consumers, then
owns their eventual removal:

- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-blood-raven-objective-py73of_m.evidence.tar.gz`
- sibling `.manifest.json` and `.retention.json`.

Archive SHA256:`c77ad1bfc23542f67da361cf4c7e58674d3407ab0438d93e0b6d21046930199a`.
Manifest SHA256:`6427d2f2b7e6b83ba54967ffc65659d82338af7acd2455f6040fb6847631aa4a`.
The genuine earned-endgame4 save remains unchanged. No PR, push or deployment.
