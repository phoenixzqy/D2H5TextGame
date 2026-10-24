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
