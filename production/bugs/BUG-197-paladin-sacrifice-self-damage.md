# BUG-197 — Apply Sacrifice's advertised self damage

Severity: High — the advertised resource tradeoff has no combat consequence.
Status: Locally repaired/verified; independent and earned acceptance open.
Owners: engine-dev / content-designer / frontend-dev; root sole writer.

## Reproduction

Base `38a7bc4`, Linux/Node 24.21.0, actual native `playerToCombatUnit` and
registered battle engine, seed 7. Native engine reproduction; no browser claim.

1. Create a disclosed synthetic L30 Paladin, Sacrifice rank 1 or 20, sole selected
   active, with 5000/10000 HP, zero MP, no gear/aura and ordinary mana regeneration
   disabled. Other learned active prerequisites confer no aura or combat bonus.
2. Use a permanently held 100000-HP zero-defense/resistance/dodge target. Hold the
   caster from 1701 ms, after its first real scheduled action at 1700 ms, so there
   is exactly one skill cast and no incoming enemy damage.
3. Require native selection, one actual Sacrifice action, positive enemy damage,
   preserved zero MP, unchanged input and deterministic replay.
4. Require actual caster HP loss and a positive self-target damage playback event.

Expected: the caster suffers the self damage advertised in both
`skills.paladin.sacrifice.desc` locale strings. Existing copy supplies no amount;
a controlling local numeric/settlement contract is required before patching.

Actual: both ranks pass all 12 selection/cast/damage/payment/immutability/replay
controls. Enemy loses 41/117 HP, caster stays at 5000 HP, and no self-target damage
event exists. Four behavior assertions fail across the two rank cases.

## Root cause and evidence

The actual Sacrifice JSON has only an ordinary Physical damage payload. Neither
the registered effect nor combat resolution contains a Sacrifice self-damage
consumer. Zero MP cost is implemented, but it does not supply the promised life
tradeoff. No source change was made to hide or repair the reproduction.

[Native results](../../docs/plans/evidence/fixtures/sacrifice-repro-197/native-red-result.json),
[terminal receipt](../../docs/plans/evidence/fixtures/sacrifice-repro-197/terminal-receipt.json),
[exact original scripts/logs](../../docs/plans/evidence/fixtures/sacrifice-repro-197/raw.tar.gz),
[byte/cleanup audit](../../docs/plans/evidence/fixtures/sacrifice-repro-197/packet.json).
The RED exits 1 in 4.763 s. All six raw files are byte-verified and retained;
former task scratch `d2h5-sacrifice-_rpinmv9` is absent with no cleanup failure.
Original RED output must remain untouched when running a future GREEN probe.

Security check: pass — first-party local combat/data/UI repair, no credential,
permission, network, dependency, CI or persistent save-field request.

Repair: `4b07c98` authors validated 8%/minimum 1 life cost from actual enemy HP
removed and debits after ordinary settlement; `89c12a1` explains lethal risk and
current/next rules in both locales. Five new test files/60 cases; final full
14,045 passed/618 files/two existing skips, engine 7,331/262, types/lint/build and
four production browser cases pass. All 1,347 tested committed source blobs match.
[Full evidence](../../docs/plans/evidence/d04-paladin-sacrifice.md) retains the
original failures, terminal checks, exact save pairs and artifact/cleanup audit.
Only Sacrifice receives bounded-functional credit; provisional tuning is not
independent design or earned balance approval.
The other six unverified Paladin actives, independent/earned acceptance, Baal,
C2–C4/full G0–G7 and complete private v1 remain in scope and unfinished.

Controlling [local repair contract](../../docs/plans/decisions/D04-paladin-sacrifice-v1.md).
