# P15 — Complete native wave-input recording

2026-11-03. BUG662 is fixed and verified locally. New earned observations retain
the complete serializable `CombatSnapshot` from the exact published native
receipt. This repairs reproducible diagnostics; no new campaign clear is claimed.

## Cause and implementation

The retained Double Throw journal contained teams, events and outcomes but
omitted skill projections. Reconstructing its first control lost Find Potion:
the original corpse became available at1180ms and recovery cast at1728ms, while
the reconstruction cast Double Throw at1728ms. The tuning trial stopped after
one control and zero candidates. Its proposed20→30Attack contribution was never
implemented; temporary tests were restored exactly. BUG656 remains Open.

`playEarnedWave` now verifies the published receipt has no pending transition
and matches the active run, seed, wave, recording references and published area
metadata before playback or awards. It clones the receipt's full engine input.
The P15 observer clones that input without reducing its fields, and both P15 and
earned raw-recording comparisons include it. Legacy observations keep the field
absent; neither reconstruction nor an invented default upgrades their evidence.
The exact typed quest-retention dummy supplies a visibly synthetic snapshot.

`runBattleRecorded(snapshot, carry?)` may require opaque process-local Battle
Command carry for later waves. This change serializes no carry proof and does
not establish arbitrary isolated-wave replay from a snapshot alone.

## Focused verification

Twenty-two affected cases pass:

- Seven native cases: two successive constructed Act IV waves capture exact
  inputs, actual Find Potion, clone independence and lossless codec roundtrip;
  missing/pending/copied-event/copied-outcome/wrong-wave/wrong-area receipts
  refuse before any observed combat or earned-state effects.
- Five observer cases include complete snapshot retention, independent cloning,
  journal codec roundtrip and legacy absence.
- Two constructed comparator cases detect absent or changed skill projections
  while reward equality stays true; both preserve legacy-to-legacy equality.
- Eight quest-retention regression cases pass with the updated dummy fixture.

Final scoped strict typecheck and explicit eight-path ESLint with zero warnings
pass. The first lint failure and correction remain recorded: explicit optional
historical comparator input, a nullable receipt check and chained-call layout.
The initial failing snapshot/native/comparator assertions are retained. The final
native checks rerun only after their source/test changes; the unchanged quest
fixture and final observer results are reused. No broad suite, earlier-act
campaign, browser or build is needed for this diagnostic-only change.

## Protected state and retention

Production Barbarian skill data still hashes to
`ca6ed7c5dc286e75aea0efa0ad9cd40aea4ea14041330d8c5d602a01c66a385b`.
The original Double Throw journal remains
`a468d9d840c5cb879af50d263ed921cabe8cec2a4d014fd2ad6fad1400e4206a`;
its terminal level49/next709export remains
`7091185addcaf28a06ba9e6630fd160391bfb87935ec37aa1b9be2dcab88244c`.
All failures, costs, partial successors, seeds, ordinals and exhausted budgets
remain. No campaign settlement or admission is executed by this slice.

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p15-native-engine-input-v1`.
It retains plan/security/plan-review, inherited preimages, RED/GREEN/check logs,
commands/exits, final source hashes and closure. The separate stopped tuning
packet remains `p15-throw-attack-tuning-v1` beneath its parent. Root owns both
through umbrella review and their eventual cleanup. Disposable scoped type
configuration is removed after validation; shared caches are preserved.

Security check: pass; plan review: ready. Root self-review is not final
independent acceptance. Counts remain14intended Act I clears,3five-act Normal
completions and formal balance0/210. Remaining build viability, BUG592,
economy/pacing/recruitment/fairness/adaptation/manual-idle/defeat-retry,
offline/PWA/endgame, integration/review/soak and later owner playtest remain.
Browser works; CI excluded; no pending answer or external blocker.
