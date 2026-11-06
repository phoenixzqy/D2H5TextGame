# Defensive Bow policy and automatic Slow Missiles rotation

Date:2026-11-02. Local uncommitted implementation; root sole writer.
Full private v1 remains unfinished; accepted balance cells0/210.

## Implemented policy and observed failure

[P15 policy](../plans/decisions/P15-bow-survival-profile-v1.md) adds an opt-in
2DEX/3VIT Bow allocation with earned Inner Sight/Slow Missiles from12, preserved
bow fallback and monotone fielded-merc equipment. Its36 distinct affected
cases pass across retained v2/v3 runs, with scoped types/lint. This is native
allocation evidence, not a balance result; no refunds or grants were added.

The source66 fresh pilot technically completes but fails before Act II:

| Observation | Result |
| --- | --- |
| Admissions / played waves |109 /319|
| Wave wins / defeats |317 /2|
| First defeat |Catacombs106 wave5; entryHP271, minimumMP115|
| Recovery defeat |Dark Wood108 wave5; entryHP198, minimumMP27|
| Earned XP / acquired items / salvaged items |182,490 /3,099 /2,926|
| Terminal |Level12, nextNormal109, clock1793307355010|
| Simulated combat |3,355,001.5028577894ms (~55.92minutes)|

The driver exits0 because technical completion preserves gameplay failures.
The report explicitly says nonwin. Simulated combat duration does not measure
player active hours. No engine exceptions or unobserved played waves occur.

`p15-bow-survival-fresh-act2-v1-readback-v4.json` independently reconstructs all
319 settlement summaries, intrinsic item custody, currency/material/XP totals,
advancing ordinals and native seeds, and exact exported/native terminal state.
It authenticates the frozen plan/source66/campaign106. Current differences are
bridged by exact two-file pre-fix snapshots. Reader v1/v2 incorrectly assumed
an object/`claimed` quest result (actual `ok`); v3 assumed a full-save merc key
on a store-shaped nonwin observation. V4 instead checks that entire before/after
observation is identical. Failed readers remain; no combat was replayed.

## Root correction

The journal shows six-second Slow Missiles windows refreshed every3,732ms in
Catacombs106 wave1, spending actions and mana while all opponents remain slowed.
P15's claim that native selection already prevented this was false. D04's
“refresh replaces, never stacks” rule allowed it; the new automatic-availability
rule is recorded explicitly in [D04](../plans/decisions/D04-slow-missiles-v1.md).

[BUG-602](../../production/bugs/BUG-602-slow-missiles-redundant-automatic-refresh.md)
changes the shared selector: an eligible paid cast is available only if some
current living opponent has no private binding or its expiry is at/before the
action clock. New opponents can trigger an earlier cast. Visible markers confer
no authority. Allowed casts retain replacement and all-enemy behavior. No damage,
cost, duration, cooldown, save or build-policy tuning accompanies the change.

The new seed7 cases reproduce five failures before correction. Passing evidence
for55 distinct affected cases is composed from `bug602-green-v1.json` (45),
filtered v2 (four, one overlaps), and `bug602-display-v1.json` (seven). Ten tests
are intentionally outside the filtered v2 execution. Initial GREEN expectations
for canonical action IDs and rank20 integer payment were corrected to match
existing native rules. Strict scoped types and ESLint v2 pass; all earlier
failures stay retained. Tests observe offensive fallback, exact expiry/payment,
rank1/20, aliases, forged markers, new summons and existing flight/lifecycle.

Authority67 enumerates2,141 production inputs; exactly combat and its focused
test differ from66. All106 campaign inputs and authored game data are unchanged.
Source tree:c5f79368c69300801dfda9338d6955d384fe0bd3f04715a83a9d307e7d942ce2.
Data:f94fd205da07f4fa8818d38aad5074a97fe7807230bf9c53466faae2f4c6bece.

## Paired diagnostic and remaining work

The separate `p15-bow-survival-refresh-fresh-act2-v1-plan.json` freezes source67,
the unchanged build policy and original creation clock before one fresh trial.
Plan SHA:4317ec5c1dd84b91108b1d41e3e87fc715aade791a986fe502c8d5c861cab291.
This compares a real controller run after a rotation fix, not an independent
holdout. No extension of the exhausted Arcane/Dry Hills histories is allowed.
The fresh run technically completes but ends in gameplay defeat. Independent
readback v2 authenticates all509waves without combat replay:

| Observation | Result |
| --- | --- |
| Admissions / played waves |153 /509|
| Wave wins / defeats |506 /3|
| Earlier losses |Dark Wood105 wave5; Rocky Waste136 training wave4|
| Terminal loss |Dry Hills152 wave3, level16; entryHP379, minimumMP167|
| Earned XP / acquired items / salvaged items |425,980 /5,062 /4,840|
| Terminal |Level16, nextNormal153, clock1793309517960|
| Simulated combat |5,517,945.009068887ms (~91.97minutes)|

Rocky Waste clears; Dry Hills does not. Act II preparation includes18training
admissions, one cleared route admission and one training loss. No engine
exception or unobserved/unmeasured wave occurs. All rewards, item custody,
nonwin before/after state, advancing clocks/ordinals/native seeds and exact
native/export terminal state reconcile. Reader v1 incorrectly required entire
source metadata equality; v2 permits only the two exact documentation git-status
additions and proves all other fields plus2141production/106campaign hashes
unchanged. Both reader histories remain retained.

Final-wave inspection finds319lightning,108cold and13physical incoming damage
plus7poison damage. The two Slow Missiles casts are appropriately separated.
The hero kills12of19ordinary level18opponents; large outgoing overkill is not
proof of a weak damage coefficient. Four dodged merc attacks and normal repeated
paralyze applications do not establish merc eligibility or status defects.
The old policy omits the existing survival-gear selector. The next declared
[owned defensive policy](../plans/decisions/P15-bow-owned-survival-v1.md) evaluates
that omission without retuning combat or extending this terminal run.

Report SHA:ef59c82e0c3be173a759fa934ac6ceff498df1a27b58099c8e58457f324f6345.
Journal SHA:aae9a5fddca6195a636ecd0c3f969a64101353356bed42000a90342ba0eb139a.
Independent reader: `p15-bow-survival-refresh-fresh-act2-v1-readback-v2.py/.json`;
reader SHA:7e19e89367bdd9bb92cb0b24a2e300c1f345fc5ffce9b11a8b50411fc2dd6a7d.

No build/population,30–50 active-hour pacing, funding fairness or release gate
is accepted here. Full remaining scope includes unresolved build progression,
14-build fresh populations/holdouts, recruitment/Hell economics, retry/manual-idle,
BUG592, integratedG0–G7, two-hour soak/review, then owner playtest. Browser works;
CI excluded; no pending answer/external blocker. Root retains the worktree and
required packet through review and owns eventual cleanup/release.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
All exact before/after snapshots, plans, raw journals, failed readers and receipts
are required evidence. The collector's exact `bug602-source-vite-cache` is absent.
