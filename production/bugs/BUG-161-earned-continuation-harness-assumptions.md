# BUG-161 — Correct earned-continuation harness expectations

Severity: Low. Affected systems: task-local QA/browser harness and artifact audit;
qa-engineer responsibility. Status: corrected in retained task scripts; original
failure outputs preserved. No game-runtime defect or source change is claimed.

Environment: production source `59f2590`, runtime HEAD `39bce13`, Chromium
360×640, en; Python artifact audit. No supplied gameplay RNG seed applies.
Actual attempts369–375 use the genuine advancing campaign stream.

## Reproduction and observed failures

1. Run `prepare-native.mjs` clearing priority slots in ascending order. Removing
   a slot compacts the list; the script leaves Ice Bolt in slot3 and its exact
   priority assertion fails after the authorized gear/stat preparation.
2. Run `audit.py` comparing `player.equipment` directly to the inventory slot
   dictionary. An ordered array and dictionary cannot compare equal.
3. Run `forge-seals.mjs` recovering the actual Hammer after River374. Ordinary
   travel normalizes `a4-river-of-flame` to `areas/act4-river-of-flame`; an
   assertion expecting the alias fails after Recover, before Shatter or Claim.
4. Run `audit-final.py` requiring Wishstones to remain globally constant across
   genuine combat. Ordinary kills legitimately increase this balance.

Expected: assertions follow native list compaction, equipment representations,
canonical travel and earned currency income while enforcing exact transactional
costs and rewards. Actual: these four assumptions stop the runner/auditor despite
valid native state. Initial sessions97066,97348,3739,53357 exit1 with retained
reports/logs; the failures are reproducible from their scripts and snapshots.

## Correction and evidence

`prepare-native-resume.mjs` clears descending from the exact consumed stopped
save;95877 passes. `audit-v2.py` compares exact ordered dictionary values;
41954 passes. `forge-seals-resume.mjs` resumes the actual recovered Hammer and
accepts canonical travel;92081 passes without a second Recover.
`audit-final-v2.py` permits ordinary earned income while retaining exact
preparation, quest and failed-wave assertions;71721 passes135 exports and22
durable pairs. No consumed preparation, Recover or combat attempt is replayed.

The Forge reports also retain unused inherited descriptive `recipe.warmth=1`.
Actual controls/assertions/exports show rank3; `metadata-corrections.json`
records that correction without rewriting original reports.

Evidence: [campaign report](../../docs/plans/evidence/d11-earned-mephisto-and-act4-through375.md)
and its archive/raw manifests. All exact scripts, failed and corrected logs,
stopped snapshots and reports remain under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-static-field-27sv3iop/priority-preparation369`
through campaign/full-v1 consumers; root removes them afterward. The workaround
is to continue from the consumed native snapshot and correct the expectation;
replaying the original genuine action is prohibited.

## Follow-up through actual379

Two later diagnostic-only joint screens incorrectly request Ormus, then Jamella,
in Act IV. The product correctly refuses both with `wrong-town` before any
trials or genuine changes. `joint-screen-v3.mjs` reads the authoritative town
NPC from `src/data/respec.json` (Tyrael) and completes all96 projections, with
no qualifying candidate and no actual reset. The first new artifact auditor
also assumes Save/Continue filenames share a serial prefix. `audit-v2.py`
matches their normalized stage names and retains complete deep equality;47
exports and six durable pairs pass. Original failed scripts/logs remain in the
[new continuation archive](../../docs/plans/evidence/d11-earned-tyrael-and-river-through379.md).
Actual Tyrael blessing and attempts376–379 occur once; no failed diagnostic
request or audit is presented as a game defect.

## Follow-up through actual388

The next River runner correctly freezes and guards the genuine through379
input and launches actual380 onward, but one descriptive report `kind` string
still says through375/next376. The actual input path/SHA, plan, native ordinals
and all exports agree on380–388, ending level32/next389. Preserve the original
script/report and annotate the metadata error in the artifact audit; do not
rerun any action to correct prose. All54 waves and ten exact Continue pairs
are retained in the
[earned continuation evidence](../../docs/plans/evidence/d11-earned-river-through388.md).

## Act V400 preparation selector recovery

The first native Ancients preparation driver matched `#it-3yxk7-2` by
substring, returning five candidate rows before any glove transfer. The
actual ID is rendered in its own span; use exact text to select its parent
row. This is a driver defect, not an inventory or gameplay defect.
The original failed report and stopped export remain at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-ancients400-yg280ipi/native-preparation/`.
Three genuine actions already occurred: temporary head swap, one diamond
insertion, original head re-equip. Resume only from `007-stopped-native.json.gz`
(raw SHA256 `80a9a4f8e8d3dd9f45148e63b8c6b528ecc1d6139a89f59f21aea37cef9380fc`),
skip the completed head policy, retain the remaining exact policy. No combat
or quest action occurred. Never restart from the prior399 final.

The first recovery incorrectly reused the merc's standalone exact-ID text
selector for Crafting, where the ID is embedded in the item label. It stops
after the temporary glove swap, before the second diamond. Preserve this
second failed prefix too; resume from its own stopped export, skip the already
completed swap, and match Crafting IDs with a whitespace/end boundary. These
are separate selectors for the two observed DOM structures.

Artifact auditing also corrected two assumptions: the exchanged chest's native
`equipped`/`equipSlot` flags legitimately change, and a suffix glob for
`prepared-continued` also matches `merc-prepared-continued`. The corrected
auditor keeps immutable item payload assertions, permits only explicit native
transfer flags on the frozen moved IDs and exact diamond suffixes on the five
craft targets, and compares full normalized stage names. Original failures
are retained; no genuine action is rerun to repair an audit.
