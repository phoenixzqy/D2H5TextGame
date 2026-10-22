# D06 Mage direct-bolt native browser acceptance

Status: measured native browser matrix passes, 2026-10-22. This is the bounded D06 v1e direct elemental bolt
slice, not full Mage/statuses, earned progression, balance, D06/P09/P10 or
private-v1 completion.

## Scope and reproduction

The native production runner is `tests/native/skeletal-mage-native.spec.ts`
with `playwright.skeletal-mage.config.ts`. Build with `VITE_E2E=false` into
an explicit task-owned output directory, then set `D06_MAGE_ARTIFACT_ROOT`,
a new `D06_MAGE_RUN_ID` (letters/digits/underscore/hyphen), and an unused
`D06_MAGE_PORT` before `npx playwright test --config playwright.skeletal-mage.config.ts`.
The runner starts and stops its own strict-port preview, uses one worker and
zero retries, and refuses to overwrite per-case evidence. Browser evidence is
kept below `<artifact-root>/browser-evidence/<run-id>/`; temporary runner output
is below `<artifact-root>/tmp/mage-browser-<run-id>/`.

The matrix covers zh-CN/en at 360×640, 412×915, 640×360, 1280×800 and1920×1080.
Each case creates a native Necromancer, exports Save11, transforms only an
explicitly unearned rank/core/equipment fixture, then uses native Import, Skills,
combo selection, Map entry, Combat playback, Save, page-close and Continue.
Fixture scaffolding: L30, Mage6, Skeleton1 prerequisite, unslotted Mastery20,
core15/25/20/21, initial100MP and a rare cap with large survival/mana modifiers
and slow weak hero attacks. All other equipped slots are empty. This is no
earned campaign/balance or item-catalog claim.

The browser clock fixes Date at1792454400000 while native timers run normally;
the application derives its own area/time seed. No seed7 damage/target oracle,
store bridge, injected event or registered WAIT/FINISH skill is used. Assertions
require four native Mage cards, one startup22MP payment (100→78), the literal
bilingual direct-element/preparation prose and rank6/7 display rows, four
positive localized elemental bolt messages (including valid critical forms),
and native Save11 restoration. Actual messages/targets/amounts are retained
per case; browser logs share Mage names and do not expose source IDs. Engine,
store and mounted tests establish the ID/element/exact HP mapping.

Live playback resources are separate from the durable player before wave
settlement. Continue must match the actual before-close export; this evidence
must not claim that78 live MP persisted or that loading refunded mana.
Large-panel screenshots show only the documented visible intersection of panel,
main scroller and viewport. Individual cards and four individual elemental log
lines are scrolled into view and checked with full intersection before capture.
No claim that all four fit simultaneously on small screens.

## Results

Run `acceptance1` passed all ten cases, one worker, zero retries, in 2.7 minutes
(wrapper164.436s). This is an imported fixture result. Both languages passed
at each viewport:

| Viewport | zh-CN | en |
|---|---|---|
|360×640|16.3s|16.1s|
|412×915|15.9s|15.8s|
|640×360|16.1s|15.8s|
|1280×800|16.2s|16.0s|
|1920×1080|16.6s|16.2s|

Every case established four distinct native cards, live100→78MP, wave1, no
terminal/next-wave panel and enabled Skip after the second native pause. All
cases observed the following positive normal messages (localized in zh-CN):

|Element|Target|Damage|
|---|---|---|
|Fire|Fallen A|50|
|Cold|Fallen E|61|
|Lightning|Fallen B|61|
|Poison|Fallen C|50|

These are measured native-seed outputs, not seed7 target expectations. Cold
needed a later attack after an earlier dodge; the runner observed real timers
without stepping the store. The fixed Date causes display log times to remain
00:00:00; this is not attack-timing evidence. Exact1940/3880ms scheduling and
source-ID/type/HP attribution are covered separately by engine/store/mounted
checks. All ten retained `console-errors.json` files are empty. Node's separate
NO_COLOR/FORCE_COLOR warnings are present in the runner output.

Native Save→close→Continue retained the actual exported player, inventory and
formation, rank allocations, selected Mage combo and locale, with exactly the
eight Save11 top-level fields. No durable-live-MP or reward settlement claim.
The runner checked document/main/detail/allies-grid horizontal overflow and
specified touch targets. Each individual card and elemental log line passed
full viewport intersection before capture. Root inspected representative zh-CN
and en mobile detail captures, landscape logs and desktop startup grid. This
bounded evidence does not establish a complete accessibility or all-screen UX
audit, earned progression, balance, signature statuses, or full Mage acceptance.

## Retained evidence and identities

Artifact root (local retained diagnostic evidence; root task owner retains it
for future reviewers):
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-iron-golem-bc3r0les`.
Per-case screenshots, visible-part geometry, native exports, actual logs and
empty error diagnostics are below
`browser-evidence/acceptance1/native-Mage-<locale>-<width>x<height>/`.

- Runner spec:18607bytes, SHA256
  `1e92404e2c51af1ff1df1f299f8f2315ec7cec9e397c70d69809b21264fa1d41`.
- Config:1365bytes, SHA256
  `a79f7cce9fc8f404307d47204af9c01f488a409f4c4eb2d4dc5ebbe8fbbe5c52`.
- Tested production main chunk `index-BURmCSR0.js`:1343224bytes, SHA256
  `729627ee6da2023c32bdb1ffecab37c6e9f6f25f5fb3f28aa19b243184c5b92f`.
- Matrix output SHA256:
  `6f305700eaa69e52b0183fed57614a12d1f91ba13f46a06dbecc8168cf345567`.
- `mage-browser-support-acceptance1.json` binds the exact build and retained
  evidence; SHA256
  `7c2b25ac7d307280eef8f94aaa6d66a088ccb2f9c2e894061fadde221ebe9134`.
  All15 sampled command/browser/preview process birth identities were absent
  after Playwright closed. This is sampled ownership evidence, not an exhaustive
  historical-descendant claim.

The production page and reopened page had no `window.__GAME__`; build scans
found no emitted debug bridge. Final source/build identity checks, standard
validation, independent QA/test-evidence and TD/five-axis verdicts, publication
and exact disposable cleanup are recorded in execution-ledger v1bh and its
`mage-browser-{review,publication,cleanup}.json` manifests. Developer browser
validation: root,2026-10-22. Independent sign-offs belong to that frozen gate.

Historical probe1 is preserved: its expectation omitted the intentional next-cap
`4（无变化）` annotation and failed. The sole oracle correction used exact zh/en
annotations, then probe2 passed; no product, seed or acceptance relaxation was
needed. Probe1 failure screenshot/context and all original receipts remain
separate from acceptance1. Standard full-unit runtime and pre-existing bundle/
precache warnings remain tracked limitations; no performance-budget sign-off.
