# Intended owned equipment — 2026-11-02

All fourteen intended candidates now select eligible upgrades from their actual
backpack and stash at idle boundaries. Mainhand selection precedes other slots;
native comparison, eligibility, mutex, transfer and equip actions remain authoritative.
Double Throw acquires then retains throwing weapons, and martial Assassin claws,
because their invested masteries use those types. First acquisition can trade
scalar stats for identity and is recorded explicitly. Bow retains its existing
fallback policy. Reserved Iron Golem items cannot be equipped by hero or mercenary.

The [decision](../plans/decisions/P15-intended-owned-equipment-v1.md) defines the
policy. No item, resource, XP, currency or reset grants were introduced. This is
evaluation preparation; timely earned acquisition and build viability remain open.

Eleven new cases cover stash upgrades/idempotence, affinity acquisition/retention,
fallbacks, eligibility, reserved items, bow mutex, idle-only mutation and full
inventory capacity staging/refusal. Those pass with thirty growth and nine mercenary
cases. Nineteen existing action and forty-four profile cases also passed in the
preceding retained run: **113 distinct affected cases**. Its two failed new cases
incorrectly forbade valid companion upgrades; corrected cases retain nonequipment
mercenary state and full custody/economy checks. The final explicit lint and scoped
strict TypeScript checks exit 0. No passing campaign or browser suite was replayed.

Source authority 76 retains 2,142 production inputs; only campaign test discovery
changes from 75. Authored game data and production game source remain exact.
The 111-input campaign manifest changes five files: actions, policy, mercenary
equipment, intended profiles and the new equipment regression file. All 22 historical
profile bodies and registry entries remain exact, including the managed Bow snapshot.

Evidence root:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Index: `p15-intended-equipment-closure-v1.json`; profile snapshot:
`p15-intended-equipment-frozen-profiles-v1.json`; source authority:
`p15-campaign-harness-source-audit-v76.json`. Collector/cache cleanup is verified.
Root retains this worktree and required evidence through umbrella review.

Next declare companion/training/funding and role rotations, then run fresh intended
builds and holdouts. Full v1 remains unfinished; accepted balance is **0/210**.
Browser works, CI is excluded and no user answer or external blocker is pending.
