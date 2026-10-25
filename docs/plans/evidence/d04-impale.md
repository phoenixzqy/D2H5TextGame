# D04 — Actual Impale Bleed and ordinary Defense bypass

Status: fixed and verified locally in runtime `229f0d2c` and presentation
`1d1eca0f`. Root sole writer and author reviewer; independent design/QA and
earned balance remain open.

[BUG202](../../../production/bugs/BUG-202-impale-inert-bleed-and-defense.md) and
[contract](../decisions/D04-impale-v1.md) precede source changes. Existing
Physical75–110/+7rank,10MP,2second cooldown,unlock12/cap20 and complete
Jab→Power Strike chain are preserved. New literal-true `ignoresDefense` metadata
follows the existing flat-MR bypass architecture: closed JSON schema, typed
registered effect, one shared damage-input override for this hit only. No target
stat mutation, guaranteed hit, resistance bypass, new saved field or global
mitigation/potency change. Explicit10% final-hit/s Bleed is provisional v1
potency, not earned or canonical balance evidence.

## Native causal proof and compatibility

Original16-case native reproduction has12landed hits with Bleed markers but
zero periodic events/HP loss; Defense100 also reduces direct hits despite the
existing bilingual bypass promise. The same reproducer now passes. For seeds
7/19/41/97, Defense0 and100 have identical hits and actual periodic HP loss:

| Rank | Direct hits (seed7/19/41/97) | Total Bleed HP (same seeds) |
| --- | --- | --- |
| 1 | 77 /86 /0miss /82 | 21 /24 /0 /24 |
| 20 | 210 /219 /0miss /215 | 63 /63 /0 /63 |

Additional native ranks1/2/20, paired Defense0/100/500, exact replay and immutable
inputs prove complete per-hit bypass without changing target stats. Ordinary
Jab still loses damage to Defense and gains neither Bleed nor bypass. The
three-second lifecycle ends4700ms after the1700ms cast; repeated applications
refresh one stack and preserve an already captured rate. Resistance, critical,
increased damage, ordinary combo, one-DPS minimum, personal Bone Armor
capacity, reflected damage against caster Defense, caster/target death ordering,
dead/multiple target exclusion, mana/cooldown refusal, exact cooldown boundary,
class/unlock/rank/transitive prerequisite/MAX-alias authority and existing-wave
allocation isolation are covered. All fixtures are synthetic, not earned play.

New cases:62/3files, comprising36native,18schema/registration/display and8UI.
Original source RED:15failed/16passed; original bilingual UI RED8failed.
Final focused62/3 and compatibility165/8 pass. Data/registry/validator234/12,
engine7517/271, strict types38.574s, full lint87.833s pass. Production build
VITE_E2E=false passes15.342s; four JS chunks are bridge-free and all756precache
references exist. Final full passes14394/640files with two existing skips,498.865s wrapper
(Vitest497.51s). No full run was interrupted for this mechanic.

Two fixture assumptions were corrected: seed7 can beat the ordinary5% minimum
hit chance, so the paired physical-dodge test uses seed19 with a verified landed
zero-dodge control;1700ms cadence has no action at3700ms, so exact2second cooldown
uses500ms cadence and casts500/2500. An optional-property assignment and unsafe
nested matcher/unnecessary optional chain were corrected under strict types and
lint. Original failures and the deliberately stopped superseded lint remain
retained. No skipped/weakened assertion or interrupted full run claims a pass.

## Production browser and persistence

All4production cases pass: en/zh-CN×1280×800/360×640. Public creation/import,
rank1→2allocation, active configuration and actual localized Bleed log/chip
work. Eight Save-close-new-page-Continue pairs preserve all five player,
inventory,map,mercs,formation domains exactly, including both rank allocations.
Twenty geometry samples cover360×640/412×915/640×360/1280×800/1920×1080 with
no horizontal overflow and checked Allocate controls>=44px.20screenshots are
retained;8individually inspected. Mobile description and lower rules are
accessible by ordinary scrolling; real localized Bleed is visible on the target.

Inputs explicitly import a synthetic L30 Amazon and large-resource helmet.
Combat Date.now is fixed at2026-10-25T12:30:00Z; timers remain ordinary. No test
bridge or private-store injection. Native actual HP assertions establish damaging
Bleed; browser chips alone are not causal proof. Existing icon fallback/fixed
bars and full accessibility/PWA/device-performance gates remain open.

## Final source proof and remaining acceptance

All1372source/test/config, two controlling design and760build hashes plus
HEAD/genuine stay exact through the final full run. All actual committed source
and design blobs and disk bytes match the tested snapshot at1d1eca0f. The
separate Jab reproduction source map matches those same committed bytes.

Inventory keeps213IDs/order and credits only Impale:101bounded-functional,
110unverified, one engine-only and one review-needed. Amazon8/30locally bounded
plus one engine-only is not earned class/build acceptance. Jab receives only
reproduction/contract links and stays unverified; other211rows stay exact.

Genuine claimed Ancients/Rite remainsL33/XP149261/nextNormal402/Nightmare0,
Baal uncleared; decompressed SHA256 remains
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
C0/C1 keep narrow acceptance; C2-C4/fullG0-G7, remaining skills, earned all-class
builds,30–50hour pacing/economy/endgame and independent acceptance remain open.
Root sole writer, local only; umbrella goal/worktree/branch/claim stay active.

The separate [Jab reproduction](d04-jab-repro.md) confirms one actual attempt
per paid cast despite both locales promising repeated hits. Its contract and
reproduction confer no functionality credit and do not change the frozen source.

[Raw archive](fixtures/impale/raw.tar.gz),
[member manifest](fixtures/impale/packet.json),
[committed-source audit](fixtures/impale/committed-source-audit.json) and
[cleanup receipt](fixtures/impale/cleanup.json) retain final proof and failures.
All162raw members/24terminal receipts are hash-verified. After all consumers
finished, cleanup removed922exact task-owned files; the scratch root and all
51recorded owned PIDs are absent,4489closed,remaining[]/failures[]. Older roots
and shared caches remain preserved. Umbrella worktree/claim remain active.
