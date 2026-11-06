# P15 — Double Throw Attack growth: local tuning verified

Date: 2026-11-04. BUG656 remains **Open** for intended earned progression.
The previous goal turn reported status and made no implementation progress.
This slice adopts and finishes validation of the sole bounded numeric candidate.

## Change

[Contract](../decisions/P15-double-throw-rank-attack-growth-v1.md): Double Throw's
existing `attackDamagePctPerLevel` changes from20 to30. Rank1 adds no Attack;
rank2 adds30%, and allocated rank20 adds570% per attempt. Double Swing stays20.
There is one production JSON value change; engine/schema/UI consumers and save
format are unchanged. Four affected test files now assert the separate curves,
literal damage sensitivity, authored/native registration and bilingual previews.

## Frozen comparison and provenance

Packet parent:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p15-throw-native-projection-tuning-v1`

Adopted child packet: `native-boundary-v2` beneath that exact parent. Its frozen
`plan.json` SHA256 is
`c7ddec768ea27fe2bff3b5d85815c04cceeb80b0f4211522a73614a38e17904c`.
The digest is checked by the retained driver/results.

The first older attempt omitted native Find Potion and stopped after one
control. The parent attempt retained that projection, reproduced its first
control, then stopped before its second battle: it compared a raw rebased result
with the historical **published** UI opening. Native initialization and
`stageRecordedBattle()` remove/reissue real paid Battle Command markers and
publish status/capacity observations. Those are different comparison boundaries.

The child uses the actual native publication function to compare complete
published player/enemy openings, plus complete events/outcomes. Subsequent
inputs derive from the preceding actual engine result using native rebasing;
opaque paid carry is neither fabricated nor manually serialized. All15controls
match events/outcomes exactly, and all12between-wave published transitions
match. These explicitly reconstructed legacy inputs remain weaker provenance
than a complete retained native snapshot. Observational equality does not
upgrade them to earned campaign evidence.

The prospectively frozen scope allows15controls and15candidates, one30pp value,
zero new campaign admissions/save actions/rewards/seed searches, and no retry.
Together with both stopped predecessor controls,32diagnostic battles were used.
No additional numeric value, seed or rotation was tried.

| Original ordinal | Control Izual result | Candidate Izual result |
| --- | --- | --- |
| 706 | 60s draw;8556Life remains | 54.5396s win |
| 707 | 60s draw;9657Life remains | 47.0578s win |
| 708 | 60s draw;4863Life remains | 50.4570s win |

All15candidate battles win with a living hero. Each boss finishes below60s;
the hero ends each boss fight at1614.24Life/462Mana. Both diagnostic lifecycle
records report completed, no failure and cache absent. `baseline-result.json`,
`candidate-result.json` and all30individual wave records retain the full result.

## Focused verification

- RED:15failed/12passed, with the old coefficient; expected damage, registration
  and display failures. GREEN:27passed across the three skill/rank/UI files.
  The name filter excludes the two retained ActIclear tests; neither was replayed.
- Integration initially had2failed/4passed: the literal damage bounds in
  `double-throw.causal.test.ts` still used20%. The captured fixture has100Attack,
  zero target Defense/resistance and no crit. Updating both lower/upper bounds
  to30% yields6passed. Target-pool, exact event/playback, Life accounting,
  one payment/action, native next-wave learning and save roundtrip assertions
  remain intact. There are no removed or weakened checks.
- Scoped strict TypeScript passes with the normal `src/test/setup.ts` ambient
  matcher declarations. The first scoped config omitted that setup and failed
  on three `toHaveTextContent` declarations; its failure remains recorded.
- Explicit four-test-path ESLint passes with zero warnings. No broad suite,
  completed campaign, earlier-act progression or performance trial ran.
- Real Chromium:16synthetic preview cases, English/Chinese ×1280×800/360×640
  ×allocated ranks0/1/2/20. Ordinary character creation and Settings save
  export/import supply the fixture; no browser JS writes or earned-save edits.
  Current/next/MAX rows show0%,30%,60% and570% as applicable. Read-only DOM
  inspection confirms no horizontal overflow; all four contexts have no console
  warning/error, page error or HTTP failure. Viewing details preserves allocated
  ranks, unspent points and map state.24screenshots are retained, with mobile
  Chinese MAX and desktop English next-rank screenshots visually inspected.

Commands and exits are retained in `red-exit.json`, `green-exit.json`,
`integration-exit.json`, `integration-green-exit.json`, `types-exit.json`,
`types-green-exit.json`, `lint-exit.json` and `browser-exit.json`, alongside logs.
The first browser cold boot exceeded the10s navigation timeout before any case;
its files are retained as `browser-attempt1*`. An interrupted evidence rename
also caused a missing-runner launch, retained as `browser-launch-error*`; it
performed no browser work. After confirming the original process terminal,
the corrected runner allows60s navigation and completes all16cases in43.96s.
The host Browserslist age notice is retained; no dependency update/install ran.

## Custody, review and cleanup

`closure.json` verifies the frozen2237-entry source manifest changes in exactly
five paths: one production JSON and four affected tests. The production
preimage SHA256 is
`ca6ed7c5dc286e75aea0efa0ad9cd40aea4ea14041330d8c5d602a01c66a385b`;
the adopted JSON SHA256 is
`275903d44d8f85c0f22f2c4f3137de3410f6963e6c61712b22129dfafe5e7a6a`.
Structural comparison proves the coefficient is its only value change.

The protected native export remains level49/next709, SHA256
`7091185addcaf28a06ba9e6630fd160391bfb87935ec37aa1b9be2dcab88244c`;
the journal remains SHA256
`a468d9d840c5cb879af50d263ed921cabe8cec2a4d014fd2ad6fad1400e4206a`.
The original inputs also authenticate unchanged. Throw706–708 and all separate
preparation budgets stay exhausted. No ActIVclear, income or continuation is
credited. The33focused passes and16browser previews support this local change,
not an independent final acceptance, a population balance result or a campaign.

The first closure verifier wrongly expected an `exitCode` on diagnostic lifecycle
records; `closure-attempt1.json` retains that failure. The corrected verifier
checks their actual completed/cacheAbsent/failure contract. All owned validation
sessions are terminal; both browser driver PIDs are absent. The exact disposable
scoped type config and packet-local Vite caches are removed and absence checked.
Required packet, preimages, failures, synthetic fixtures and screenshots remain
at the exact parent/child path above through umbrella review; root owns their
eventual cleanup and worktree release. Shared caches and unrelated edits remain.

Counts remain14intended ActIclears,3five-act Normal completions, formal0/210.
Full privatev1 remains active: remaining intended-build viability, population/
holdout balance, economy/pacing/recruitment/fairness/adaptation/manual-idle/
defeat-retry, offline/PWA/endgame, BUG592 and final integration/review/soak/later
owner playtest are unfinished. Browser works; CI is excluded; no pending answer
or external blocker. No agents, installs, commits, pushes or publication.
