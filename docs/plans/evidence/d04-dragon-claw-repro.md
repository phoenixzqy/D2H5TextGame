# D04 — Native Dragon Claw paired-strike reproduction

2026-10-25. Reproduced only; no repair or whole-skill credit.
[BUG208](../../../production/bugs/BUG-208-dragon-claw-missing-paired-strikes.md)
precedes any paired-strike/critical implementation.

The [Fire Blast packet](fixtures/fire-blast-cone/packet.json) retains
`scratch/dragon-claw-native-repro.ts`, `scratch/dragon-claw-native-observed.json`
and `scratch/next-dragon-claw-repro.{log,json}`.12actual native cases cover
ranks1/2/20 ×seeds7/19/41/97, real Dragon Talon prerequisite, one action/20MP
payment, immutable exact replay and actual final HP conservation. Every case
has one damage attempt, despite both locale descriptions promising two.
Nine hits are positive; seed7 direct71/78/204 leaves1929/1922/1796HP.

Resources, target and holds are synthetic; no earned build/balance claim.
The script retains observations before an intended exit1 asserting two attempts.
This is a separate diagnostic, not a required-suite failure. It runs against the
current frozen1386source snapshot, which remains exact through full verification.
A numeric bonus-critical design is also absent and needs an explicit contract;
this reproduction does not settle that percentage or waive martial build goals.
Genuine retainedL33/next402/Baal-uncleared digest remains unchanged.
