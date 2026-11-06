# P15 — Double Swing verifier and forward diagnostic

2026-11-04. The corrected future capture helper passes its constructed
regressions. A separately bounded native diagnostic then clears Acts IV/V with
the prepared owned sword and rotation. Its preparation ancestor is explicitly
reconstructed: this is viability evidence, not an earned Normal completion.
BUG669 is locally resolved for future verification. BUG659 remains open for
earned intended-build acceptance. Counts stay **14/14 Act I, 10/14 Normal,
formal balance 0/210**; full private v1 remains incomplete.

## Future verifier correction

The original successful equip was followed by an external expectation that
retained the stale `player.equipment` mirror. Native serialization rebuilds that
mirror from `inventory.equipped`. The assertion threw before a terminal export
was captured. Production equip and save logic need no change.

The retained `future-driver.ts` extracts `capturePreparedEquipment`: it writes
the actual snapshot/export/projection before fallible conservation checks and
compares against native `buildSave(expected)`. Three meaningful controls all
fail under original logic and pass after correction:

- Accept a native canonical equipment mirror after a swap.
- Preserve the terminal evidence when currency conservation fails.
- Reject a missing owned item while still preserving actual terminal evidence.

Final scoped strict types and explicit two-file no-any/no-unused lint pass.
Only the helper is run on constructed fixture stores. The full future driver's
`main` and the original reset/allocation/equip sequence are not repeated.

Fixture/tooling failures remain retained: an overlong fixture name, missing
canonical socket fields, and readonly/optional type errors were corrected.
They are not production gameplay failures. No strictness or assertion was
relaxed. The original missing observation remains unavailable and its launch
remains failed; the prior reconstructed export is unchanged.

## Prospective native diagnostics

Act IV starts from reconstructed export SHA256
`19841b5a5b8df6a6e92325d308840b3c0179e14c04c2059c23f056ee0786ce99`.
Its frozen plan allows three first admissions, 30 combat minutes, 120 wall
seconds and a 64 MiB journal. Separate raw readback passes before its successor
is used for Act V. The Act V plan then allows five first admissions, 70 combat
minutes, 120 wall seconds and a 64 MiB journal. Both stop at the first non-win;
neither permits training, retries, resets, gear or socket experiments.
Original attempts708–710 and preparation/staging expenditures remain spent.

| Diagnostic | Native ordinals | Waves | Combat time | Hero XP | Added items |
| --- | --- | --- | --- | --- | --- |
| Act IV | 711–713 | 18/18 victories | 180.611 s | 669,776 | 180 |
| Act V | 714–718 | 33/33 victories | 349.978 s | 1,523,534 | 319 |

Native admission, playback, settlement, quest actions and generated seeds are
used. The online clock advances only by consumed wave time. Both runs capture
the actual terminal export before fallible audits, including on failure.
The initial and stopped checkpoints and reports identify reconstructed ancestry;
reports set `earnedCampaignCredit:false` and `acceptedBalanceCells:0`.

Act IV finishes level49/next714, with all main Claims and Act V access. Act V
finishes level50/next719, with all19 main quest actions, five Claims, twelve new
receipts, consumed potion/resistance-scroll sources, Baal title and Nightmare
unlock. The scroll is separately Read after Claim. Native point growth raises
Sword Mastery15→17→20 and spends the one earned level's five stat points.
Equipment, companion and remaining reset allowances are conserved.

The Act IV observed successor SHA256 is
`ef925e9bf68051a5498ae10c1d0d5e295e3557b01c3f8eef12063fe818ed5f6e`;
the Act V observed successor SHA256 is
`814b67e45e5aefaed55857f61b18073c7dfa381be08e19dd0fa4020db5bde0eb`.
These are observed later states whose ancestry remains reconstructed.

## Readback, custody and remaining work

Separate raw readers reconcile staged/settled parties, events, wave order,
attempt ordinals, time, rewards, all item identities, currencies/materials,
hero XP and saved merc XP thresholds. Act V's extra route reader checks the
complete quest/source/receipt graph, inherited state, actual rank/stat
allocations and entitlement state. All2,230 production inputs and134 campaign
inputs stay exact. Root readback is not independent QA or formal acceptance.

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-swing-verifier-iialnz8z`.
It retains original/RED/corrected drivers, three regression results, failed
attempts, final types/lint logs and the original-input hashes in `plan.json`.
`act4-diagnostic/` and `act5-diagnostic/` retain prospective plans, native
reports/exports, raw gzip journals, process receipts and passing readbacks.
`act5-route-readback.py` and its result retain the separate quest/point audit.

Owned sessions are terminal; the recorded new PIDs and three exact Vite cache
paths are absent. Temporary compiler/lint configs are archived as
`tsconfig.json.txt`/`eslint.cjs.txt`; their active originals are removed.
`cleanup-readback.json` records those checks. Root retains this exact evidence
packet and human2 through unfinished umbrella review, then owns exact cleanup
and release. No browser server, install, broad suite, build, commit or publication
occurs in this slice. CI remains excluded by the user's instruction.

Security check: pass; isolated native stores and task-owned local evidence only.
Plan review: ready for bounded viability diagnostics, with provenance, stop
rules and failure capture explicit. The previous goal turn was status-only/no
progress; this continuation produces new diagnostic and regression closure.
Next address the unfinished earned-build frontiers and the remaining economy,
pacing, difficulty/endgame, app/performance/soak and independent acceptance.
