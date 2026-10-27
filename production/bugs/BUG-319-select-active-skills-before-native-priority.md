# BUG-319 — Select the Active Skills tab before native priority preparation

Status: Fixed in dc127c38 (retained native-arreat408-r2.mjs correction and complete genuine evidence). Task harness issue; product source unchanged; independent/full-v1 acceptance remains open.
Severity: Medium — native campaign automation stops safely; manual tab selection is available.
Build: 048be7c0, ordinary validated production assets from 8fc0ae32; product inputs unchanged.
Environment: bundled Chromium, 360×640, en, loopback production preview. No engine seed applies: no combat was launched.
Owner: root native QA/browser driver; frontend product code is not implicated.

## Reproduction

1. Import the authenticated current earned next408 save through Settings and verify its ordinary public export is exact.
2. Open Skills, which initially selects Skill Tree.
3. Query skills-active-panel comboboxes without selecting Active Skills.

Expected: the driver explicitly opens Active Skills, waits for its nine priority selects, then performs the frozen free priority change.
Actual: zero selects are mounted while Skill Tree is selected; the nine-select assertion stops before any selection or combat entry.

Evidence: root task `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-arreat408-blizzard-oclab459`, immutable `native-arreat408/report.json`, `failure.png` (individually viewed), `stopped-export.json.gz`, and `native-attempt1-receipt.json`; original handle94646 consumed terminal exit1. Launches[]; priority preparation absent; stopped export is byte-equivalent JSON to the original earned save (raw SHA256201d9651127398bb9e261aa6cddac3901859c115a85c589808789501b2c12a74). Browser temporary paths absent.

Root cause: the driver assumed an inactive tab panel existed. `src/ui/Tabs.tsx` mounts only active content; `SkillsScreen.tsx` lists Skill Tree first. Workaround: select the observed Active Skills tab.

## Correction plan

Preserve the complete original attempt and manifest. Use a new driver/output directory, import the exact stopped genuine export, click the observed Active Skills tab and verify aria-selected before querying nine selectors. Keep original qualification, gameplay assertions, source/assets, first-nonwin policy and resource costs unchanged. Do not retry any consumed gameplay action; none occurred in this failed attempt. Verify the prepared public export differs only in the declared comboOrder, then Save-close-Continue before launching408. Root-authored validation does not imply independent acceptance.

## Corrected checkpoint

Explicit Active Skills selection/aria-selected and nine-select checks pass.
Prepared public export differs only comboOrder;20durable pairs and176saved
barriers pass through19complete challenges/114victories to earnedL35/next427.
Original failure/zero-gameplay stopped export and both drivers remain in the
root-owned archive linked by [campaign evidence](../../docs/plans/evidence/d11-earned-arreat408-continuation.md).
Product/test/config2693 inputs and762ordinary build assets remain exact. The
source app and gameplay assertions were not changed or bypassed. All original
handles consumed;1359member archive/readback and exact raw-task cleanup pass.
Root-authored result; independent/full-v1 acceptance remains open.
