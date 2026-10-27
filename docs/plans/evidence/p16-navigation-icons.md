# P16 — Font-independent, readable navigation

Status: local source/browser/full integration and verified retention complete;
independent and full-v1 acceptance remain open. Root sole executor/author.
[Exact receipts, source hashes and capture audits](fixtures/navigation-icons/checkpoint.json).
BUG[313](../../../production/bugs/BUG-313-render-navigation-icons-without-emoji-fonts.md),
[314](../../../production/bugs/BUG-314-equalize-mobile-navigation-hit-targets.md),
[315](../../../production/bugs/BUG-315-keep-navigation-labels-readable.md).

e7aeafcc replaces platform-dependent emoji with small inline SVGs for all eight
destinations, development tool and idle gear. Existing routing/localized names,
native link behavior/current-page announcement, focus ring and palette remain.
Two causal locale REDs become GREEN. Initial guessed labels/global-language act
warnings remain retained; corrected tests use real labels and isolated instances.

558c01f0 supplies equal-width links and the permanent production browser matrix.
Its original360px41.3125px target failure is preserved: flex children needed
`min-w-0`. A cold production worker's initial precache also required an explicit
`navigator.serviceWorker.ready` precondition before the unchanged activation and
real offline assertions. Original nine readiness failures/one pass remain;
readiness-aware10/10PASS69.334s is not full label acceptance.

b508e864 closes the full label constraint: below640px a four-column/two-row grid
gives complete12px names, from640px a row and from768px the existing rail. The
shell reserves actual navigation height in flex layout. The strict360English
label RED and padding-only9/10failure are preserved; eight45px targets could not
fit all complete labels. No translation abbreviation, smaller font or horizontal
scroll was used to make the result pass.

## Final bounded validation

- Focused shell/HUD:15PASS/two files,11.806s. Scoped strict types11.299s and
  explicit four-path lint10.585sPASS; browser files are explicitly included with
  `--no-ignore` rather than silently omitted by the repository's normal lint.
- Production build12.887sPASS, VITE_E2E unset;762files/sixJS chunks, five forbidden
  bridge patterns absent,756precache URLs all resolve. Existing size warnings
  remain, with no performance credit.
- Production10/10PASS71.111s: en/zh-CN ×360×640,412×915,640×360,1280×800,1920×1080.
  All80targets have complete labels, visible nonzero SVG paths, foreground and
  viewport bounds, at least44×44px hit areas and no horizontal page overflow.
  Actual widths90/103/80/63/63; portrait targets56px high and rail64px high.
- Native keyboard Tab/Enter, emulated mobile tap/desktop click, current-route
  announcement, save and ten actual service-worker offline Continues pass.
  Production bridge absent; zero page warnings/errors are required in each case.
- All30attachments decoded:10geometry records/20PNGs. All20original online/offline
  whole-viewport captures individually viewed and hashed. All four committed
  source blobs match the final measured browser input hashes.

Fresh full integration at6c57da63 passes19929tests/939files (two existing opt-in
skips),1056.547s; full types133.670s and lint/purity235.728sPASS. All2692repository
and766external inputs plus HEAD are unchanged and separately rehashed before
the next change. BUG313–315 are locally resolved in79ec0f7e. Original omitted
Vite/global declaration scoped-type errors and ignored-test-file lint warnings
are retained; explicit existing declarations/`--no-ignore` resolve them without
source suppressions or weakened assertions.

This verifies navigation on disposable fresh characters, not the whole app,
screen-reader/contrast/200%zoom, physical devices, performance, soak or earned
campaign/build balance. Main content still requires scrolling. Genuine protected
L33/Ancients/Rite/next402/Baaluncleared and compressed/raw save hashes are exact;
no genuine campaign/replay or remote action occurred. Inventory stays211bounded,
one unverified Cobra contract and one Cold Mastery review.

## Retention and continuing ownership

All3316archive members were individually read back and verified by name, size
and SHA256. After all original check and baseline-profiling consumers finished,
3316files/95directories including the exact raw task were removed; remaining[]
and failures[]. The raw task is absent, known owned PIDs are absent and the
registered worktree/shared caches are preserved.

Root retains these exact artifacts through independent/full-v1 consumers and
removes them after those consumers finish:

- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-nav-icons-xgw7t06k-raw.tar.gz`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-nav-icons-xgw7t06k-raw-manifest.json`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-nav-icons-xgw7t06k-retention.json`

Archive SHA256: `0591c5c814b7dede2ca1bcbbc2ddccdc8a0811589f46cfe2d34c0452b9f6a94b`.
Every original absolute task path in the checkpoint maps to its relative archive
member. An initial retention preflight compared two different path-sort orders;
all member hashes/file sets already matched and no cleanup had started. The
corrected preflight rechecked the same retained archive before exact removal.
Its original script/error metadata are retained in the continuing root-owned
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-inventory-profile-gbqp4wuf`
through the next performance slice; root owns its eventual retention/cleanup.
