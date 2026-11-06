# P15 — Native surplus salvage for the earned Mastery route

2026-10-30, BUG453. V1 training technical PASS213.112s, four full Bazaar wins
and133180XP; capacity stop beforeL30. Retain the failure. No game code change.

New fresh successor preserves all1517waves and entire terminal capacity state
before first salvage. Intercept only that exact declared stash-capacity stop
after ActIII mastery recovery starts. Use real prepare/preview/execute material
action; preview may not mutate. Select stored magic/rare gear only, no equipped,
unique/set/runeword/socket-filled/reserved/quest items. Across bag+stash retain
top3per slot by native hero caster score and net stats, plus merc mean physical/
lightning EHP and net stats. Strict base/ring merc compatibility; deterministic
ID ties. Include future ineligible gear in read-only comparison ranking to avoid
throwing away its best qualities; actual equips retain native eligibility.

After first salvage, repeat only when bag>90and stash≥450, bounded64salvage
actions, each with a nonempty protected-set difference. No game-storage change.
Re-run ordinary preparation after the first failed transfer; no replay/rewind
of combat or income. Preserve sameL30/64training/3nonwin/one-retry/600global/
20raw-hour/1200wall-second limits and all old ActII constraints.

Compute exact scrap yield independently from authored rarity yield and source
level bands. Require exact full before/after state: only selected stored items
removed, authored material added, ordinal+1 and exact receipt. Retain all
consumed payloads once, disjoint from remaining/discarded ownership. For strict
earned-income audit only, restore consumed payloads and subtract exactly those
conversion outputs; retain original six gem debit/transform compensation. Never
modify native reward deltas or the strict audit. Independent conversion review
checks exact outputs/receipts/protection/payloads, actual training XP/points and
actual next-ordinal retry. Record capacity or native errors, never bypass them.

Plan-review ready: the failure is a hoarding policy, addressed by the existing
public crafting action with explicit value conservation. Security-check pass,
local native diagnostics only; no source/data/dependency/permission/network/
save-format change. Root sole writer; noagents/installs/commits/push/PR/deploy.
Freeze source during run; verify wrapper/cache cleanup; retain packet as
umbrellaQA evidence, root cleanup owner. CIexcluded,Chromiumworks,playtestlater.
