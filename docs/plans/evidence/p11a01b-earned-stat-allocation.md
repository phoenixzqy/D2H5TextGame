# P11a01B3 — ordinary earned attribute allocation

Status: accepted bounded B3; root/producer/QA final APPROVE/ADEQUATE. No full P11/C0–C4/G0–G7 acceptance.
Input1e9e582; B2 runtime0f7cdc0, B1da1153a. Product source/data unchanged in B3.
Root owns spec, intentional PWA allowlist addition, evidence and exact artifacts.

## Frozen recipe and observed pilot

Design/producer/QA approved plan before implementation. Production harness owns
port4395/build/preview; no test bridge, imported save, test-side storage writes, injected
module/lifecycle events, random retry, bonus reward or resource refill.
Date only T0=2026-10-20T12:00:00.000Z; native combat/30s checkpoint timers run.
Fresh ordinary Sorceress, free hire/field Inner Sight rogueL3, learn Fire Bolt1
with initial point, sole authored Fire Bolt and8empty slots. First Blood Moor
wave has8enemies; Skip→all dead/livinghero→W2 immediate Pause/Flee, no extra payout.
Native Save/status/read-onlyDB/export establishes earned baseline: L2XP60/565,
5stats/1skillpoint, core10/25/10/35, HP120/128,MP102/106,attack24/def23/AS125;
mercXP120/304. Loot is an observed persistence baseline, not a drop-table oracle.

Character is reached through native HUD. Four unique local +/-pairs and
Apply/Cancel have44px targets; staged additions do not change committed derived
Panel. Strength+1/−1 returns empty; native Tab/Space stage/remove additions, then
mixedDex1/Vit2/Energy2 exhausts draft pool. Full committed5points remain visible.

Explicit Save exists only on Settings, which unmounts Character. The mounted-
draft browser proof is an actual quiet-session autosave checkpoint: Date only
T1=T0+1000ms, then read-onlyDB polls for savedtimestampT1 with native timers.
Exact snapshot differs only timestamp and idleState.lastOnline; staged previews
remain mounted and full derived Panel unchanged. B2 unit tests separately prove
real export API while draft exists. Cancel uses native Tab/Space; subsequent
Settings explicit Save/status/export/DB equals checkpoint. A separate staged
point is discarded by navigation/remount, with another unchanged explicitSave.
These paths are distinct; no claim of clicking explicit Save while draft mounted.

Re-stage mixed draft; native ShiftTab/Enter Apply. Exact applied payload changes
only statPoints5→0, core10/26/12/37, maxLife128→132,maxMana106→109,
attack24→25,AS125→126,physicalDodge0.1→0.10200000000000001. CurrentHP120/MP102,
skills, XP, other stats, inventory, currencies, mercs, map, meta and formation
remain exact. All9localized derived UI rows+HP/MP verified before/after/reopen;
existing critDamage rendering2% is merely preserved, no global display acceptance.
Native Save/status/export/read-onlyDB exact. page.close→newPage fixedT1→Continue
restores exact fullpayload and locale, no offline reward fabricated.

Pilot passes browser pageerrors/consoleerrors[], productionbridgeabsent and no
overflow. Eleven extra viewport sizes reuse the earned character only on en
Desktop:320×640,360×640,375×667,393×851,412×915,640×360,768×1024,1024×768,
1280×800,1440×900,1920×1080. Each checks all10new targets≥44px/within viewport,
editor text≥14px, safearea nav class/padding and screenshot. Existing8link nav
at320px is outside editor44px claim. Root visually inspected active draft and
320px applied editor, readable with wrapped copy/buttons and no clipped editor.

## Pre-pilot amendments and preserved failure

Original spec2a671c5634ffd8dae75760bea84703e83368144001fdd59937cd03c2c66ce5e9
was preserved before producer found innerText capture vs textContent assertion.
All3wholePanel assertions now useInnerText:true; no compared values weakened.
Revised4b5320f377c63ca96ab6f9e49c04a2e050c0cd251798c0631c1edfb88922d9fb
preserved before QA required all9derived UI rows afterApply/reopen, beyond existing
HP/MP and exact full savedpayload. Literal localized helper added at earned,
applied and reopened. Frozen2698f1a8e5657fec950261890bcae2fa0b5ea899e01e6f04c66a7249032a8f47
independently reviewed before first pilot. All corrections precede browser run.

First pilot failed at fresh-name equality, before merc/combat/draft:17character
fixture Earned Attributes was truncated to16 Earned Attribute. Native source
CharacterCreate.tsx:42/:111 enforces1–16. Report01ee0cd4b35cbfde8c99557f3c5b8066f43692df7dea07b5e90b7ef907ee087f,
1unexpected/0skip/flaky/retry; case12.167/runner26.390/wall27.887s. Failed spec,
report/log/screenshot/errorcontext/trace preserved for independent review.
QA independently approved sole within-cap fixture rename to Earned Stats(12chars),
retaining complete equality and all gameplay/save/UI oracles; player name does
not affect area/time-derived seed. No runtime bug/tuning inferred; matrix was held until pilot review.

Current frozen specf4e72e467c6375ef0d3f5bca653da983c75c070ce21e3a41081536d6b97c8387;
config5d5365621bdf85f49f2272f94912c6f93176297f38501c66b2ed375fb10a7cdb.
Corrected pilot1/1 pass,0skipped/unexpected/flaky/retries; case44.577,
runner55.969/wall57.303s. Report7e1ad4fb6c8bc48af4fd7ccf01281a3bb3f8af47adea9563fd8555aefcfeb74b.
All37attachments decoded with byte/hash manifest. Fullpayloads fresh/configured/
earned/checkpoint/cancel/unmount/applied/reopened and screenshot/layout/error
observations retained. Failed attempt remains distinct; no hidden retry.

## Final matrix and font environment

The first matrix passed all four functional cases, zero skipped/unexpected/flaky/
retries, runner93.147s/wall94.459s. Report SHA256:
`7fa8d4413970d5c2d6c615cb3b779c15f088c6ce3a2b70e0ad8f35486dab8dc4`.
Its Chinese screenshots displayed missing-glyph boxes. Default
`fc-list :lang=zh family file` returned no font. This run establishes functional
behavior only; it does not establish Chinese visual readability.

Producer/QA independently approved a task-local font/config/cache and unchanged
matrix rerun. No application code, assertions, system/user font installation or
shared cache changed. Canonical notofonts/noto-cjk revision:
`f8d157532fbfaeda587e826d4cd5b21a49186f7c`.

- Font: `Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf`,16,437,364bytes,
  SHA256 `2c76254f6fc379fddfce0a7e84fb5385bb135d3e399294f6eeb6680d0365b74b`.
- License: `Sans/LICENSE`,4,301bytes,
  SHA256 `6a73f9541c2de74158c0e7cf6b0a58ef774f5a780bf191f2d7ec9cc53efe2bf2`.
- Download base: `https://raw.githubusercontent.com/notofonts/noto-cjk/`
  followed by the pinned revision and paths above.
- Task `fonts.conf` SHA256
  `c1083fc1e3a4bdefaee8d60e422fcf1c0f72a8f41edde752f841fdb8cbe4e681`;
  includes existing system/user font dirs and `/etc/fonts/conf.d`, adds task
  `fonts`, sets task `font-cache`. Per-process `FONTCONFIG_FILE` is inherited
  by Playwright/browser. Custom fc-list lists task Noto Sans CJK SC.
- Generic `fc-match :lang=zh` still returned DejaVu Sans; it is not evidence
  of a matching glyph. `fc-match sans:charset=4e2d` returned task Noto Sans CJK SC.

Final `font-matrix` passes4/4, zero skipped/unexpected/flaky/retries;
runner93.154s/wall94.443s. Report SHA256:
`b4bedf632a9ce2d952861758f2298e3856e5822fb15a7a59b47b9c1be2fa6162`.
All82attachments decoded with exact byte/hash manifest:37en desktop,15each other.
Root inspected actual Chinese active-draft desktop/mobile PNGs: Chinese labels,
wrapped help, preview values and Apply/Cancel are readable, with no tofu.

| Project | Viewport | Locale | Final case seconds | Attachments |
| --- | --- | --- | ---: | ---: |
| pwa-desktop | 1280×800 | en | 45.229 | 37 |
| pwa-desktop | 1280×800 | zh-CN | 35.761 | 15 |
| pwa-mobile | 360×640 | en | 35.110 | 15 |
| pwa-mobile | 360×640 | zh-CN | 35.479 | 15 |

All four browser error attachments are literal `[]`. Full earned→checkpoint→
Cancel/unmount→Apply→reopen payload equality assertions pass in each case.
Final representative active-draft PNG SHA256:

- zh desktop: `58574f89562f6d55a239b1bcfbd3204c2b6077380bb290e971185b0fe9eed40b`.
- zh mobile: `a0b3476250c4c447bedb9e7a652c2d6951b48878b9cd3f977aac00ff94825bf9`.

## Validation and limits

Full units pass2408/140files, zero pending; report SHA256
`90f0d9cff5bc723267c62f34de4db2fc8d6372181aaf24c38ccf553d1d8a4c15`.
Final source fixture rename validated by typecheck10.597s and explicit PWA
lint5.814s. Product source unchanged; full lint43.598s/purity51 passed.
Each production harness run built its own production bundle successfully.
Existing Browserslist/chunk/precache/NO_COLOR warnings remain. Unit37.061s
exceeds documented15s budget; no test/coverage threshold was weakened.
No simultaneous build and source-fingerprint unit/simulation run.

The640×360 tall-element screenshot has header/nav overlays obscuring upper
editor. Geometry passes, but unobstructed short-landscape visual acceptance is
not established. Existing320px eight-link nav has40px links; editor controls alone
meet44px. Character critDamage multiplier2 currently renders2%; preserving that
existing display is no correctness claim. Global i18n backlog, Den victory,
campaign/balance/full progression, G5 and full C0–C4/G0–G7 remain open.

## Exact commands

`RAW=/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-stat-earned-3jkw2_gj`.
Validation/browser commands ran from the claimed worktree. The relative
`python3 decode.py corrected-pilot` and `python3 decode.py matrix` commands ran
from RAW, where decode.py resides; the final decoder uses its absolute path
from the worktree. Below, `$RAW` is a display-only
substitution for that exact prefix, including Python decode paths. Logs include
failed attempts and routine warnings; SHA256 is over original log bytes.

| Label | Exact argv (shell-rendered) | Exit | Wall seconds | Log SHA256 |
| --- | --- | ---: | ---: | --- |
| baseline-cjk-font-check | `fc-list :lang=zh family file` | 0 | 0.015 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| cjk-font-check | `env FONTCONFIG_FILE=$RAW/fonts.conf fc-list :lang=zh family file` | 0 | 0.152 | `a3a7c0c6a62f4a8d03eb3d0bc33c1a64169a784960594444de3bc8b9779422e8` |
| cjk-font-glyph-match | `env FONTCONFIG_FILE=$RAW/fonts.conf fc-match -f '%{family}\n%{file}\n' sans:charset=4e2d` | 0 | 0.015 | `f8e2f221aa42a70444c2e1e0384522282451686fcd38252323dc68082f0e54f0` |
| cjk-font-match | `env FONTCONFIG_FILE=$RAW/fonts.conf fc-match -f '%{family}\n%{file}\n' :lang=zh` | 0 | 0.017 | `68df6593ddd0eb95d357c93fd11f2fba8a41a74c77e04710b02466dfd9a57a5d` |
| corrected-pilot | `env PWA_PORT=4395 PLAYWRIGHT_JSON_OUTPUT_NAME=$RAW/corrected-pilot.json npx playwright test tests/pwa/stat-allocation-earned.spec.ts --config=tests/pwa/playwright.config.ts --project=pwa-desktop --grep ' en$' --max-failures=1 --workers=1 --reporter=line,json --output=$RAW/corrected-pilot-results` | 0 | 57.303 | `9ae926ab1d5ffafe119604aced0950d4e2fc1f8b50e811274d14f6a005a9e6cc` |
| decode-corrected-pilot | `python3 decode.py corrected-pilot` | 0 | 0.047 | `a25b86ec29513a2ca7ea66b70989370640322dc9cd77e6418335369ea700aef3` |
| decode-font-matrix | `python3 $RAW/decode.py font-matrix` | 0 | 0.060 | `1a8c3ed642b588bbe7f749891b05f13d3a4bf50c316fea8eaa090e7ff49b8859` |
| decode-matrix | `python3 decode.py matrix` | 0 | 0.067 | `410ce66a85b19f870922677bde735722b7502da643f0c1a5b850e800b5761cb9` |
| final-lint | `npm run lint` | 0 | 43.598 | `64ef18bd16f812a048e5d016a57900763eaa6c02c2e7a32bb2a3cbbdaed0531f` |
| final-pwa-lint | `npx eslint tests/pwa/stat-allocation-earned.spec.ts tests/pwa/playwright.config.ts --no-ignore --max-warnings=0` | 0 | 5.318 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| final-typecheck | `npm run typecheck` | 0 | 9.957 | `53a6aa8b4a16237ddc596024409b40a8c8e29e9056c6757c6f5c4fba3b0a7f47` |
| final-unit | `npm test -- --reporter=json --outputFile=$RAW/final-unit.json` | 0 | 37.061 | `e943ecd68202fd94b0ecc7b15f3886f5ba61e24f1262cb1c23a5236e4f655334` |
| font-matrix | `env FONTCONFIG_FILE=$RAW/fonts.conf PWA_PORT=4395 PLAYWRIGHT_JSON_OUTPUT_NAME=$RAW/font-matrix.json npx playwright test tests/pwa/stat-allocation-earned.spec.ts --config=tests/pwa/playwright.config.ts --max-failures=1 --workers=2 --reporter=line,json --output=$RAW/font-matrix-results` | 0 | 94.443 | `44fde1159d9042d916bb9b68d9c373064864a05b092602ec1b4125c1d38f15ff` |
| matrix | `env PWA_PORT=4395 PLAYWRIGHT_JSON_OUTPUT_NAME=$RAW/matrix.json npx playwright test tests/pwa/stat-allocation-earned.spec.ts --config=tests/pwa/playwright.config.ts --max-failures=1 --workers=2 --reporter=line,json --output=$RAW/matrix-results` | 0 | 94.459 | `35f72b2b0242f2908bc69c94458205d6b811f9939c207d8efc83ea8e6119d3ad` |
| name-pwa-lint | `npx eslint tests/pwa/stat-allocation-earned.spec.ts tests/pwa/playwright.config.ts --no-ignore --max-warnings=0` | 0 | 5.814 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| name-typecheck | `npm run typecheck` | 0 | 10.597 | `53a6aa8b4a16237ddc596024409b40a8c8e29e9056c6757c6f5c4fba3b0a7f47` |
| pilot | `env PWA_PORT=4395 PLAYWRIGHT_JSON_OUTPUT_NAME=$RAW/pilot.json npx playwright test tests/pwa/stat-allocation-earned.spec.ts --config=tests/pwa/playwright.config.ts --project=pwa-desktop --grep ' en$' --max-failures=1 --workers=1 --reporter=line,json --output=$RAW/pilot-results` | 1 | 27.887 | `a9fe724beb11dcdc95966ff5bf416f6744b01865ce495ac6c0810578fe58ab52` |
| preflight-pwa-lint | `npx eslint tests/pwa/stat-allocation-earned.spec.ts tests/pwa/playwright.config.ts --no-ignore --max-warnings=0` | 0 | 5.412 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| preflight-typecheck | `npm run typecheck` | 0 | 10.081 | `53a6aa8b4a16237ddc596024409b40a8c8e29e9056c6757c6f5c4fba3b0a7f47` |
| revised-pwa-lint | `npx eslint tests/pwa/stat-allocation-earned.spec.ts tests/pwa/playwright.config.ts --no-ignore --max-warnings=0` | 0 | 5.074 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |

Final root/producer/QA review APPROVE/ADEQUATE. Both independent consumers
released all RAW retention before root removed exact RAW, task-owned dist and
node_modules/.vite; absence verified, port4395 closed, original checkout clean.
The versioned recipe, failures, hashes, commands and limitations remain here.
No broader acceptance or push authorized. Root worktree claim continues.
