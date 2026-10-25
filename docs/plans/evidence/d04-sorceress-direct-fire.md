# D04 — Sorceress direct fire attacks

2026-10-25; root sole writer/reviewer. Source/tests/contract `5ef31577`
deliver three bounded functional checks. Independent design/QA, earned builds
and balance remain open. [Contract](../decisions/D04-sorceress-direct-fire-v1.md).

## Actual attacks and feedback

Fire Bolt and Fire Ball each make one single-target attempt. Meteor now makes
one independent attempt per living hostile, including separated enemies and
overflow rows. BUG229 reproduced the authored box excluding three of twelve
targets and two of three separated targets. Production JSON and the illustrative
legacy builder now select the existing all-enemies resolver without a shape.
Strict Meteor identity/geometry validation preserves the existing optional
legacy secondary-Melt metadata opt-out. The other29Sorceress JSON object spans
are byte-exact. No damage/cost/cooldown/unlock/prerequisite/cap tuning occurs.

Fire Bolt30–45/+4 costs8MP/CD1s; Fire Ball70–100/+7 costs20MP/CD1s;
Meteor100–150/+10 costs50MP/CD4s. Each cast pays once. Fire resistance then
ordinary Defense mitigate the hit; flat MR does not. Landed hits apply shared
Burn/ignite for3s, up to5stacks, initially max(1,floor(final hit×10%)) DPS per
stack. Active refresh preserves the original rate/source, adds/caps stacks and
extends expiry; expired Burn restarts with the new potency/source. Periodic
HP loss has no second mitigation. Meteor applies Burn then30%/3s Armor Melt
after its own direct hit. Existing follow-up mitigation/expiry behavior remains.

Both languages show actual damage/payment/Burn and Meteor targeting/Melt at
current/next/MAX. Screenshot inspection additionally found BUG230: missing
shared combat status translations showed raw armor-melt. Add the existing
Armor Melt/护甲熔毁 names to both combat resources, with literal log regressions.

## Verification

133added tests cover registration/schema/display28, native causal combat73,
real allocation/next-wave/import6, bilingual React24 and shared log translation2.
Actual recipients/HP/MP at ranks1/2/20 and seeds7/19/41/97 use an independent
numeric oracle. Cases cover misses, payment/refusal/cooldown, Fire resistance
and Defense, native Fire Mastery4%per rank, criticals, friendly/dead/lethal
boundaries, exact periodic loss/rate preservation/stacks/expiry/minimum1DPS,
immutable inputs, exact replay, runBattle and resource/status playback parity.

Native checks cover class/unlock/transitive prerequisites/ranks/aliases,
current-recording isolation, next-wave adoption without refill and actual import.
Fire Bolt retains existing governed canonical priority; valid alternate rank
aliases remain legal. Save22 and the genuine campaign save are unchanged.

Earlier engine7961/297, corrected loader/registry/Melt compatibility428/4,
causal/native79 and UI44 pass. The compatibility fix is covered by the final
full run. Final typecheck, full lint plus final changed-TS lint, production build
and actual-output precache checks pass. Existing large-bundle and generated-art
manifest cache warnings remain; required application scripts/styles are cached.

The final quiet full passes15743tests/715files/two existing skips, wrapper
590.434s. All180then-recorded task PIDs are absent and4512closed before it
starts; no browser/build/compiler/lint overlap occurs. Frozen1453source/config/
test/contract files and761build assets remain exact after the run. Actual
committed Git blob IDs match every frozen source path.

## Public browser and persistence

All four delivery groups exit0: en/zh-CN ×360×640/1280×800 ×three skills
=12cases. Public character creation/export/import uses declared syntheticL30,
legal prerequisites, a resource helmet and fixed Date.now. Each skill allocates
1→2, sets normal priority, enters combat and shows its public cast, MP decrease
and enemy Burn; Meteor must additionally show localized Armor Melt without the
raw ID. No browser store bridge is used. These fixtures prove mechanics and
public flows; earned campaign/build/pacing acceptance remains open.

24exact ordinary five-domain Save-close-fresh-page-Continue pairs and12actual
network-disabled fresh-page Continues pass.60five-size geometry checks show
zero horizontal overflow and allocation targets≥44px.36screenshots are retained;
four final views were individually inspected: English Fire Bolt mobile, English
Fire Ball desktop and Chinese mobile/English desktop Meteor combat. Lower
mobile detail rows scroll; existing missing navigation glyphs remain. Full
accessibility acceptance remains open.

## Failures, retention and limits

Targeting/schema/UI/translation REDs and actual terminal receipts remain.
Corrections retain strict Ajv required/property checks and existing loader
compatibility. Tests corrected a valid Fire Bolt alias, authored Fire Mastery
rate, strict TypeScript event/optional-property typing and the stale box assertion.
The guessed loader path found no tests; actual loader292cases is used afterward.

The pilot harness expected raw Fire Bolt priority; it now observes the intended
canonical governed ID. Four provisional Meteor browser cases failed because a
synthetic+50000MP helmet regenerated to full before observation. Reducing only
that diagnostic bonus to+500 preserves the MP-decrease assertion and game tuning.
A complete intermediate matrix passed before screenshot review found BUG230;
delivery groups are rebuilt/retested after the translation fix. All failures
and provisional evidence remain distinguished from current final proof.

Five diagnosed failure trace ZIPs were compacted after byte verification:
original trace/network/stacks entries and per-member hash manifests remain in
metadata ZIPs; redundant downloaded asset bodies were omitted. Separate failure
screenshots, reports, exact saves and failing harness versions remain. Original
ZIP hashes/bytes and compaction results are in trace-compaction.json. Full
original trace ZIPs are not retained.

The first broad full run additionally found two obsolete exact Fire Bolt prose
expectations in the existing shared SkillsScreen test. Its two failures and
actual interrupted child return code-15 (SIGTERM; wrapper241) are retained. Only the four verified owned
test PIDs were stopped. Updating the exact en/zh expected sentence preserves
all damage/current/next/delta assertions; shared44+new24UI cases and changed
lint pass. The final source freeze differs from the browser delivery freeze
only in this existing test file. Production/build/genuine inputs remain exact;
the complete quiet full is rerun against that final test state.

[Packet](fixtures/sorceress-direct-fire/packet.json),
[terminal checks](fixtures/sorceress-direct-fire/terminal-results.json),
[browser audit](fixtures/sorceress-direct-fire/browser-audit.json),
[save pairs](fixtures/sorceress-direct-fire/save-pairs-audit.json),
[committed source](fixtures/sorceress-direct-fire/source-delivered.json),
[inventory](fixtures/sorceress-direct-fire/inventory-audit.json) and
[cleanup](fixtures/sorceress-direct-fire/cleanup.json) retain delivery evidence.
Only Fire Bolt/Fire Ball/Meteor gain credit;210other CSV rows and all213IDs/order
stay byte-exact. Totals131bounded/80unverified/one engine-only/one review-needed;
Sorceress15/30. Root author review only; independent/earned acceptance remains.

Genuine Ancients/Rite remainsL33/XP149261/nextNormal402/Nightmare0/Baal uncleared.
Its decompressed SHA256 remains
c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577.
C0/C1 retain their original narrow exits. C2–C4, fullG0–G7,213skills, two earned
builds/class,30–50hour pacing, economy/endgame and complete privatev1 remain
unfinished. No genuine campaign or remote action occurs; the umbrella goal,
worktree/branch/claim stays active.

Sorceress direct-fire retention/cleanup terminal:663raw archive members and55terminal command receipts retained and verified. Cleanup removed1424current exact task files, including761build assets. All184recorded PIDs and all11recorded browser profiles are absent;4512closed,scratch absent,remaining[]/failures[]. Shared caches/tools, source/history, retained evidence and the umbrella worktree/branch/claim remain. Independent/earned/full-private-v1 acceptance stays open.
