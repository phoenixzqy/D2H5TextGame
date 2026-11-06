# P15 — Select intended physical companion weapons by offense

Status: implemented; earned Bone Act II completion independently verified; population acceptance open.
Date: 2026-11-02. Owner: root.

All three authenticated pre-Tomb checkpoints own the same eligible backpack
polearm. Canonical projection raises Prayer's attack from 155 to 339, losing
15 maximum Life, 8 magic mitigation and 5 attack speed. The historical monotone
selector rejects it. The zero-combat audit is
`p15-bone-tomb-owned-weapons-v1.json`; it uses custody at each checkpoint rather
than later rewards. Its pre-mitigation attack score is not a victory claim.

Add an explicit `mercWeaponPolicy: physical-offense-v1` for the fourteen intended
profiles, whose declared companions use weapon attacks. Keep their existing
monotone policy for other slots and preserve all historical profile behavior.
At the shared equipment boundary, rank eligible owned weapons by attack times
attack speed times expected critical multiplier, including native critical
overflow. Replace only on a strict score improvement; resolve ties by item ID.
This explicitly accepts weapon defense/resource tradeoffs. Existing subsequent
armor/jewelry survival preparation remains responsible for defense.

Use the canonical star-aware projection and native eligibility/equip service.
Respect the reserved Iron Golem item and the caller's backpack/stash scope.
Record the selected policy, projected stats and score. Do not grant Life/Mana,
items, sockets, XP or capacity; displaced gear returns through native ownership.
This is an evaluation policy, not an automatic player equipment feature or a
change to production combat/data. The score does not estimate mitigation,
conditional grants, survival or final DPS.

Validation: reproduce the rejected weapon tradeoff first; cover strict
improvement/ties, speed/crit tradeoffs, native gates, reserved items, custody,
historical isolation and the common equipment-boundary handoff. Run only the
affected cases plus scoped strict types and explicit lint.

After checks, compare the policy on all three retained Tomb boss states with
their original rotations. Reuse prior exact-control evidence. No new seeds,
training or campaign admissions in that isolated comparison. A favorable result
still needs a bounded native earned suffix from an authenticated pre-Tomb save,
including earlier costs and existing retry limits. Never extend terminal 555.

Plan review: ready; explicit shared opt-in fixes the rejected tradeoff without
changing the historical contract or tuning combat to a seed. Security check:
pass; local owned-state operations, no installs, publication, credentials or
protected save writes. Full private v1 remains active; formal balance 0/210.

## Verified result

All18 selector cases, all14 intended-profile registration and native boundary
integration pass; scoped strict types and explicit lint pass. Other slots remain
monotone; historical profiles are unchanged. The shared prefix20 extension has
51distinct affected passing cases and final types/lint.

All three retained Tomb boss states win with their original rotations/seeds:
48300/22080/24840combat ms. The isolated comparison grants no campaign income.
The earned `p15-intended-tomb-weapon-v1` then uses authenticated pre552/prefix20,
selects the same owned weapon natively and wins one admission/sixwaves. Seven
Tombs claim/unlock assertions pass. Total35470XP,69items,zero salvage,
163767.8350515464combat ms; terminal32/next553. No training/earlier route replay.

Independent `p15-intended-tomb-weapon-v1-readback-v1.json` passes exact native
export, ordered custody/economy, points, quests/cache rewards, clocks/seeds,
party carry, mercXP and suffix/retry bounds. All2142production/113campaign inputs
match; two native capacity refusals preserve state; no sockets/recoveries.
Failed diagnostics and all ancestor costs remain; terminal555 stays terminal.
This supports earned continuation into Act III, not population/pacing acceptance
or closure of BUG608. Launcher0/cache absent. Root retains packet through review.
