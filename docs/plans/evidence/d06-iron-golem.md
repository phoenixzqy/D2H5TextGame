# D06 v1d — Selected-item Iron Golem delivery evidence

Date: 2026-10-22. Bounded engine/store and bilingual Skills delivery follows
[the mechanic contract](../decisions/D06-iron-golem-v1.md) and
[ADR-004](../../decisions/ADR-004-selected-item-summon-commit.md).
This evidence covers imported functional scenarios. Earned acquisition/economy,
native identification, full D06/P09/P10 and private-v1 remain open.

## Delivered source

| Commit | Bounded behavior |
| --- | --- |
| `8067e1c` | Production recorded-wave authority and once-only settlement |
| `3c4741a` | Explicit combat recovery presentation |
| `e00e772` | Selected-item payment, original recording lock and new-wave integration |
| `886aa6c` | Shared pure item-adjusted current/next stat arithmetic |
| `8d59b15` | Live selection/receipt presentation and guarded actions |
| `eff24d4` | Receipt observation for mounted consumers |
| `4f72544` | Bilingual sacrifice explanation and outcomes |
| `192e810` | Guarded panel, including BUG074 action-time acknowledgement identity |
| `5e7b29b` | Persistent committed-skill sibling panel and base-only detail label |

Earlier v1d increments in the execution ledger establish authored metal metadata,
isolated item projection, ownership, exact-index debit and pure engine preparation.
The engine receives immutable scalar input; stores retain transaction authority.
Only one exact successfully committed backpack instance is removed. Failed/full
attempts preserve items, and accepted attempts consume their one-shot instruction.
Iron-eligible recordings keep their original successful or failed attempt on
replay. Other waves cannot introduce Iron by editing their current configuration.
Summons, selection and recording authority remain transient; SaveCurrent11 is
unchanged. Component/store tests retain failure/recovery/alias/rarity coverage;
the browser matrix below does not independently exercise every such branch.

## Production artifact and reproduction

The browser increment changes only its dedicated config, Node-config inclusion,
native spec, this evidence and the ledger. Product sources remain at
`5e7b29b8aff740a7ec425cb8ab51e03442b2749a` throughout both matrix runs.
`tests/native/iron-golem-native.spec.ts` is outside the default config's
`tests/e2e` directory, so the debug-enabled default server cannot collect it.
The dedicated config serves a separately prebuilt artifact, with one worker,
zero retries and no server reuse or implicit rebuild.

Retained evidence root (denoted ROOT below):
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-iron-golem-bc3r0les`.

```sh
VITE_E2E=false npm run build -- --outDir "$ROOT/dist"
D06_IRON_ARTIFACT_ROOT="$ROOT" D06_IRON_RUN_ID=<unique-run-id> \
  npx playwright test --config playwright.iron-golem.config.ts
```

Create a task-owned root with a `tmp` directory and use a fresh run ID; evidence
writes refuse overwrite. The original build receipt is `iron-browser-build`:
9.613 s, 600 modules, `index-BdT59sro.js` (1,341,224 bytes, SHA256
`9c5c2e9a011b8de94496778c2539268fa70b9f9188d4b696078c3b2e53675d8b`).
This is the tested artifact, rather than the preceding integration build's
`index-BnQMJlsE.js`. All 760 output files are fingerprinted. No emitted JavaScript
contains `__GAME__`; each native setup and reopened Continue page also asserts
that property is absent from `window`.

Environment: Linux/WSL2, Node24.21.0, Playwright1.59.1, headless Chromium
147.0.7727.15/revision1217. These are viewport and keyboard/pointer tests, not
physical-device, WebKit/Firefox, screen-reader or full PWA acceptance.

## Native walkthrough and independent oracles

Each fresh context creates a Necromancer through ordinary controls, selects the
locale in Settings and exports a native version11 save. A derived fixture is
then imported through the normal import dialog. Explicitly **unearned** edits:
L24; Iron6/Blood1; one point; only Iron slotted; core stats15/500/500/25;
life984, mana35 (or34), manaMax179; no equipped gear or fielded mercenary;
two identified normal backpack items, Short Sword and Chain Mail. Effective
dexterity/vitality cap at350. These stats support the actual next-wave scenario;
they establish no obtainable build, earned clear, affordability or balance claim.
The imported locale/core/mana/skills/combo/inventory are checked by native export,
and every fixture's JSON and SHA256 are retained.

| Cases per locale | Ordinary interaction and asserted outcome |
| --- | --- |
| Five layouts | 360×640,412×915,640×360,1280×800,1920×1080. Hover-only Iron has no controls. Committed Iron starts empty, unchecked and disabled. Choose Short Sword; literal current340/54/63 and next356/56/66. Hover/focus/Tab preserves the exact form and acknowledgement. Tab reaches acknowledgement then Arm; Enter arms. Enter/Space commit another skill; returning resets local controls while preserving the armed instruction. Arm/Clear change no inventory, mana or combo. |
| Two startup/save cases | At35MP, native Map Enter plays one visible Iron card and reports Short Sword sacrifice/35MP payment; export removes only Short Sword and preserves all other inventory. At34MP, refusal retains the entire inventory. Save/export keeps the live attempt. Arm Chain Mail, await exact Saved/已保存 status, close the page, open a new page in the same context and Continue. Instruction/attempt clear; saved inventory and locale remain. |
| One replay/next-wave case | Play Iron, pause incomplete W1, arm Chain Mail and establish the paid receipt before editing the combo. Remove Iron through Active Priority. Skills reports replay and locked recording while retaining the next instruction. Return to Combat: the same exact Iron card ID replays. Resume at4×, observe the completion countdown and actual W2. No Iron carries over; Skills reports not prepared, unlocked policy and no instruction. Short Sword stays absent, Chain Mail remains, and combo is empty. |
| One import case | After paid startup and arming Chain Mail, malformed version11 import preserves inventory, paid receipt and instruction. Successful import of the preconsumption backup restores its ordinary inventory and clears transient authority. A fresh unarmed recording with Iron still slotted reports not prepared and locked, retaining the complete backup inventory. |

There are18 tests total:10 controls,4 startup/save,2 replay/new-wave and2 import.
No source imports, store injection, debug fallback, forced finisher or bridge is
used. The browser checks payment presentation plus exact item changes; it does
not infer an exact persisted mana decrement from animated combat playback.
The W2 check permits ordinary settlement loot and does not assert an unchanged
whole backpack after settlement. Continue is inspected in Skills before any
new recording; revisiting Combat itself starts/resumes combat behavior.
Backup restoration demonstrates ordinary rollback, not anti-rollback protection.

## Validation and failure provenance

| Receipt | Result |
| --- | --- |
| `iron-browser-controls-probe` | No tests found: an anchored grep did not match Playwright's full test identity. Harness failure retained. |
| `iron-browser-controls-probe-v2` | One control case passed,7.437 s wrapper. |
| `iron-browser-matrix-v1` | 18 passed,105.319 s wrapper; spec then relocated to native-only directory. |
| `iron-browser-types-final` | Standard typecheck passed,15.504 s. |
| `iron-browser-lint` | Failed: new root config absent from explicit Node TSConfig inclusion. Inclusion corrected without excluding checks. |
| `iron-browser-lint-final` | Passed,41.813 s;85 engine test files satisfy purity scan. |
| `iron-browser-config-types` | Extra whole-Node-config compilation failed at unchanged `vitest.workspace.ts:75`: existing `maxThreads` type mismatch. File is byte-identical to HEAD; diagnostic retained and unresolved. |
| `iron-browser-config-types-direct` | New config's direct strict TypeScript compilation passed,1.640 s. |
| `iron-browser-full` | Interrupted without totals; exec session returned143, child npm exit and termination cause unobserved. Original metadata/partial log retained; no pass claimed. |
| `iron-browser-full-v2` | Unchanged full suite passed7259 tests/233 files,121.371 s wrapper (Vitest119.92 s). |
| `iron-browser-matrix-final` | Final native spec/config:18 passed,108.839 s wrapper, zero retries/skips and zero collected page/console warnings or errors, including reopened pages. |

Final matrix output SHA256:
`cd7da33d205b5663716ba11d90c1ba0954f7f4ce79c23120cb33651924d27734`.
Launcher NO_COLOR/FORCE_COLOR warnings are separate from browser-console results.
The15 s unit budget remains exceeded. Existing build chunk/Browserslist/precache
warnings remain; no validation threshold, assertion or hook was weakened.

## Layout inspection, retention and sign-off

DOM checks require select/buttons/clickable acknowledgement≥44px, select text16px,
no document/main/panel horizontal overflow, and each separately scrolled form
part entirely within the main scroller. The initial probe's whole-tall-panel
capture was clipped by the scroller and is excluded from readability evidence.
Final captures separately show rules, choice, current/next stats, acknowledgement,
actions and status, plus a full-viewport keyboard-focus image. Lossless contact
sheets stack original pixels without scaling.

Developer sign-off: root inspected all ten matrix-v1 contact sheets and all ten
focus images. Of80 final originals,75 are byte-identical to those inspected
images; root directly inspected all five differing final originals. The warning,
labels, values, buttons and focus ring are readable and unclipped in both locales,
including Chinese glyphs. Layout metrics and the two visual-review JSON receipts
retain exact cases and paths. This does not certify unrelated navigation glyphs
or the complete app's accessibility.

`iron-browser-support-manifest.json`, SHA256
`79a570fc1e40b6ab4868c998d24da244afe5ac8189e538e5f45bc3ac6ad6e3b4`,
binds421 retained browser evidence files,760 tested build files, helper identity,
environment, visual receipts and process evidence. All15 recorded descendants
from each matrix and all4 recorded full-rerun processes were verified absent.
This is a bounded recorded-identity check, not an exhaustive historical process
claim. No broad termination occurred.

Independent QA/test-evidence, TD/five-axis and producer sign-off are recorded in
ledger v1aw and the frozen review/publication manifests. Root retains the exact
`ROOT/browser-evidence/`, `ROOT/commands/` and manifests as required diagnostic
evidence for those reviewers and future plan acceptance. Root removes only the
frozen task-owned `ROOT/dist` and `ROOT/tmp` inventory after readers release;
the cleanup manifest records the result. Shared caches and installed CJK font
remain. The umbrella worktree claim continues for unfinished plan work.

Earned metal supply needs a separately frozen acquisition/discovery card; no
failed Moor/Den earned recipe is rerun or strengthened here. Native identify
does not exist. Prepared/conflict/publication-failure phases remain covered by
controlled tests rather than this browser matrix. Other corpse consumers,
Mage elemental identity, campaign/economy/balance, outstanding warnings and full
D06/P09/P10/private-v1 remain open. No remote action is authorized or performed.
