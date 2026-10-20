# P08a05g — Ordinary production Amazon weapon authority

Date:2026-10-20. Status: root/producer/QA accepted bounded P08a05g.
Runtime head: `3bd6911`, accepted A–F plus BUG042 lifecycle fix.
Contract: [D04 Amazon](../decisions/D04-amazon-weapon-authority-v1.md).
Bug: [BUG041](../../../production/bugs/BUG-041-amazon-starter-weapon-authority.md).
This child adds only the production acceptance spec/config and evidence; no
runtime/data/locale/save-format changes. C0–C4/G0–G7 remain unaccepted.

## Ordinary route and independent oracles

Fresh Amazon through native creation at Date2026-10-20T12:00:00.000Z. Native
timers continue; no hidden grants, injected saves, storage writes, game runtime
imports or __GAME__ access. The two game imports in the spec are types only.
Ordinary exports are downloaded/deleted in finally; IndexedDB is read-only.
Attach error observers and fixedDate before navigation on all three pages.

Exact fresh player: level1/XP0/skillPoint1/rank1, legacy equipment empty,
canonical identified Training Bow attack13/requiredLevel1/bow/twoHanded;
attack35, life140, mana72, defense20. Starter id is exactly
starter-amazon-bow-1792497600000. Explicitly configure sole Magic Arrow in all
nine visible slots; hire the authored free Inner Sight mercenary.

First actual hero action: Magic Arrow26arcane, FallenA47→21/44.68%, MP72→67.
Independent seed arithmetic is authored35–50 roll38−defense12. Resume/Skip
first wave, assert all enemies dead and original hero alive, observe wave2,
Pause/Flee before another award. Award160XP produces L2/XP60,5items,75shards.
Set Date-only to00.055 and repeat exactly one first-wave victory; assert target
fallen-0-09f2, nextwave2/Pause/Flee. Second award180XP produces L2/XP240,
8items,158shards,statPoints5,skillPoints2,rank1. TotalXP340=100+240.

Fixed earned replacement: it-87zeo-7, items/base/wp2h-two-handed-sword,
normal, level2/ilvl2, persisted attack8, identified, affixes[], generatedName{}.
Its catalog requires level1/no attributes and sword/twoHanded, so eligible at2.
No probabilistic fallback or conditional candidate selection. Earlier Date00
ordinals0–3 yielded no replacement; the final two-timestamp route is frozen.

Bow Unequip through ordinary controls yields canonicalnull, one backpack bow,
attack24 and no MagicArrow options in all9slots; combo[] preserves learned
rank1/points2. Fresh battle has exact basic readiness then12physical to
FallenA42→30/71.43%, no Arrow cast, MP76. Flee before reward; whole payload
is unchanged. Restore same original through picker: option returns but removed
combo stays empty; explicitly select it again. Export equals earned baseline.

Sword backpack comparison shows current37/candidate32/delta−5; real equip
shows attack32 and removes option/combo again. Full expected state retains
all earned items, currencies, mercenary/formation/map/meta/quest domains,
rank and unspent points. Save→Saved, read-only DB and export all equal it.
Actually close page, open new page, Continue: full equality and locale remain.
Restore original bow, verify option returns without automatic combo, explicitly
configure. Attack37; fresh MagicArrow critical84arcane kills the same Date55
Fallen, MP71. Independent arithmetic: authored roll48*crit2−defense12=84.
Flee before reward; final Save/Saved and second actual close/newpage/Continue
preserve the entire restored expected state, nine slots and originalbow once.
Starter uniqueness covers canonical slots, backpack, stash and legacy array.

## Pilot corrections and evidence limits

Source/pilot independently established universal recovery before first action:
0.2*Energy15=3MP/s; speed125 gives1500ms firstaction; floor4.5=4MP fills
stored72 to L2cap76 before acting. Basic spends0→76, Arrow spends5→71.
InitialL1 starts at cap72 so initialArrow still67. Battle resource copies do
not write persistent playerMP; whole exported72 remains correct after abort.
Earlier draft72/basic and67/restored were wrong test oracles, corrected from
source and independently approved before final freeze. No runtime fix.

First fullpilot failed a strict duplicate modal name selector. Second reached
unequip then timed out because Character has no nav anchor; use ordinary
character-hud button. QA additionally corrected duplicate sword display name
to candidate-item-header and actual Chinese comparison label 攻击力. Third
confirmed12physical but exposed the omitted recovery. Fourth complete native
pilot passes1/1,0skip/retry, runner39.054/wall40.308s. Decoded attachments show
26initial,12basic/noArrow,84critical/death and full earned/saved state. All
numeric/save/reopen assertions pass. Producer/QA APPROVE readiness to freeze.

Root screenshot inspection found initial capture during the0.2s fadeIn;
exactly three screenshot calls now disable finite animations for clear visual
evidence. Reversing those options exactly reconstructs greenpilot spec SHA
fc18930e3c22f857a2d47765003cbf0f5079ad6a97807880fa22563e3ce61d9f.
Producer/QA independently approved this sole finaldelta without another
numericpilot. Existing comparison has local horizontal scrolling; document
no-overflow assertions concern the page, not complete UX/a11y acceptance.
Host fc-list:lang=zh is empty. Matrix supplies task-local NotoSansCJKsc-Regular
from https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf
SHA2562c76254f6fc379fddfce0a7e84fb5385bb135d3e399294f6eeb6680d0365b74b,
16437364bytes, via temporary FONTCONFIG_FILE/XDG_CACHE_HOME; explicit installed
PLAYWRIGHT_BROWSERS_PATH prevents lookup changes. No app CSS/assets changed.

First matrix at screenshot-only a90b6474 passed both desktop cases but both
mobile cases timed out after the sword-state reopen: the generic occupied
weapon tile center lands on nested Details at360px. Native snapshots show
the sword modal instead of the picker. The test now taps the visible Weapon/
武器 slot label, which bubbles to the outer picker handler; Details deliberately
stops propagation. No runtime defect or assertion was bypassed. Both restore
calls use this same locale-aware ordinary control. The corrected full matrix passed all four cases; exact results follow.

## Frozen validation and remaining scope

Final spec SHA256f76896f393b296b793da3c6d869eb24a3de3660fd23a5d6f9d67ea4085bdcc6c.
Config SHA25637020ea62dd1716d817bd8b72cd41e48b1e10722f8ec76f13de4ff851dcccf24.
Dedicated production config builds through check:test-bridge-shake, owns preview
lifecycle and disables retries. All cases require activated service worker,
absent __GAME__, no page overflow and empty warning/error/pageerror collection.

Accepted runtime3bd6911 already passed full/coverage2216tests/133files,
focused41/3,related22/2,T/L/purity51, and production build. Unchanged80%engine
coverage gate:63files,8102/8582statements,1892/2105branches,296/315functions.
UI/store changes are outside engine instrumentation. This test-only child
refreshes TSC/full lint/explicit ignored-PWA lint and native production build.
No source change justifies repeating engine/full coverage for this child.

Existing unit act/router warnings, engine/related/full timing overruns,
Browserslist age, >500kB bundle and unprecached2.57MB generated manifest remain.
Build/runner NO_COLOR/FORCE_COLOR diagnostics are distinct from browser console
collections. No campaign/economy/loot-distribution/otherclasses/fullskills/
performance/offline/whole-screen a11y or C0–C4/G0–G7 acceptance follows.
Ordinary-earned Frost Nova is next. No push/PR/merge/deployment.

Raw evidence was reviewed at
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-amazon-browser-iq1z4j5d
and included BUG042 shared evidence, decoded saves,
logs/reporters/screenshots, temporary font/config/cache and check.py. Root owns
cleanup of that exact root plus task-owned dist and node_modules/.vite.


## Final native matrix — frozen source

On 2026-10-20, final report started13:03:16.898UTC and completed in69.618s
(runner),70.948s(checker wall). Four expected passes; zero skipped, unexpected,
flaky or retries. Runtime remains3bd6911 and git diff -- src is empty.

| Locale | Project | Case seconds |
| --- | --- | ---: |
| en | pwa-desktop |28.410 |
| zh-CN | pwa-desktop |29.261 |
| en | pwa-mobile |27.772 |
| zh-CN | pwa-mobile |28.123 |

Exact invocation (RAW is the owned raw root above):

```sh
env FONTCONFIG_FILE="$RAW/fontconfig.xml" XDG_CACHE_HOME="$RAW/xdg-cache" \
  PLAYWRIGHT_BROWSERS_PATH=/home/felixzhao/.cache/ms-playwright PWA_PORT=4392 \
  PLAYWRIGHT_JSON_OUTPUT_NAME="$RAW/final-matrix-label-report.json" \
  npx playwright test --config tests/pwa/playwright.config.ts amazon-weapon-authority \
  --output "$RAW/final-matrix-label-results" --trace off --reporter=line,json
```

Report SHA25639023e6c7a3f255b187658de1a46545b6b29c1bd84feaa5a74dfc79124d704e2.
Checker result amazon-final-matrix-label-result.json and log
amazon-final-matrix-label.log record exit0 and exact expanded argv. All four
cases attach starter/preview/restored PNGs, opening/unarmed/restored literal
logs, earned-baseline and saved-sword fullJSON. Root decoded all32 attachments
under final-decoded, read all four literal groups and payloads, and inspected
representative en/zh desktop/mobile screenshots. Every initial26/MP67,
unarmed12 and restored84critical is present. For each saved phase, payloads match across viewport; the only en/zh
difference is meta.settings.locale. They retain the expected bow/sword swap.
Chinese font is legible; sword comparison shows37→32/−5. Restored mobile PNG
shows the equipment screen top rather than the below-fold weapon; the native
assertions independently verify the exact bow and all nine combo slots.
Hover tooltip overlays a header in comparison screenshots; numbers remain visible.
These screenshots and no-page-overflow checks do not grant complete mobile/a11y
or typography acceptance.

Final checks: npm run typecheck exit0/9.946s; npm run lint exit0/26.339s,
including purity51; explicit npx eslint tests/pwa/amazon-weapon-authority.spec.ts
 tests/pwa/playwright.config.ts --no-ignore --max-warnings=0 exit0/5.447s.
The final native webServer production build/check:test-bridge-shake also passed.
Raw labels: amazon-mobile-corrected-typecheck, amazon-final-lint,
amazon-mobile-corrected-pwa-lint. Frozen spec/config hashes above unchanged.
Independent producer [P08a05g-FINAL-PRODUCER] APPROVE and QA APPROVE/ADEQUATE; root independently accepts this bounded contract. All consumers finished and released cleanup holds.


Cleanup: root verified exact owned raw root resolved without a symlink, removed
it through pathlib/shutil, and verified absence. Port4392 is closed. Requested
source/tests/evidence and Git history remain. Task-owned dist and node_modules/.vite
under the claimed worktree are temporarily retained for the running Frost native
browser discovery; root will remove those exact paths after its consumers finish.
No shared cache/dependency cleanup and no push/PR/merge/deployment.
