# D04 — Necromancer direct bone and Poison spells

2026-10-26. Presentation `a0cf908b`; native/reapplication/public-cast proof
`c40fa1f1`. Root author review only. Four bounded local functional contracts are
verified; independent design/QA, earned builds, balance and private-v1 acceptance
remain open. [Contract](../decisions/D04-necromancer-direct-v1.md),
[BUG243](../../../production/bugs/BUG-243-show-necromancer-direct-spell-rules.md).

## Result and cause

Teeth, Bone Spear, Bone Spirit and Poison Nova now describe actual base damage,
recipients, mana/CD and typed mitigation in both locales. Nova exposes two
Poison stacks,5% of final hit per stack/s,5s duration and10-stack cap. The pure
periodic descriptor previously rejected all multiple-stack payloads. It now
accepts positive integral counts within the shared status cap, adds an optional
count only above1 and preserves exact one-stack objects and Bleed2 rejection.
Existing native mechanics already worked; no engine mechanic, game-data tuning,
allocation, dependency or save22 change was needed. Seeking/piercing flavor
grants no guaranteed hit or extra targets; Arcane already uses magic resist
rather than ordinary Defense.

| Spell | Rank1 base | Rank20 base | Mana / CD | Recipients |
| --- | --- | --- | --- | --- |
| Teeth | Arcane20–35 |96–111|7 /1s|First two prioritized living hostiles |
| Bone Spear | Arcane60–90 |193–223|20 /1s|One living hostile |
| Bone Spirit | Arcane110–160 |338–388|30 /2s|One living hostile |
| Poison Nova | Poison20–30 |96–106|25 /3s|All living hostiles; two Poison stacks per landed hit |

## Functional proof

Initial actual-registry/native60controls passed while37presentation assertions
failed: five pure Nova metadata and32bilingual unlearned/current/next/MAX cases.
One invalid-metadata control passed. Final new115tests comprise60native causal,
6pure display,32bilingual component,8native lifecycle/import and9paid Nova
reapplication cases. Earlier135/5focused includes37existing compatibility cases;
combined115/5passes12.503s and final strict fixture17/2passes8.417s.

Causal ranks1/2/20,seeds7/19/41/97 assert actual MP, recipients/damage, dodge,
Poison rate/expiry/integral, native class/level/prerequisite/rank authority,
insufficient MP/CD, typed mitigation, immutable inputs and recorded/unrecorded
replay. Eight real-store cases learn prerequisites, allocate rank2 without
changing the current rank1 recording, refresh rank/stats next wave without
refilling absolute HP/MP, cast/pay, and restore learned configuration through
actual snapshot/import while clearing transient combat. Only disk I/O is mocked;
large synthetic equipment/pools do not establish earned builds.

Nine real paid Nova cases cover damaging prior stacks1/8/9/10, cap/refresh and
original source/type/rate/start retention; marker promotion without retroactive
DoT; old Poison expiring exactly1700ms before fresh application; indefinite
legacy expiry; and two natural eight-cast sequences. Both reach cap10. Seed7
lands all8; seed19 misses at22100, does not refresh, expires23700 and starts two
fresh stacks at25500. Every accepted status and independent cumulative DoT/HP
integral is checked. Later stronger direct hits do not replace an active
Poison's original rate.

The initial fixture assumed fast native kills allowed next-wave Nova before
its carried cooldown and both natural sequences ended capped/with misses.
Diagnostic terminal failures disproved those assumptions. A synthetic speed25
uses the existing capped2000ms period, leaving targets alive until Nova is ready;
exact seed-specific cap/expiry/miss outcomes replaced the false assumptions.
Strict TypeScript fixture fields are omitted rather than set to undefined;
numerical test labels use String(). No gameplay rule/assertion/seed/retry/timeout
was weakened. [Correction record](fixtures/necromancer-direct/acceptance-fixture-corrections.json).

## Production browser proof and visual limits

16/16cases pass with zero retries in464.745s: each of four spells ×en/zh-CN
×desktop1280×800/mobile360×640. Each publicly creates a character, imports an
explicit synthetic L30 fixture with real prerequisites and only that spell's
priority, equips through UI, allocates19→20, observes its localized actual
combat action, completes Blood Moor, saves and continues both online and with
network disabled through the actual production service worker. This supersedes
the initial four combined-preview cases, which did not assert individual casts.

The raw report was independently decoded:16localized cast lines,32exact
six-domain save pairs,16actual offline Continues,80geometry checks across
360×640/412×915/640×360/1280×800/1920×1080,48px allocation controls, no page/console
errors or production __GAME__. [Metrics](fixtures/necromancer-direct/browser-metrics.json).

32final screenshots are retained in the raw archive. Four final originals were
inspected/copied beside metrics: desktop-en/mobile-zh Nova previews and
BoneSpirit victories. All16initial changed previews had also been inspected
through four lossless montages against unchanged production. Nova copy is
readable, but desktop lower rows are clipped; mobile sticky header/navigation
overlap tall captures and some lower fields are outside the image. Victory
captures show cropped loot/header and large black outer regions, so these images
do not establish a readable victory summary. DOM victory assertions and exact
saves are the functional proof. No whole-screen UX, accessibility or broad
performance approval is claimed.

## Terminal checks and provenance

[Receipts](fixtures/necromancer-direct/checks.json):

- Final full:17190passed/777files/two existing skips,exit0,710.167s.
- Engine:8484/317passes143.375s on unchanged production; final full includes it.
- Final types101.531s and lint/purity174.957s pass.
- Production19.047s/official bridge15.805s pass; actual756unique precache URLs,
  missing[]. Both762-file build manifests are byte-identical; browser uses the
  exact official artifact. Actual entry1403216bytes/data682786bytes stay below
  unchanged2MiB Workbox limit. Existing500kB/Browserslist/optional2.57MBart-manifest
  warnings and runtime budget misses remain open.

All1374frozen source paths, exact pre-commit HEAD/porcelain, both builds and
protected sources were reverified after full termination. All1374committed
blobs equal tested bytes. [Committed integrity](fixtures/necromancer-direct/committed-source-integrity.json).
Exactly four inventory rows change;209other raw rows and all213IDs/order remain
exact. Inventory153bounded/58unverified/one engine-only/one review-needed;
Necromancer11/32. [Inventory audit](fixtures/necromancer-direct/inventory-integrity.json).

Genuine compressed/decompressed hashes remain
3bbae6c0499844e7423574124326c65c616f8f3912a760aa913ea9eab410022c /
c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577:
L33,XP149261,nextNormal402,Nightmare0,Ancients/Rite claimed,Baal uncleared.
No genuine campaign/replay or remote action occurred. C2–C4/fullG0–G7,
30–50hour pacing/economy/endgame/all-class earned builds/privatev1 remain open.

## Retention and cleanup

Root retains the byte-verified decisive raw packet at
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-necro-direct-eza_lfus-retained.tar.xz,
plus sibling retention/deletion-manifest/cleanup JSON, until BUG243/full-v1
consumers finish. Exact disposable task outputs/builds are removed only after
all consumers terminate. [Cleanup and archive identity](fixtures/necromancer-direct/cleanup.json)
records actual results; this does not release the continuing umbrella worktree.

Cleanup completed:153regular archive members byte-verified;1782exact files/60directories removed;25recorded process identities absent, no live task consumers,remaining[]/failures[]. Archive SHA256:fe0445c8c2a6b2f01e6d616995ea8afadf01dcf95ee1acbbe86dab5babc21293. Root retains the archive and its three sibling JSON records for the consumers/removal condition above.
