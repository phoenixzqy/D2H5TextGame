# P17 — XP/MF bonus presentation and Settings help

Verified locally on 2026-11-04, HEAD
`b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained source.
Closes BUG674 and the bonus badge/bar and Settings-help surfaces in
`docs/design/idle-offline.md` §5.1/5.4. Full P17/private v1 remain open.

## Change

Home and HUD identify XP and Magic Find in both locales. A shared accessible
meter shows current bonus strength against the existing 0–50% scale. It does
not invent an original peak/window absent from the saved tuple. The existing
read-only projection controls decay and expiry; there is no new timer, store
publication, combat formula or save-format change. Longer labels wrap.

Settings provides a native keyboard-operated disclosure explaining no direct
offline XP/items/currency, +8% per away hour up to +50%, 20 minutes per hour up
to two hours, linear online decay, and the XP/effective-MF-only restriction.
The earlier passive-notification pointer fix is preserved.

## Verification

| Check | Result |
| --- | --- |
| Existing bonus lifecycle suite before production change | Expected RED: 2 failed / 10 passed; XP-only labels |
| Affected bonus lifecycle suite after implementation | 12/12 passed, 7.40s total / 289ms tests |
| Production build with `VITE_E2E` unset | Passed, Vite 21.29s; 766 emitted files |
| Production JS bridge scan | Passed, ten chunks, no forbidden symbols |
| Explicit lint on six affected TS/TSX paths | Passed |
| Scoped strict types including actual UI setup/bridge declarations | Passed |
| Desktop/mobile × en/zh-CN production browser | 4/4 passed, 27.8s, no skips/retries |
| Supplemental mobile Chinese visible-help check | 1/1 passed, 14.2s |

The browser creates and saves an ordinary character through UI, really closes
the page, introduces an eight-hour gap, and reopens offline through the warmed
production service worker. It verifies the 50% meter, localized home/HUD labels,
30-minute decay to 37.5% (visible rounded 38%), and exact two-hour expiry.
At return, after decay and at expiry, complete exported saves equal the original
save with only independently expected timestamp/idle fields changed. No combat,
campaign replay, import fixture, bridge or storage/store writes supply evidence.

Enter opens and Space closes Settings help; its summary is at least 44px tall.
Reflow checks cover 360×640, 412×915, 640×360, 1280×800 and 1920×1080 without
document/chip horizontal overflow. Both locale/viewport combinations produce
home/help captures. An additional mobile-Chinese run scrolls the actual main
container until the explanation is in the viewport; its capture was inspected,
along with mobile Chinese and desktop English home captures. Page errors are
empty. Root source/control review found no material issue within this scope;
independent umbrella acceptance remains open.

Initial lint rejected numeric template interpolation; explicit `String(...)`
fixes that rule and the production build was refreshed before browser evidence.
The first scoped type harness omitted the existing UI matcher and global bridge
declarations; adding the real setup/declaration inputs makes strict types pass.
Neither failure was suppressed. Original logs remain. The existing reward test's
one XP-only label expectation is updated; its reward assertions are unchanged
and its previously verified earned wave is not replayed for presentation work.

## Evidence and remaining scope

Packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p17-bonus-ui-v1`.
It retains original snapshots, exact source/build/input hashes, task diff,
unit/build/type/lint logs, both browser JSON reports and nine decoded captures.
Source-hash comparison confines changes to the two UI modules, existing bonus
test and four locale files. Locale edits are confined to bonus labels/help.

Security check: pass; local UI and task-owned outputs, with no credential,
network, permissions or persistence-contract change. Existing chunk-size and
optional-art-manifest precache warnings remain. These checks do not prove MF
rarity behavior, returning-player toast, attack-speed display, broader idle/PWA
acceptance, campaign balance or final review/soak. Counts remain 14 intended
Act I clears, three five-act Normal clears, formal balance 0/210.

All consumers are terminal. Exact temporary runner/type configs and the verified
766-file production directory are removed; `cleanup-closure.json` records absence
and the closed preview port. Root retains the required packet and claimed human2
worktree through umbrella review and owns eventual evidence cleanup/release.
