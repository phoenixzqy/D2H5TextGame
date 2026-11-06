# P16 — Flat Magic Resist equipment comparison

2026-10-30, HEAD b5a0898 plus retained private-v1 work; root sole writer.
[BUG431](../../../production/bugs/BUG-431-equipment-comparison-magic-resist.md).
No engine formula, gear strength, save version or dependency change.

The comparison key set now includes canonical `magicResist`, so existing net
and monotone upgrade calculations account for a lost or gained point. Shared
stat sheets and equipped-item inspection project and format the same integer;
both inventory locales name it. Elemental percentage resistance stays separate.
Actual Diamond sockets supply the existing flat bonus.

## Verification

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
All final receipts below have exit0, no timeout and no owned descendants.

| Check / packet prefix | Result |
| --- | --- |
| `p16-mr-compare-red-v1` | Five intended missing-field failures before implementation |
| `p16-mr-dom-red-v1` | Four intended missing-localized-row failures before implementation |
| `p16-mr-comparison-green-v2` | 78 tests / eight files PASS, 41.360s wrapper |
| `p16-mr-types-v2` | Strict noEmit PASS, 14.334s |
| `p16-mr-lint-v2` | Zero-warning scoped lint PASS, 28.900s |
| `p16-mr-build-v1` | Production/PWA build PASS, 31.340s |
| `p16-mr-browser-v1` | Ten public production Chromium contexts PASS, 72.353s |
| `p16-mr-browser-visual-v2` | Two representative contexts with settled modal animations PASS, 13.783s |

Tests exercise actual chipped Diamond +2, real inventory equip parity, negative
clamping, unchanged neutrality, armor/MR tradeoffs, two-hand displacement and
both-language compare/inspection. Earlier GREEN-v1 retained 76PASS/2FAIL from a
new fixture using `magicResist` instead of canonical `statMods.magicResist` in
legacy affix values. Fixing only that path preserves all numerical assertions;
it also makes the negative-clamp fixture meaningful. Lint-v1 rejected two new
non-null assertions; explicit candidate-cell validation replaces them. Initial
strict types-v1 passed in283.725s. Failed logs remain preserved.

Browser checks use both zh-CN/en at360×640,412×915,640×360,1280×800 and1920×1080.
Public Save Import installs a retained native L2 export with two explicitly
constructed canonical caps appended. Public controls equip plain, compare the
Diamond using keyboard Enter, equip, inspect, compare downgrade and Export.
All show MR0→2/+2/netup, inspection2, loss2→0/-2/netdown and actual exportedMR2
with exact cap ownership. No page/console/HTTP errors, document overflow or
production test bridge. Confirm targets meet44px. This proves constructed-item
UI/equip/save integration; it is not earned gear, campaign or pacing acceptance.

Four representative v2 screenshots are retained; zh360 and en1280 compare and
inspection were visually inspected across v1/v2. V1 zh inspection caught the
fade-in animation; v2 waits for that modal subtree's animations before capture.
Its original screenshot and successful assertions remain retained. The localized
head selector was corrected from guessed头盔 to actual头部 before the first run.
No runtime UI change was needed for either test-harness correction.

Existing build chunk/art-manifest warnings remain outside this scoped result.
After all browser consumers ended,763 files were hashed in
`p16-mr-build-manifest-v1.json`; the exact owned bundle was removed and absence
verified in `p16-mr-build-cleanup-v1.json`. Source backups, scripts/recipes,
logs/receipts, constructed fixtures, public exports, screenshots and type cache
remain in the packet for active umbrella review; root owns eventual cleanup.
No current full ordinary-suite or independent QA acceptance is claimed. Earned
five-act/fourteen-build/economy/30–50-hour pacing and retry acceptance stay open.
CI excluded/deleted by owner; Chromium works; owner playtest follows implementation.
