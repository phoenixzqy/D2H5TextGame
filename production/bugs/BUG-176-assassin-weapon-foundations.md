# BUG-176 — Enable Assassin weapon equipment and passives

Severity: High. Status: fixed locally in `a673b47`; independent acceptance and earned balance open.
Owner: root (engine/frontend/content). Baseline c5a20f7.
Reproduction: native Vitest store/adapter, no browser/viewport/locale required;
seed7 for later combat controls.
1. Equip one owned Short Sword, then select a second one for the offhand.
2. Look up the level-one Katar in the production base catalog.
3. Construct an eligible Assassin with two distinct one-handed weapons,
   Claw Mastery1 and Weapon Block20; compose a fresh combat unit.
Expected: explicit offhand equip/picker/preview work; a real attainable claw base
exists; Weapon Block adds20pp physical/10pp magical dodge.
Actual: offhand candidate is filtered/rejected, Katar is absent, and dodge stays
unchanged. All three native reproductions fail on baseline.
Root cause: stale narrow-roster claw exclusion and deferred dual wield, plus no
learned Assassin weapon-passive consumer. No workaround for these effects.
Evidence: src/stores/assassin-weapons.test.ts and retained red-native.log.

Validation finding before correction: the initial loot expansion also split twelve
forced unique/set rows without corresponding claw templates. The frozen full run
returned unsupported-rewards for five actual Act V Claim/UI fixtures; three literal
catalog assertions, one Mephisto table assertion and seven Act I row-count cases
also failed (16 total). Strict quest reward materialization correctly refuses a
rarity downgrade. Preserve the original forced-template rows; expand only ordinary
normal/magic/rare acquisition. Existing quest validation must remain strict.

Follow-up acquisition regression: removing unsupported forced-template entries
exposed Hand Scythe and Runic Talons as unreachable, because their sword tuning
peers have no ordinary sources. They now split the existing Act III Greater Claws
and Act V Feral Claws shares respectively; every table total, sword weight and
level band stays unchanged. No unique template or earned save is remapped.

Pre-commit integration finding: one-handed offhand runewords lost their reviewed
passive and active grants. Reproduction on c5a20f7 plus the pending foundations:
construct real Last Wish/Phoenix/Hand of Justice/Death in a legal one-handed sword,
compare its weapon-slot grants with offhand grants, then equip natively. No RNG,
browser or locale needed. Eight causal failures/20 passing controls are retained
in red-offhand-grants.log and the corresponding test source. Root cause is the
resolver's duplicated baseSlot===slot check. Reuse the canonical base-aware
slot predicate, preserving exact socket validation, duplicate reduction, invalid
container/two-handed exclusions and the separate mercenary equip refusal.
Security check: pass; no external content, dependencies, credentials or policies.

Final verification and retained causal regressions: [D05 evidence](../../docs/plans/evidence/d05-assassin-weapons.md).
