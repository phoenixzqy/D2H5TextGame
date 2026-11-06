# P16 — Hide the obsolete zero-Gold quest badge

Status: locally fixed and affected checks passed; full-v1 acceptance remains open.
[BUG557](../../../production/bugs/BUG-557-hide-legacy-gold-quest-badge.md).

The Den of Evil's legacy `gold: 0` field was displayed despite the no-gold
contract. The quest renderer now ignores exactly that compatibility field, as
reward settlement already does. XP, skill points and other reward rendering,
game data, settlement and save compatibility remain unchanged.

Existing quest UI tests pass 34/34, including real Den exact-once settlement;
scoped strict types and one-file lint pass. Ordinary fresh creation/navigation
passes zh-CN/en at 360×640, 412×915, 640×360, 1280×800 and 1920×1080. All ten
Den previews show exactly 500 XP and +1 skill point without Gold, with enabled
44px Start targets and no page horizontal overflow. Zero page/HTTP errors.
Chinese mobile and English landscape screenshots were viewed. Both exported
saves remain level1/XP0/skillPoints1 with the Den unclaimed. No gameplay injection,
import, combat or claim was used in this development-browser check; it does not
establish production/PWA, whole-app accessibility or independent acceptance.

Evidence packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
`p16-quest-rewards-browser-v1.json`, ten viewport PNGs and two exported saves;
`bug557-{unit,types,lint,browser}-v1-exit.json` hold terminal passing receipts.
One scoped config archived/removed; exact browser cache absent; no owned
process survives. Root retains the packet for full-v1 consumers and removes it
after their work finishes. Closure: `bug557-artifacts-v1.json`.

Current source audit `bug557-source-audit-v1.json` authenticates 2091 inputs:
`0eba061fc55b3b948679f9d8005e4320a479486c253ca55b1546f3f3fa77cf58`.
Only QuestsScreen changed since BUG556; archived bytes reconstruct both prior
source fingerprints. Engine/data unchanged; historical balance checks reused.
New native launcher `p15-current-source-run-v2.mjs` supports both UI transitions;
syntax passes, runtime not yet exercised. Old launchers/audits remain immutable.
No combat, earlier-act or full-suite replay. No new balance acceptance.
