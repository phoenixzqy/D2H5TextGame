# P07a03 — player Lightning Mastery acceptance

Status: the bounded authored, runtime, native, bilingual UI and production-browser path is delivered. Broader P07a, C0–C4 and G0–G7 remain open.

## Delivered behavior

[D05](../decisions/D05-lightning-mastery-v1.md) controls the authored contract. Definition/schema/rank `993e305`, compatibility-only preparation `2002326`, runtime `e5dc08d`, native verification `1818c22` UI `cf8e9fc` and browser `b1bfab6` preserve existing JSON tuning: Sorceress level30, +4% direct lightning damage per valid allocated rank, cap20/+80%. Only the maximum of the two exact allocated aliases counts once; legacy skills, combo membership, markers and invalid allocations do not infer a rank. Eligibility is separate and removed/ineligible composition emits explicit lightning0.

Warmth/Fire coefficients and recovery remain independent. Fixed direct lightning100 becomes104/180 at rank1/20; real seed7 rank20 Thunder Storm gives205/213/287/369 at Mastery0/1/10/20. A combined pipeline gives344; allied Thunder remains219. Other six damage types, Attack, resources, passive actions/payments/cooldowns/markers, RNG and Paralyze remain unchanged. The complete neutral87-event prepatch recording is preserved with explicitly fixed neutral coefficients; the old composer itself did not emit lightning0.

Ordinary allocation freezes the current recording and applies next wave. Explicit replay recomposes authoritative allocations over original pools and all three recovery-carry baselines, with existing fresh-input clamps and no accumulation/refill. Native serialization/validated import/store restoration is covered with only the disk-write boundary mocked; production disk acceptance is separate below.

Only Lightning's UI rank projection uses its exact allocation resolver. Both locales explain direct lightning, per-rank4%, cap20/+80%, level30 and unchanged Paralyze; rank1/2 show current4/8% and next8/12%(+4%). No passive appears in any of nine active combo slots.

## Genuine failures and corrections

- Schema RED70:32 behavioral failures/38 controls; missing-helper capability failure separately collected0 tests. Schema GREEN70/70.
- Pure runtime RED48/48 missing projection. Combat RED24:9 damage failures/15 controls. The real neutral prepatch capture passed independently.
- Native tests were immediately GREEN5/5 because the runtime boundary already worked; no native RED or new native defect is claimed.
- UI RED18:10 failures/8 controls, proving incomplete prose, legacy fallback, alias order, cap header and invalid-rank bugs. Several allocation/recording controls already passed.
- Capture draft203→205 corrected before execution because the hit consumes the first draw; the draft was never executed. Existing Warmth exact-map expectation gained explicit lightning0. Two lint-unsafe spy-return accesses were replaced by deep `toHaveProperty` assertions without weakening equality. The UI lint callback gained a block body without changing assertions or inputs.
- Browser draft v1 was not executed; v2 corrected only text-node whitespace around the exact next-rank delta. Actual attempt1 failed the fresh full-player oracle because the existing first Skills visit removes locked Frost Nova and normalizes learned Ice Bolt. The corrected oracle explicitly expects that sole combo change. Actual attempt2 timed out when a named Allocate locator disappeared during Tab preview of another locked skill. Final v5 probes the stable panel button and requires exact Lightning heading, Allocate text, enabled state and native focus before Enter. No injected focus, weaker rank expectation or product patch was used. All attempts and independently approved corrections remain preserved.

## Final serial gates

| Stage | Focused / engine / full Vitest | Types / lint / production bridge-build (seconds) |
| --- | --- | --- |
| runtime |233/8files;2133/75;4504/184 |11.952 /30.095 /9.266 |
| native |27/3files (5 new);4509/185 |11.696 /30.589 /9.052 |
| bilingual UI |62/2files (18 new);4527/186 |11.797 /30.810 /8.820 |
| final browser test bytes |2 browser cases,18 viewport samples,4 explicit save cycles |11.734 /30.055; reused the exact validated UI production build |

Full UI unit duration72.832s, engine runtime10.487s: existing15s full/3s engine targets remain missed. Commands finished serially with exit0, no wrapper stops/signals or skipped/pending tests. Existing build/Node color warnings remain. No new coverage or performance signoff.

## Production browser scope and limits

Both en/zh-CN use ordinary production UI with no `__GAME__` bridge or internal state injection. Fresh L1 Sorceress establishes the locked control; an explicitly imported L30/two-point save establishes eligibility while preserving fresh stats/gear. Real Tab/Enter allocates ranks1/2. Nine CSS viewports per locale:360×640,412×915,640×360,375×667,393×851,768×1024,1280×800,1920×1080,915×412. Action bounds≥44px, description font≥14px, no document horizontal overflow, exact prose/current/next values and all nine combo controls pass. Actual CDP reports Noto Sans CJK SC for39 Chinese prose glyphs. All18 exact PNGs were visually reviewed; screenshots capture scroll positions, not the whole page simultaneously.

Four explicit Settings Save/confirmed Saved → page close → new page → Continue cycles compare full player/inventory/merc/map/formation/settings. Export downloads are deleted. This establishes real IndexedDB persistence in the same browser context, not browser-process restart or autosave. Native damage is established by separate deterministic tests; imported eligibility does not establish earned campaign progression or balance.

[BUG-063](../../../production/bugs/BUG-063-skills-header-overlap.md) records existing fixed-header overlap at375×667/915×412. Cropped below-fold rows require scrolling and icon glyph boxes remain visible. Thus this packet does not certify full mobile/readability/accessibility, real devices, whole-browser coverage, campaign, performance or private-v1 completion. [BUG-061](../../../production/bugs/BUG-061-lightning-mastery-runtime.md) and [BUG-062](../../../production/bugs/BUG-062-lightning-mastery-ui.md) retain historical reproduction and bounded fixes.

## Durable evidence and cleanup

[Durable packet](fixtures/p07a03-lightning-mastery/packet.json) and its verified476-record [archive](fixtures/p07a03-lightning-mastery/raw.tar.gz) preserve11102994 original RAW bytes (archive4840684B, SHA256 `b554459ee63e1477cfddcd65048c387372c1574a7fc4ddec0d8a4d0942c08197`). The packet binds24 current source fingerprints and7626 absent PID/birth identities. QA and producer independently verified the whole packet and approved the exact manifest cleanup plan; all readers are released. After packet commit and fresh archive/manifest/source/process checks, root removed all476 exact RAW files11102994B and ten empty child directories; absence is verified with no cleanup failures. The retained RAW root is empty. Key RAW records: `runtime-final-gates.json`, `native-final-gates.json`, `ui-final-gates.json`, `browser-final-gates.json`, source freezes, all failed reports/corrections/reviews, complete neutral recording and `browser-lightning-v3-report.json` with embedded attachments. Eleven completed older reports are losslessly gzipped; `historical-report-compression.json` binds original/decompressed hashes and lengths.

Root retained exact evidence ownership at `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-lightning-mastery-6siwydfd` until archive verification and all readers released. All three task-local browser temporary subtrees have been removed after process checks; installed Noto and shared caches remain. After QA/producer final review and reader release, root rechecked7626 cumulative PID/birth identities and exact hashes, then removed761 final UI build/cache files40963097B and verified absence, no cleanup failures. Earlier compatibility/runtime/native outputs were likewise removed by exact inventories. Disposable RAW is now removed as recorded in the packet; the committed archive retains all bytes. Original checkout remains untouched, umbrella worktree claim continues, no remote action.
