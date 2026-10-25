# BUG-208 — Dragon Claw emits one attack instead of its promised pair

- Status: fixed and verified locally; independent design/QA and earned balance remain open.
- Severity: High — the paid skill lacks an advertised second attack attempt.
- Environment: Node24.21.0, real default registry/native L30 Assassin.
- Owner: root; independent design/QA and earned balance remain open.

## Reproduction

1. Recursively learn actual Dragon Talon prerequisite and Dragon Claw ranks1/2/20.
2. Select only Dragon Claw; isolate one cast at seeds7/19/41/97 against a held
   synthetic2000HP target, zero defense/critical chance and later caster hold.
3. Assert one native action/20MP payment, immutable replay and final-HP conservation.
4. Require the two claw attempts promised by both locale descriptions.

Observed:12cases all emit one Physical damage attempt; nine are positive hits.
Seed7 at ranks1/2/20 removes71/78/204HP, final1929/1922/1796; mana100→80.
Registered effects are one ordinary Physical damage effect with no hitSequence.
The diagnostic retains every case then intentionally exits1 on the two-attempt
requirement. English promises a pair of swift claw strikes with bonus critical
chance; Chinese promises two consecutive claw attacks and extra critical chance.

Root cause: the actual row lacks repeated-attempt metadata/runtime opt-in.
The bonus-critical promise also lacks an explicit authored amount; this probe
proves the missing second attempt, not a numeric bonus-critical contract.
Record a faithful two-attempt/critical adaptation before implementation; do not
credit two attacks by merely doubling one scalar hit or waive the bonus promise.

See [native reproduction](../../docs/plans/evidence/d04-dragon-claw-repro.md).
The initial reproduction included no Dragon Claw code/data patch, functionality
credit, genuine campaign or remote action. The repair continuation follows below.


## Local repair continuation

Runtime `70efa356` and presentation `79d3311a` restore two independent
original-target attempts and the explicit provisional10-point critical bonus.
Final full14730/658/two existing skips, types/lint/build and four production
public cases pass. See [verification](../../docs/plans/evidence/d04-dragon-claw.md)
and the four Dragon Claw regression files. The reproduction above remains
historical; independent/earned acceptance and full v1 are open.
