# P07b02 — selected player Might acceptance

Status: the narrow None/Might path is implemented and independently reviewed;
full P07b, C0–C4 and G0–G7 remain open.

## Delivered behavior

Authored definition/rank `fb9a1f5`, historical-save preparation `b10561f`,
v10 migration/validation `ccee350`, explicit store selection `e1c976d`,
pure runtime `3e4f159`, native wave integration `53e2dc6`, and UI `c159e5b`.
Only allocated eligible selected Might applies: +3% physical damage and +1%
Attack per rank, capped20. Basic Attack100 gives104/192 at ranks1/20; fixed
physical100 gives103/160. Exact living source hero and fielded living merc
receive it at any position; missing/dead source suppresses, stun/freeze does not.
Selection/rank freeze per wave. Replay recomposes current configuration over
original immutable resources/carry, applying existing clamps to fresh inputs.
No paid action, extra RNG, permanent stat mutation, stacking or refill.

The native radio selector saves None/Might, retains unavailable canonical imports
until cleared, and calls only selectAura. Learning/detail/combo do not select.
The full native recording is unchanged during select/clear. Both languages show
honest timing/recipients/suppression and separate allocated-rank bonuses.

## Reproduction and final checks

Preserved actual pure RED:26 tests,10 damage failures/16 controls; separate helper
44 capability failures/188 controls. Native RED:15 tests,9 missing-projection
failures/6 controls (not reached damage failures). UI RED:18 tests,12 failures/
6 controls;8 stop at missing fieldset,2 missing prose,2 alias/rank display.
Assertions after a first failure were not reached. All drafts, failed gates,
reviewed corrections and complete prepatch control recordings remain retained.

Final accepted serial commands on the exact UI bytes:

| Gate | Result | Seconds |
| --- | --- | --- |
| focused SkillsScreen Vitest | 62/2files pass, all18new reached | 6.411 |
| engine Vitest project | 1908/72files pass | 9.811 |
| full Vitest | 4279/181files pass | 72.689 |
| npm run typecheck | exit0 | 11.852 |
| npm run lint | exit0 | 29.515 |
| npm run check:test-bridge-shake | production build + bridge absence pass | 8.954 |
| final production Chromium browser | 18 cases + both explicit save cycles pass | 14.654 |

The first UI broad lint failed on test `[0]!`; the reviewed missing-slot guard
preserved interaction/oracles. Earlier fixtures and native/runtime corrections
remain separately identified in RAW. Existing3s engine/15s full-test targets were
missed; Browserslist, large chunk and PWA manifest warnings remain. No coverage
or performance signoff is claimed.

## Production browser scope

Ordinary fresh real L1 Paladin uses its initial skill point; learning does not
select. No test bridge or internal store/DOM/CSS injection. Each locale en/zh-CN
runs360×640,412×915,640×360,1280×800,1920×1080,320×640,768×1024,1024×768,
1440×900. Actual Tab/arrows, checked saved choices, polite status, solid2px visible
keyboard outline, labels≥44px/text16px and zero horizontal overflow pass. All18
screenshots independently reviewed. Export canonical selection/property omission
and explicitly confirmed Settings Save/reload pass in both languages. This does
not establish autosave or an earned campaign.

Initial browser attempts preserve a320px header click intercepted by existing
HUD, tofu screenshots despite functional success, and a font-diagnostic node0
race. Read-only probes proved requestedconfig loaded; bundled Fontconfig2.17.1
refused to regenerate stale caches built by2.18.3. An environment-only standalone
config uses existing font directories and a fresh task cache. Final CDP identifies
Noto Sans CJK SC for all5 Chinese legend glyphs, and screenshots are readable.
No product font/CSS change or shared-cache purge was used; the final workaround
used only a fresh task cache. Official Noto remains installed
at `/home/felixzhao/.local/share/fonts/NotoSansCJKsc-Regular.otf`, SHA256
`2c76254f6fc379fddfce0a7e84fb5385bb135d3e399294f6eeb6680d0365b74b`.

## Evidence, review and remaining gates

[Durable packet](fixtures/p07b02-selected-might/packet.json) and its verified
731-record archive preserve all RAW bytes, including failed reports, frozen
oracles, screenshots and exact output cleanup. Root owns retained RAW at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-might-w1jtf6hl`
until durable preservation and independent consumers release. Core records:
`ui-corrected-final-gates.json`, `ui-final-browser-audit.json`,
`browser-ui-production-v5-report.json`, source freezes, all failed reports and
review summaries. Eighteen completed older engine/full reports are losslessly
gzipped; completed-report-compression.json binds original/decompressed hashes.

Producer and QA approve exact source/automated gates; QA independently inspected
all18 screenshots and final browser/audit. Cumulative9738 PID/birth identities
are absent, no wrapper signals, browser temporary subtree absent. Verified761
build/cache files40960214bytes were removed after reviewed preservation; exact
absence is verified. The provisional archive was verified against the final
archive and removed. Producer and QA approve the whole packet and exact RAW removal after this
preservation commit; all consumers have released their readers.
Original checkout is clean; the root umbrella worktree claim continues. No remote
action. Broader aura replacement/Meditation, earned campaign/balance, full browser
coverage, full accessibility and private-v1 acceptance remain open.
