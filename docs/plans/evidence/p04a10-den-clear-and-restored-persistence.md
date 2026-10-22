# P04a10 — Native earned Den clear and restored-checkpoint persistence

Runtime head `331e737` wins all four Den waves in the production browser at
360×640, settles the canonical clear, completes Akara talk, and claims the reward.
The fresh-run test then fails an incorrect mercenary-XP expectation. A separate
public-Import-Save continuation from its exact earned preclaim export passes
claim-once, Save, new-page Continue,360×640 and1280×800 state checks. These two
runs do not constitute one uninterrupted passing fresh-run persistence test.

## Fresh route — strict failure preserved

Exactly one attempt, workers1/retries0, exit1/no-timeout: wrapper175.985s,
test150.424s. Frozen [spec](fixtures/p04a10-den-earned-clear.spec.ts.txt),
[config](fixtures/p04a10-den-earned-clear.config.ts.txt), and
[machine result](fixtures/p04a10-den-earned-clear.json) preserve the failure.
All40earned BloodMoorW1 preparation steps pass without build/gear/seed changes;
Den W1–W4 each assert victory and counts9/10/11/3, heroXP270/400/770/210 and
mercXP202/300/577/157. Canonical clear/farm availability, carried ally identity,
actual item/currency awards and quest objectives pass. Akara talk changes only
quest readiness. The claim is disabled after activation; actual export differs
from the expected full save only in mercXP1485→1860.

That375XP is correct: `claimReward.ts` shares quest XP with fielded mercs, and
`claimReward.test.ts` already expects375 for Den's500XP reward. The test oracle
omitted this existing behavior; no gameplay correction or new bug is claimed.
Original Save/reopen assertions were not reached. Browsererrors[].

The exact unmodified earned `den-talk-no-award` attachment is preserved as
[preclaim checkpoint](fixtures/p04a10-den-preclaim-earned.json), SHA256
`f64a602e464b9b2393c091f3ef415fbb0a5371e0e80892d2475d3506a0403aaa`.
It has L6hero1717XP/0skillpoints, merc1485XP, Den cleared and both quest objectives
complete, rewardClaimed absent. Formatting differs from the raw attachment;
parsed content is identical. No synthetic claimed save was reconstructed.
Preparation uses DesktopChrome1280×800; Den/talk/claim stage uses360×640viewport,
English, same DesktopChrome context. This is not touch-device or zh-CN coverage.

## Separate earned restore continuation — PASS

Exactly one attempt, workers1/retries0, exit0/no-timeout: wrapper77.696s,
test74.599s. Frozen [spec](fixtures/p04a10-den-earned-claim.spec.ts.txt),
[config](fixtures/p04a10-den-earned-claim.config.ts.txt), and
[machine result](fixtures/p04a10-den-earned-claim.json) bind the earned input hash.
PublicHome→Settings→ImportSave imports that exact export; read-only IndexedDB
and new exported full-save equality pass before claim. No placeholder character,
combat/farming/boss, hidden store call, storage injection or changed game input.

Claim changes exactly heroXP1717→2217, skillpoints0→1, mercXP1485→1860 and
rewardClaimed=true. Full save equality proves other domains unchanged. A repeat
Akara interaction leaves claim disabled and the full exported save unchanged.
Save flush, stored/export equality, page close, fresh pageContinue and exact
continued-save equality all pass. Both pages explicitly assert360×640;
continued map clear/farm and claimed quest/nooverflow/production checks pass.
An explicit1280×800 transition preserves clear badge, nooverflow and full-save
identity. Browsererrors[]. Screenshots were inspected at mobile/desktop sizes.

The actual committed export is the retained
[claimed earned checkpoint](fixtures/p04a10-den-claimed-earned.json), SHA256
`b022aa436d30b9102528995f6f5c2419000f682df84d18d6c18321547e2faa35`.
It equals actual claimed and new-page continued exports. Use this genuine earned
checkpoint for subsequent C1 progression work instead of repeating40fresh farms.

## Validation, retention and remaining scope

Runtime source already passed8381tests/263files, typecheck, lint and production
build in331e737. Each installed native spec/config passes typecheck and exact
one-test discovery. Repository lint intentionally excludes `tests/**/*.ts`;
two original focused lint invocations reported ignored-file warnings rather than
linting candidates; this is disclosed in raw receipts. No linter configuration
was changed or bypassed. No runtime changed between build and either native run.
Post-run verification found all1358fresh/1359continuation inputs and760dist
hashes unchanged; executable candidates were subsequently removed with exact
executed bytes retained in fixtures. Recorded processIDs were absent and both
preview ports closed.

QA approved exact executed bytes of both cards before execution. Producer approved
the fresh card before three explicit viewport assertions were added, and approved
the exact continuation bytes; readiness records that distinction. Final outcome/
publication review follows. Raw reports, screenshots, original
failure trace, source snapshots, manifests and process/command receipts remain
root-owned at these exact roots through C1/umbrella evidence consumers:

- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-first-elite-r7una0p6/den-native-clear`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-first-elite-r7una0p6/den-earned-continuation`

Root removes retained raw evidence after those consumers finish. Task-owned tmp,
service cache, borrowed dist and executable candidates are disposable after
readers/processes finish; cleanup receipt is recorded in the execution ledger.
Shared pre-existing tool caches are preserved. Full ActI/Andariel/XP pacing,
all-class campaign, C0–C4 and G0–G7 acceptance remain open. Next: reviewed ActI
finite earned-entry and boss-power contract; no boss attempt has been qualified.
