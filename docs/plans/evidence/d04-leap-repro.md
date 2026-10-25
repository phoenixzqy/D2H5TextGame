# D04 — Leap's inert Knockback, native paired reproduction

2026-10-25; [BUG213](../../../production/bugs/BUG-213-leap-inert-knockback.md).
Root author investigation only; independent and earned acceptance remain open.

Actual native L30 Barbarian composition selects the real learned Leap at
ranks1/2/20 × seeds7/19/41/97. The hero acts once at1700ms, then is held from
1701. Three enemies at explicit grid positions `(0,0..2)` act normally for the
entire60s simulation. Compare the same snapshot with only Leap's registered
Knockback debuff ID replaced by a synthetic inert marker. No effect, target,
resource or cooldown is removed. Inputs are immutable; same-seed replay agrees.

All twelve cases pay once, costing8/8/6MP by rank, and emit exactly three
Knockback events. All actual/control enemy action arrays match exactly, from
2000ms through60000ms. All three explicit grid positions match their inputs.
The final assertion intentionally exits1 after retaining complete observations:
none of the twelve pairs demonstrates a control consequence. This is bounded
mechanical evidence, not an earned class/balance or browser acceptance result.

No global Knockback consumer exists in the inspected combat runtime. The game
forbids movement/range stats. Hammer's separate explicit Stun adaptation does
not authorize applying an arbitrary duration or bonus to Leap. Leap's active
physical-damage scaling metadata remains unverified; holding the caster after
Leap does not measure a later offensive benefit. Its author adaptation contract
must address that metadata as well as control before complete functionality
credit. No Leap source patch or inventory credit.

The [Hammer packet](fixtures/psychic-hammer/raw.tar.gz) retains `leap-repro.ts`,
`leap-observations.json`, `next-leap.log` and live/terminal command receipts.
The probe runs at `dee1342b` plus the Hammer source subsequently committed as `884b0839`; exact final source
is captured by the packet's delivery audit. Runtime6.62s; intentional exit1.

Genuine L33/nextNormal402/Baal uncleared is unchanged. No genuine campaign or
remote action. C2–C4/full G0–G7/all-class earned builds,30–50hour pacing/economy/
endgame and complete privatev1 remain unfinished.


## Subsequent local repair

`0742a94f` implements the explicit [author contract](../decisions/D04-leap-v1.md).
[Delivery verification](d04-leap.md) records actual paid control/Physical benefit,
finite carry, native lifecycle, full checks and production browser evidence.
This historical prepatch reproduction is unchanged; independent/earned acceptance
remains open.
