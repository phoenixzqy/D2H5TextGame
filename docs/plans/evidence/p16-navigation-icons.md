# P16 — Font-independent, readable navigation

Status: local source/browser checks pass; fresh whole-unit/static integration,
final retention and independent acceptance pending. Root sole executor/author.
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
- All30attachments decoded:10geometry records/20PNGs. All ten original online
  whole-viewport captures individually viewed and hashed. The ten offline PNGs
  are retained/decoded but have not been individually viewed. All four committed
  source blobs match the final measured browser input hashes.

Full integration is next; the preceding19,927whole-unit result predates the two
new navigation tests. No new whole-suite total is claimed. Original omitted
Vite/global declaration scoped-type errors and ignored-test-file lint warnings
are retained; explicit existing declarations/`--no-ignore` resolve them without
source suppressions or weakened assertions.

This verifies navigation on disposable fresh characters, not the whole app,
screen-reader/contrast/200%zoom, physical devices, performance, soak or earned
campaign/build balance. Main content still requires scrolling. Genuine protected
L33/Ancients/Rite/next402/Baaluncleared and compressed/raw save hashes are exact;
no genuine campaign/replay or remote action occurred. Inventory stays211bounded,
one unverified Cobra contract and one Cold Mastery review.

## Continuing task ownership

The exact active root-owned task is
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-nav-icons-xgw7t06k`.
It contains originals, configs, build manifests, decoded images and required
whole-check logs. Original handles will be recorded in `whole-processes.json`.
Do not restart a live check or edit source/HEAD while it consumes frozen inputs.
Root retains this task for whole-suite/final evidence consumers, then owns
archive/readback and exact disposable cleanup after all consumers terminate.
No cleanup is claimed yet; shared caches and the registered worktree stay intact.
