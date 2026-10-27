# P16 — Avoid unused full-inventory crafting localization

Status: local source/native/production and whole integration pass; verified
retention/cleanup complete. Independent/full-v1 acceptance remains open. Root sole executor/author.
[Exact receipts and hashes](fixtures/inventory-crafting-localization/checkpoint.json).
[BUG316](../../../production/bugs/BUG-316-avoid-unused-crafting-target-localization.md)
was committed in be8c7537 before product correction6480ac15.

## Cause and correction

CraftingPanel prepared a target for every backpack item and translated the same
source label inside each mapping iteration, including the default Rune fusion
action, which has no equipment targets. Actual browser CPU profiles identify
that caller. Six bilingual regressions reproduce904unused origin translations
across material-only operation changes/update, and201identical origin translations
for201backpack targets. The original package-resolution failure ran no tests;
its output is retained separately from the six genuine REDs.

6480ac15 skips equipment preparation for rune fusion, gem fusion and gem
dismantling. Gear-target modes translate each source once. Recovery retains
item-specific quarantine origins. Native action preparation, exact inventory,
target selection/search/pages and live locale updates remain covered. Array
concatenation avoids argument-spread limits on retained over-cap stashes.

## Scoped verification

- Six causal REDs become GREEN; existing crafting and inventory paging give
 46PASS/three files,11.515s. Scoped strict types9.056s and explicit two-path
 lint8.921sPASS. The earlier off-repository prototype is distinguished from
 the byte-identical committed source.
- Ordinary production build13.224sPASS with VITE_E2E unset;762files/sixJS chunks,
 five bridge markers absent. All758precache entries/756distinct URLs resolve.
 Two duplicate icon URLs already exist in the baseline. The first auditor
 confused raw entries with distinct URLs; both versions and correction remain.
- Corrected production comparison4/4contexts, plus10/10required-size/locale
 cases. Every fixed context retains100rendered cards and exact import/export
 ownership. The ten matrix cases search/select the actual final item among
 24000normal caps, preserve the native source label, restore Rune fusion,
 check44px-high source controls and no document horizontal overflow.
- Zero captured page warnings/errors and no production bridge. All ten final
 original Inventory captures individually viewed/hashed, with their current
 scroll positions disclosed. Earlier harness screenshots are Settings after
 export and supply no Inventory visual acceptance. No new offline/Continue
 acceptance is claimed by this slice.

## Measured local comparison

Both runs use identical constructed save hashes, Chromium360×640 and the same
CPU sampling/click-capture protocol after the prior full checks terminate.
The measurement waits for actual Inventory mount and two animation frames.
Three observations per context are retained, including the small English
variation; no universal speedup or physical-device performance claim follows.

| Owned normal caps | Locale | Before median | After median |
| --- | --- | --- | --- |
|100|en|114ms|120ms|
|100|zh-CN|136ms|116ms|
|24000|en|236ms|119ms|
|24000|zh-CN|349ms|131ms|

The original pointerdown-frame metric fires before Inventory exists and its
driver timing includes profiler/file I/O. It is explicitly invalid for latency
acceptance; original reports/profiles remain. Actual CPU stacks still diagnose
the redundant origin-localization caller. Broader P16/F21 real-device/frame/
memory/log/full-loadout/soak and0.5sacceptance remain open.

## Integration and ownership

Original full checks completed at unchanged c882dfe6: **19935 tests/940files**,
two existing opt-in skips,1027.326s; full types139.318s and lint/purity236.326sPASS.
All2693repository/770external inputs and HEAD remain exact in each terminal
receipt, and were separately rehashed before retention and next repository edits.
This supersedes the earlier navigation total for this correction only.

All970archive members (969regular files/one dependency link) were read-back
verified by name/type/size/SHA or exact link target. Exact969files/one link/
17directories including rawroot removed; remaining[]/failures[]. Shared
node_modules target, worktree/source/history and shared caches preserved.
Original navigation retention-sort failure/script remains inside this archive.

Root retains these exact artifacts through independent/full-v1 consumers and
removes them only when those consumers finish:

- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-inventory-profile-gbqp4wuf-raw.tar.gz`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-inventory-profile-gbqp4wuf-raw-manifest.json`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-inventory-profile-gbqp4wuf-retention.json`

Archive SHA256: `82d10f36089415a934c29a455c651633600aae0efec67e27e5d95c539f1bb3d9`.
Raw task is absent. Archive paths in earlier scoped reports refer to members
relative to that removed task, and remain discoverable in the retained manifest.

Genuine protected compressed/raw hashes remain exact: L33, Ancients/Rite claimed,
nextNormal402, Baal uncleared. Inventory stays211bounded/oneunverified/onereview;
Cobra contract and Cold Mastery review remain. No genuine campaign/replay,
independent approval or remote action. Full private-v1 objective remains active.
