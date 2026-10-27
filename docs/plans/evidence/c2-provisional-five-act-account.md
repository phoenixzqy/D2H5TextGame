# C2 — Provisional earned five-act account

Status: five-act checkpoint XP established; complete attempt/time accounting,
30–50 active-hour pacing and independent C2 acceptance remain open. This is a
read-only synthesis of existing evidence, not a new campaign or pacing run.
[Checkpoint hashes and independently recalculated XP](fixtures/c2-provisional-five-act-account.json)
identify each retained source, including the exact Mephisto archive member.

## Genuine checkpoints

Saved `player.experience` is XP into the current level. Cumulative XP is
`xpTotal(level) + experience`, using `src/engine/progression/xp.ts`.
Fresh creation is L1/XP0. Each boss row includes its separate quest Claim.

| Endpoint | Level | XP into level | Cumulative XP | Increase since prior endpoint | Historical attempt marker |
| --- | --- | --- | --- | --- | --- |
| Fresh | 1 | 0 | 0 | — | Fresh |
| Andariel / Sisters | 12 | 32341 | 179290 | 179290 | Act I106 |
| Duriel / Seven Tombs | 24 | 188752 | 1985060 | 1805770 | 262 |
| Mephisto / Guardian | 30 | 279534 | 4261760 | 2276700 | 369 |
| Diablo / Terror's End | 32 | 149192 | 5159430 | 897670 | 391 |
| Baal / Eve | 35 | 105381 | 6994520 | 1835090 | 427 |

Checkpoint sources, relative to this document's `fixtures/` directory:

- Act I: `c1-fresh-act1-earned.json.gz`.
- Duriel: `earned-duriel-attempt262/retained-final.json.gz`.
- Mephisto: `earned-mephisto-and-act4-through375/evidence.tar.gz`, member
  `priority-preparation369/guardian-claim/guardian-claimed-continued.json.gz`.
- Diablo: `earned-diablo391/retained-final.json.gz`.
- Baal: `earned-baal427/retained-final.json.gz`.

The through375 final includes later Act IV progress and is not the Mephisto
checkpoint. Pre-Guardian cumulative XP4243760 plus18000 Claim equals4261760.
Fresh L1/XP0 is recorded in the historical C1 raw root's `fresh.json.gz`;
that path is historical provenance, not a new retained fixture asserted here.

Historical browser ranges are Act I0–106, III263–369, IV370–391 and V392–427.
[Act II started a new historical session ordinal0](d11-earned-radament.md)
after importing C1. These markers therefore do not prove one contiguous
fresh launch inventory0–427. Preserve this discontinuity; do not infer missing
launches or remove failed/interrupted attempts from denominators.

## Known farming and failures

| Segment | Verified activity | Remaining accounting limit |
| --- | --- | --- |
| Genuine Act I | 310 victorious waves:40 Blood Moor preparation waves, mandatory Den,61 further full Den clears, remaining route | Historical terminal DOM/log records lack simulation timestamps;764945ms browser execution is not combat time |
| Duriel262 | Six victorious waves,17710 combat XP and12000 Claim | Earlier258 defeat,259 interrupted,260/261 boss draws and Radament254/255 draws remain retained; complete Act II attempt/time ledger missing |
| Act III269–360 | 92 full Spider clears,460 victories,1858000 XP | Known265 draw,268 defeat,362 defeat,368 draw; compact clock advances/watchdogs are transport, not measured combat time |
| Act IV376–390 | 15 full River clears,90 victories,581270 XP | Includes389–390 idle interrupted by Settings/Save visits;375 Diablo defeat retained; not uninterrupted unattended proof |
| Act V farming396–399,402–426 | 28 full Arreat clears plus407's two winning waves:170 victories, one407 draw,1419560 XP | Full campaign combat/economic time missing; initial progression394 adds six wins/48820 XP and must remain separate from farming |
| Ancients400/401 and Baal427 | 400: six wins then60s draw;401: seven wins;427: eight wins/28130 combat XP plus40000 Claim | Diagnostic Baal median around204s is not measured genuine427 time; no complete Act V economic-time ledger |

Sources: [C1](c1-fresh-act1.md), [Duriel adaptation](d11-owned-duriel-adaptation.md),
the Act III through265/268/360/362/368 records,
[Mephisto through375](d11-earned-mephisto-and-act4-through375.md),
[Tyrael / River through379](d11-earned-tyrael-and-river-through379.md),
[Arreat402–407](d11-earned-arreat402-407.md),
[Arreat408–426](d11-earned-arreat408-continuation.md) and
[Baal427](d11-earned-baal427.md). The victory count is not a full launch count.

## Separate experiments with actual logical time

These measurements cannot be added to the genuine browser checkpoint chain.

[Original Act I service pilot](p01-act1-earned-entry.md):61 Den clears,
6857652 combat ms (1.905h),133990 XP. The separate restored-L12→L13 experiment
uses24 clears/2670512ms (0.742h)/50740 XP and has diagnostic item-ID collisions.

The separate current-runtime native17 screen at runtime6042bb9 records actual
`waves[*].terminalSimClockMs` in
`fixtures/fresh-native17-campaign-screen/native17-first-defeat.json.gz`:

| Segment | Waves | Actual combat milliseconds |
| --- | --- | --- |
| Blood Moor preparation | 40 | 962892 |
| Mandatory Den | 4 | 61500 |
| Den farming | 244 | 3396196 |
| Remaining Act I route | 22 | 287496 |
| Act I total | 310 | 4708084 (1.307801h) |
| Act II first two victories | 2 | 18564 |
| Act II first defeat | 1 | 15232.258 |

Its61.927s execution wall measures test cost. This native screen is not the
historical genuine browser ancestor and does not establish browser/persistence,
full-campaign or pacing acceptance.

## Remaining C2 acceptance work

[The acceptance contract](../playable-target.md#timing-retry-and-execution-accounting)
requires victory-only TTK, separate failed durations and throughput including
farming, recovery and legal retries. A versioned menu/decision-time policy must
be calibrated against ordinary human first-session playtests. Complete genuine
combat/idle time and human decision-time observations are absent; accelerated
playback, requested clock advances, script duration and XP cannot replace them.
The superseded16h/L55 prose is not an acceptance target.

A native uninterrupted repeat/Stop/persistence case and a separate observed
hidden-tab/return case remain needed. Existing River389–390 includes Settings
visits. Bound the new controls to at most two foreground repeats and one
hidden-tab repeat; observe actual visibility and conserve every settled reward.
The real production ticker is in MapScreen/CombatScreen; a standalone idle-hook
test does not establish that screen integration.

The [Act I repair plan](../p14-act1-quest-repairs.md) records four functional
main-quest gaps beyond unearned historical Claims. Blood Raven's canonical
source and trainee Claim are now repaired and verified locally in the separate
[bounded evidence](p14-blood-raven-quest-repair.md). Cain's physical rescue,
Countess's compact encounter/cache and Malus's recovery/imbue remain unfinished.
Their [approved contract](../decisions/D11-act1-remaining-quests-v1.md) includes
explicit missing-proof and service recovery for legacy claimed rows. Implement
those actions, then earn new qualified events through ordinary controls. Never
manufacture past quest credit or replay consumed Claims.

Independent read-only producer synthesis supplied these figures and released
all readers without edits, tests, builds, processes, scratch files or gameplay.
It is not independent runtime acceptance. The current genuine resume remains
[earned endgame4](p18-earned-endgame4.md), unchanged by this synthesis.
