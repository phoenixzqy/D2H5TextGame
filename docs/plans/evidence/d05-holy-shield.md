# D05 — Holy Shield paid defense and absorption

2026-10-25. BUG199 is locally repaired and verified. Root is the sole writer
and author reviewer; independent design/QA and earned class/build balance remain
open. This packet credits one skill, not the whole Paladin class or complete v1.

Runtime/native commit `1c94a78`; presentation/contract commit `36fc086`.
[Contract](../decisions/D05-holy-shield-v1.md),
[bug](../../../production/bugs/BUG-199-holy-shield-inert-defense.md),
[packet manifest](fixtures/holy-shield/packet.json).

## Behavior and repair

The old generic self-buff handler paid for a permanent marker but consumed
neither authored coefficient. Real native rank1/20 causal tests first failed:
Physical1000 against ordinary Defense100 caused900HP loss at either rank despite
a paid cast. The same assertions now pass with879/492HP loss: +4%/+80% ordinary
Defense followed by floor(2%/40%) absorption. Mana pays35/31 once; base stats and
input/replay bytes remain intact. Those resources/timings are synthetic fixtures.

Holy Shield now consumes its existing JSON tuning through independently copied
validated primitives. Native class/unlock24, cap20 and full Smite→Charge chain
govern a transient rank; exact aliases combine by MAX. Living original hero and
source-bound paid state establish power. Bare markers, foreign roles, malformed
ranks and contradictory registered effects/costs cannot grant power or take mana.

Ordinary Defense participates in the existing mitigation/debuff calculation.
Absorption follows mitigation and precedes Energy Shield/Bone Armor. The shared
direct/periodic/reflection/Static forwarding path reports separate Holy prevention;
periodic cumulative quotas exclude pre-cast damage and preserve partition/lethal
timing. Shatter remains lethal. Native classes cannot ordinarily combine Cyclone
and Holy Shield; trusted synthetic layering tests exercise exact ordered quotas.
The Static forwarding branch is wired, but no native hostile Static/Holy pairing
is claimed. Ordinary RNG, reward provenance and existing status potency remain.

Run-long paid carry refreshes current legal rank only at a fresh wave boundary;
class/reset/prerequisite loss removes power. Paid buffs do not recast. Fresh runs
and imports are unpaid; current recordings and original-resource replay remain
unchanged. No HP/MP/max-resource refill, saved paid state, save-version/migration,
dependency, CI, timeout, global rate or skip change. Save22 remains controlling.

The contract explicitly adapts shieldAbsorbPct to deterministic all-damage
absorption, following the existing Cyclone model. No block statistic, chance,
finite capacity or shield-equipment requirement is authored. Both locales now
explain this adaptation, lifecycle and actual current/next/MAX defense/reduction;
combat logs/chips identify the real positive buff. This is provisional v1 tuning,
not canonical D2 blocking or earned balance acceptance.

## Verification and provenance

| Check | Actual result |
| --- | --- |
| New focused coverage | 68 passed across6files: definition/schema25, engine23, causal2, native lifecycle6, bilingual UI8, prevention logs4. |
| Engine | 7,440 passed /267files;92.094s wrapper. |
| Full `npm test` | 14,226 passed /629files; two existing skips;481.414s wrapper. |
| Typecheck / standard lint | Both terminal0. Engine purity check passes. |
| Explicit `VITE_E2E=false` build | Terminal0; all four JS chunks pass forbidden-bridge scan; all756precache references exist. |
| Production browser | en/zh-CN×desktop/mobile4/4 terminal0; public19→20 allocation/configuration, localized positive chips and actual positive prevention logs. |
| Persistence | Eight separately audited exact player/inventory/map/mercs/formation Save-close-new-page-Continue pairs. No paid payload saved. |
| Geometry / inspection |20five-size samples, allocation>=44px/no horizontal overflow; eight screenshots retained and individually inspected. |
| Frozen input audit | All1,359source/test/config and760build hashes, HEAD/Git state and genuine digest exact through final full run; audit precedes staging. |
| Committed source audit | All1,359actual HEAD blobs and disk bytes match tested inputs at36fc086; build/genuine hashes exact. |

Files: `src/engine/skills/holy-shield.test.ts`,
`src/engine/combat/holy-shield.test.ts`, `src/stores/holy-shield.causal.test.ts`,
`src/stores/holy-shield-native.test.ts`,
`src/features/skills/SkillsScreen.holy-shield.test.tsx`,
`src/stores/eventToLogI18n.holy-shield.test.ts`.

[Raw archive](fixtures/holy-shield/raw.tar.gz):128files/26terminal receipts,
each member byte-verified. Original native HP RED, missing-definition import RED
and12UI/log RED assertions remain. The missing-module result is not offered as
behavior proof. First Chinese-mobile invocation omitted the script and failed
before browser launch; corrected invocation preserves fixtures/assertions and has
its own terminal0 receipt. Initial build predates the translated chip; final
tested production build includes it. Existing assertions were not weakened.

The same raw packet retains a separately described
[Conversion reproduction](d04-conversion-repro.md), including the disclosed first
output/receipt filename collision and detailed synthetic repeat. Conversion is
still broken and receives no credit. Its source hashes match the frozen/committed
source; no Conversion runtime change was made.

## Credit, limits and cleanup

[Inventory audit](fixtures/holy-shield/inventory-reconciliation.json) preserves
213IDs/order. Only Holy Shield gains functionality credit:98bounded-functional,
113unverified, one bounded-engine-functional and one review-needed. Conversion's
row gains reproduction/risk links only. Paladin29/30; its remaining skill is
Conversion. Independent class/build and earned balance acceptance remain open.

Genuine claimed Ancients/Rite save remainsL33/XP149261/nextNormal402/Nightmare0,
Baal uncleared. Decompressed SHA256 remains
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
No genuine campaign action, push, PR, merge or deployment.

All consumers are terminal. [Cleanup](fixtures/holy-shield/cleanup.json) verifies
1,648exact task-owned disposable files removed, task scratch absent, owned
previewPID647027 absent/4485closed, remaining[]/failures[]. Older retained roots
are preserved; no shared cache or worktree removal. Umbrella claim/branch/goal
continue. C0/C1 keep their original narrow acceptance; C2–C4/fullG0–G7, other
skills, earned builds/Baal/pacing/economy/endgame and independent acceptance remain
unfinished. Existing mobile scrolling/occlusion/icon fallback, test-loop/device
performance and full accessibility/PWA acceptance remain open.
