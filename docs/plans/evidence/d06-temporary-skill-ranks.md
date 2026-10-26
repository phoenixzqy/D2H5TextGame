# D06 — Temporary effective ranks, first BUG241 increment

Status: rank/composition dependency implemented and verified locally at
`318ed060`. Battle Command is still reproduced and unfinished. No new skill
credit, independent acceptance, earned build or campaign completion is claimed.
Root is the sole author/reviewer.

## Change and causal evidence

At baseline `34355f8e`, six causal tests failed: explicit temporary bonus1 left
learned endurance, matching weapon mastery and personal warcries at rank1/20.
Three unlearned/foreign/locked controls passed. The original assertions were
retained; all nine then passed after the implementation.

Shared `effectiveLearnedSkillRank` now accepts a resolved positive integral
learned rank and an explicit nonnegative integral bonus. It permits20->21,
keeps unlearned ranks zero and ignores malformed/unsafe bonuses. Allocation
resolvers still perform their existing exact-alias MAX and authored cap before
the bonus; no saved map, permission or prerequisite is raised.

The existing endurance, six weapon mastery, Shout/Orders and Iron Skin
composers accept the optional input. A single `composeBarbarianPassives`
projection feeds native hero composition. Native baseline multiplication and
addition order remain unchanged. Native composition deliberately does not read
an imported `temporarySkillRankBonus` player field as paid authority.

Examples at allocated20 with bonus1: Stamina life1.63x; Speed attack speed1.21x
and physical dodge.105; Natural Resistance+42points and magical dodge.105;
Sword damage+.63/crit+.105; Shout defense+.63; Orders life+.84/recovery+.21;
Iron Skin defense+.84. Matching weapon, class and existing level gates still
apply, and removing the explicit bonus recomposes the original result.

## Verification

- New rank/composer tests:56/3files PASS, including all six mastery curves,
  aliases/alternate authored cap, invalid bonus boundaries, eligibility,
  frozen output, caller purity and repeated recomposition. One additional
  native regression rejects an imported temporary-bonus field.
- Full engine:8406/313 PASS;176.97s Vitest/178.405s process.
- Final typecheck:PASS100.709s. The initial148.759s pass started before the
  final native guard was added, so a final check was run after that addition.
- Repository lint/engine purity:PASS219.108s.
- Production build:PASS22.799s. Actual755-URL offline-precache guard PASS;
  five final JS chunks pass the test-bridge scan with positive/negative scanner
  controls. Both scanner records are retained. The later record mistakenly
  described the initial patterns as overescaped; direct positive-control
  revalidation proves the initial patterns were already valid. The repeat added
  explicit positive/negative controls. The compact diagnostic correction
  supersedes that mistaken explanation. Existing large-chunk, Browserslist-age and generated
  art-manifest precache warnings remain; no budget or limit was relaxed.
- Full unit:16932passed/762files/two existing skips PASS;
  868.31s Vitest/869.901s process. No retries, assertion weakening, new skips or
  timeout changes. This includes the final native guard and the existing
  native warcry/mastery/Iron Skin composition and causal battle regressions.

All12 frozen changed source/test/contract paths match committed blobs at
`318ed060`; the761-file disposable build was byte-verified before cleanup.
The inventory and genuine-save hashes remain exact.

No player-facing change is activated, and no production browser/earned-balance
claim is made for this dependency increment. Actual Battle Command requires
its separate paid party-effect/native/UI/persistence verification.

## Scope, review and next work

[Contract](../decisions/D06-temporary-skill-ranks-v1.md) records the eight-section
rank boundary and author design/security/plan review. Author code review found
no open finding for this increment; it is not independent approval. There is
no schema, authored data, dependency, CI, save22 or durable player-map change.

BUG241 remains open. Next: decide/review the full paid-buff contract, then wire
actual caster/allied grants and effective active/specialist/corpse ranks,
passive application/removal with life/recovery handling, paid snapshots,
expiry/death ordering, native wave carry, bilingual UI and production saves.
The generic damage-rank getter alone cannot satisfy these requirements.

Inventory remains148bounded/63unverified/one engine-only/one review-needed;
Barbarian29/30. The genuine Ancients401 save retains decompressed SHA256
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`:
L33/XP149261/nextNormal402/Nightmare0/Ancients-Rite claimed/Baal uncleared.
C2, C3/C4/fullG0-G7, all-class earned builds, pacing, economy, endgame and
privatev1 remain unfinished. No remote or genuine campaign action occurred.

## Task artifacts

[Compact evidence packet](fixtures/temporary-skill-ranks/packet.json),
[terminal receipts](fixtures/temporary-skill-ranks/terminal-results.json) and
[cleanup](fixtures/temporary-skill-ranks/cleanup.json).

Retained raw archive:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-battle-command-ranks-retained-_3nc9mxo.tar.xz`.
SHA256`517cf77651826840a1af581e1a65796fd32708bb4f4ba6a111d163c85ec460ea`;
79636bytes,35regular members, all byte-verified. Root owns it and removes this
exact archive after the original RED/scan diagnostics and BUG241/full-v1
acceptance evidence consumers finish. The raw archive retains the mistaken scan
diagnosis; [this correction](fixtures/temporary-skill-ranks/scan-diagnosis-correction.json)
records the direct revalidation and supersedes the explanation only.

Scratch`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-battle-command-ranks-4sotuf64`
is absent. Exact cleanup removed1336files/17directories, including761build
files,540task-local compiler/temp files and35archived evidence duplicates.
All10 recorded process identities are absent, no task-environment consumer
remains and no process was signalled. Remaining disposable paths[]/failures[].
Shared caches, retained earlier archives, source/history and the active worktree
are preserved. The umbrella goal and worktree claim remain active.
