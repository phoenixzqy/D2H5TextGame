# Mobile pagination trial rejected — 2026-11-03

The20-card mobile pagination candidate is rejected and restored. It passes
functional/save/accessibility/responsive checks but fails all three mobile
performance adoption thresholds frozen before measurement.

| Matched production transfer measurement | Baseline | Candidate |
| --- | ---: | ---: |
| Desktop ms |119.220209|128.156484|
| Mobile CPU4 samples ms |277.551972 /266.948921 /274.450711|245.995214 /240.180122 /234.358279|
| Mobile median ms |274.450711|240.180122|
| Mobile long tasks ms |103 /80 /85|78 /97 /80|

Median improvement12.486974% misses15%; median remains above200ms and long tasks
exceed50ms. Desktop stays within baseline+30ms. No timing retries or acceptance
criterion changes. Initial v1/v2 candidates stopped on the real focused-opener
`aria-hidden` warning before mobile measurements. BUG632 fixes that separate
cause; v3 is the sole complete candidate round with that fix.

Both locales pass all five required sizes, selected-card resize reachability,
keyboard paging, all20mobile cards in the actual accessibility tree, final
Backpack/Stash reachability, exact bulk counts/localized previews, nested focus,
complete public/native save comparison and zero console errors/warnings.
Four candidate screenshots were visually inspected. These are localhost CPU4
observations, not representative-device or full release-budget acceptance.

Exact rejected runtime/test source is preserved in the root packet as
`bug592-mobile-pages-rejected-source.json`. Hook and pagination tests restore
byte-for-byte from `bug592-mobile-pages-v1-before.json`; only the page-size call
block is restored in InventoryScreen, keeping BUG632's independent focus fix.
Final28affected cases/types/lint pass. A separate two-context final-production
focus/save check passes without repeating timings; see
[focus evidence](../plans/evidence/dialog-entry-order.md).

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Retain `bug592-mobile-pages-v1-{plan,baseline,before}.json`, v2/v3 plans/drivers/
reports, trace/profile/map/screenshot evidence, `bug592-mobile-pages-rollback.json`
and `bug632-final-closure.json`. Terminal v3 session74444 exit0 means the driver
completed functional measurement; it does not mean the performance gate passed.
Exact source manifests/save hashes authenticate all compared inputs.

BUG592 remains Open; no campaign or formal balance progress. All consumers
terminal and exact task-owned disposable configs/build/cache removed/verified.
Root retains required evidence and human2 through umbrella review and owns
cleanup/release; no agents/install/commit/push/publication/CI.
