# P16 — Completed-wave loot remains visible after defeat

2026-11-05. BUG771 fixed locally; full private v1 remains unfinished.
Previous goal turn was status-only/no progress. This increment repairs a real
loss/recovery presentation gap under playable-target G1/G5.

Native settlement grants each victorious wave and accumulates its committed
reward bag. A later defeat preserves that inventory and bag, but CombatScreen
hid the entire summary behind runVictory. The old hide-on-defeat expectation
therefore contradicted settlement semantics. Two explicit retained-bag tests
fail before production edits; twelve other cases were filtered, not executed.

Terminal victory, defeat and draw now use the same existing summary. A loss
adds localized context: completed-wave loot is retained. The existing empty
guard also omits that explanation for empty bags. Amounts, identities and item
rarity still come directly from runRewards. No granting callback, loot roll,
combat, XP, settlement, save, economy or balance rule changes.

All 16 affected UI cases pass, including both loss outcomes, exact item/material/
currency values, unchanged reward object, empty bags and nonterminal omission.
Scoped strict checking follows the three affected TS roots and their imports:
994 files, zero diagnostics. Changed-file lint passes. Twenty constructed
Chromium cases render the actual CombatScreen at360×640/1280×800 in en/zh-CN:
defeat/draw/empty/victory/nonterminal, exact loot, localized accessible names,
keyboard-focusable enabled44px return controls, no page overflow and unchanged
fixture inventory/player/rewards. No page errors, warnings or failed requests;
four defeat screenshots retained, Chinese mobile rendering visually inspected.

These fixtures prove presentation and nonmutation, not earned acquisition,
current-source campaign balance or independent whole-app acceptance. Self-review
only. No campaign, training, adaptation trial or spent sample/retry allowance
was renewed. Historical14/14Normal/210checkpoint sources/formal0/210 unchanged.
Progression/acquisition/economy/pacing and integrated acceptance remain open.

Root retains packet through full-v1 acceptance, then removes after consumers
finish:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-retained-defeat-loot-1g5r9hcs`.
It includes preimages/current snapshots, exact increment, scope/security,
RED/GREEN reports, type/lint evidence, browser driver/results/screenshots,
self-review and cleanup receipt. All command handles terminal; driver PID absent,
port closed, exact task-owned Vite cache removed and absence verified. No
disposable paths remain. Browser works; CI excluded; no user hold.
