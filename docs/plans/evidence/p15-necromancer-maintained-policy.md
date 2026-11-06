# P15 — Maintained Necromancer summon growth

`tests/campaign/profiles.ts` now maintains a continuous-growth candidate informed
by the earned five-act success. The existing `necromancer-summon` ID and its
level 1–14 skill allocations are preserved. Native starter eligibility is
explicit, including Skeleton before Mage when growing refunded points.

After Skeleton12/Skeleton Mastery20, the policy purchases Iron Maiden/Life Tap,
Weaken/Terror/Decrepify and Dim Vision/Confuse in prerequisite order, then global
Summon Mastery20 and additional Mage ranks. Control is available before filling
global Mastery. The combat order is Skeleton/Clay/Mage/Confuse/Iron Maiden/Amplify;
unused sustain/control ranks remain learned. Growth spends 0 Strength, 1 Dexterity,
3 Vitality and 1 Energy per native five points, matching the earned final stat
distribution, and enables the existing native mercenary gear policy.

The ordinary maintained runner already consumes these profile targets. No new
execution mode, gameplay rule, save migration or reward grant is added. This
does not reproduce the historical sequence of resets, Prayer acquisition and
gear adaptation. Its fresh campaign viability remains pending; the historical
earned export and source pins remain authoritative for their original runs.

## Scoped verification

Two selected cases in `profiles.regression.test.ts` pass: the existing native
creation/level 1–14 conservation case for this profile, and a new native growth
case through level60. The latter checks exact rank vectors at30/40/53/60,
prerequisites, all native stat/skill points, control activation, retained reset
counters, repeated-growth idempotence and unchanged nonplayer domains. Supplied
XP is a constructed allocation fixture; it grants no earned campaign credit.
Without quest rewards, level60 supplies the64 total ranks seen in the earned
level53 export, including Mage3 and both Masteries20.

The original candidate fails on its obsolete Dexterity/Energy allocation.
An earlier fixture name exceeded the native character-name limit; the first
green attempt compared independently generated export timestamps. Both test
fixture errors were corrected, with their failed reports retained. Final two
selected cases pass (431ms test execution;11.776s command wall time), scoped
strict types pass (9.431s), and two-file lint passes (8.752s). No campaign replay,
earlier-act tests, full suite, engine sweep, build, browser rebuild or CI ran.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
`p15-necro-maintained-policy-artifacts-v1.json` records exact source hashes,
retained logs/terminal receipts and removal of the temporary type configuration.
Root retains these diagnostic leaves through umbrella QA and owns their eventual
disposal. No task process or task cache remains.

Next continue the other retained build checkpoints. Nova is also complete:
the newer `p15-nova-act5-baal-retry-reaudit-v3.json` supersedes its former Baal
draw, with native1410 victory/Eve Claim and next1411. Do not replay either
completed campaign. Final fresh integration, fourteen-build acceptance,
economy/pacing/holdout, production/PWA/endgame/soak and owner acceptance stay open.
