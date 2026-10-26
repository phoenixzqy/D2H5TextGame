# D06 — Skeleton, Clay Golem and Revive bounded native/public verification

2026-10-26; test-only commit `6c4b2b58`. Existing gameplay is retained under the
[preparation](../decisions/D06-summon-preparation-v1.md),
[corpse](../decisions/D06-summon-corpses-v1.md) and
[body-data](../decisions/D06-necromancer-body-data-v1.md) contracts. These three
skills already create paid functional bodies; this increment adds missing
acceptance evidence rather than inventing new mechanics or awarding a family.

## Native behavior

`src/stores/basic-necromancer-summons-native.test.ts` adds21cases through actual
native player conversion and the real deterministic engine. Ranks1/6/20 verify
one startup payment, exact cap/body identity/stats, positive Physical damage
attributed to actual spawned IDs and exact target HP loss. A held hero/enemy
isolates summon damage; the unlearned control causes none. Inputs remain
unchanged and recorded/plain results replay identically. Unlearned, unslotted
and insufficient-MP cases deny bodies/payment; real later mana recovery does
not retry the refused startup batch. No refund occurs.

| Skill | One batch MP | Caps at ranks1/6/20 | Unmastered Life/Attack/Defense at ranks1;6;20 |
| --- | --- | --- | --- |
| Raise Skeleton | 15 | 1/2/3 | 112/25/14;162/35/19;302/63/33 |
| Clay Golem | 15 | 1/1/1 | 220/24/34;310/29/44;562/43/72 |
| Revive | 45 | 1/4/8 | 150/28/18;210/38/23;378/66/37 |

Revive's actual Skeleton/Mage prerequisites are present. These are explicit
synthetic level60fixtures with no Mastery allocation, not earned-build balance.
Related186tests/3files PASS35.734s, including the21new cases; strict full types
PASS120.220s and focused typed lint PASS8.784s. BUG269 preserves the original
9failed/6passed alias oracle; production deliberately retains authored slots
while normalizing learned rank keys. BUG271 preserves readonly fixture errors
and their correction through copied snapshots, without changing production types.

## Production browser path

All12contexts complete:3skills × en/zh-CN ×360×640/1280×800. The original
aggregate command exits1/191.736s after eight completed Skeleton/Clay contexts;
its Revive observer failed, so it is not counted as a passing12case command.
A corrected displayed-card-name observer separately passes all4Revive contexts
in80.285s. Both sets use the same unchanged production build and retain every
positive assertion. BUG270/272 record the proved setup and observer failures.

Ordinary UI keyboard allocation0→1→2, post-learning Active Skills slot selection,
rank1/20cap/cost previews and actual localized bodies/outgoing Physical logs
pass. Three/eight max-rank bodies are observed for Skeleton/Revive respectively;
Clay remains one. Twenty-four seven-domain Save-close-Continue pairs include
12actual activated-service-worker offline Continues. Sixty geometry checks
cover360×640,412×915,640×360,1280×800,1920×1080 with44px allocation controls and
no horizontal overflow. The production debug bridge is absent; zero console/page
errors are recorded in each accepted case. Transient summon identities are not
persisted after Flee. Exact payment/damage causality is native evidence; public
MP includes regeneration and is not used as an exact debit oracle.

Twenty-four of72successful-case originals were individually viewed: each skill's
en/mobile and zh/desktop rank1/20details, rank1body and rank20combat. The other
48remain retained without individual visual acceptance. Mobile Skeleton/Revive
details show long descriptions/caps while lower current/next rows and headings
are cropped; Clay's life/attack/defense are visible. Mobile battlefield captures
show only the scrolled portion, and desktop lower rows can also be clipped.
Rank20Revive desktop capture follows enemy defeat; the separate recorded DOM
sequence supplies exact8body/positive-damage evidence. Revive uses the intended
text fallback without a portrait. These observations do not establish full
art/accessibility/performance acceptance or unmeasured screenshot contents.

## Baseline, evidence and limits

The [checkpoint](fixtures/basic-necromancer-summons/checkpoint.json) verifies
125terminal log hashes, sixcommitted feature/test blobs,2557unchanged existing
non-doc inputs and762frozen build files. Frozen full18359/845/two existing skips
at `bdc747b8` predates the new21tests. It remains baseline evidence for unchanged
existing inputs; the21new tests are validated separately, not added to its
observed full count. Full lint/build/bridge/precache baseline is unchanged;
new test source has its own current strict type/lint checks. No extra full-suite
run or production build is claimed for this test-only increment.

Independent reviewer/QA/design, earned builds/balance/feel, C2–C4/fullG0–G7 and
complete privatev1 remain open. GenuineL33/nextNormal402/Ancients-Rite claimed/
Baal uncleared and both protected save hashes are exact. No genuine campaign,
replay, remote action or delegation occurred. Inventory reconciliation follows
verified lossless retention/read-back and exact task-owned cleanup; its receipt
and retained paths will be appended below. The umbrella goal/worktree continue.

## Final retention, cleanup and inventory reconciliation

All1588archive members were read back and verified against exact hashes/types.
Exact1559disposable files and29directories were removed; raw task, task-owned
dist and finished external helper are absent. Remaining[]/failures[]; no live
task command or preview server was found and no restricted process entries were
encountered by the final audit. Shared caches, source/history and the umbrella
worktree remain preserved.

Only after cleanup verification, exactly five skills (Wall, Prison, Skeleton,
Clay and Revive) receive bounded-functional status. Inventory now172bounded/
39unverified/one engine-only/one review-needed; Necromancer30/32. All208other
raw rows, header,213IDs and order are unchanged. The
[inventory/cleanup packet](fixtures/basic-necromancer-summons/inventory-credit.json)
records the exact before/after rows, counts, retained archive and receipts.
Historical checkpoint counts/active-retention statements above describe their
collection time and are superseded by this final closure.

Root retains these exact paths for BUG262–272 and full-v1 evidence consumers:

- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-bone-defenses-6z98386v-retained.tar.xz`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-bone-defenses-6z98386v-retention.json`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-bone-defenses-6z98386v-cleanup-manifest.json`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-bone-defenses-6z98386v-cleanup.json`

Raw receipt paths are retained as archive members under `task/`; served build
files are under `dist/`. The cleanup manifest maps every original path to its
member and hash. Root removes archive/sidecars when consumers finish. Archive SHA256:
`1280809a8b7f736d95d3dd90a7ca3f3591f137be624f22cfa0cbf6f039c0c5ed`.
This local verification does not close independent, earned-build, campaign,
C2–C4/fullG0–G7 or full privatev1 acceptance. Genuine save remains unchanged.
Next: complete Skeletal Mage and Iron Golem's individual native/public evidence;
no family-wide credit is implied. Goal/worktree remain active.
