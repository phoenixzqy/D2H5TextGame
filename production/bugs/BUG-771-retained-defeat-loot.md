# BUG-771 — Show completed-wave loot after a later defeat

Status: Fixed in working tree (uncommitted). Severity: Medium. Owner: root (frontend).

Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus inherited local v1 work.
Environment: Vitest/jsdom with actual CombatScreen and Zustand stores; en and
zh-CN. Browser viewport and RNG seed are not applicable to this rendering repro.

1. Complete a rewarded wave, then lose a later wave in the same run.
2. The native settlement path has already granted and accumulated the earlier
   wave's loot. A nonwinning settlement marks defeat without clearing that bag.
3. Inspect the terminal defeat panel: its loot summary is absent.

Expected: show the committed earlier-wave bag, with context that completed-wave
loot is retained. A draw follows the same failed-run presentation. Empty bags
and nonterminal runs show no terminal summary; rendering never grants rewards.
Actual: the victory-only JSX condition hides all retained rewards after a loss.
Workaround: inspect inventory/material holdings separately.

Reproduction evidence: CombatRewardSummary.test.tsx uses an explicit retained
bag (presentation fixture, not earned acquisition). Both locales fail because
loot-summary is absent. Existing native settlement source grants each victorious
wave and accumulates its rewards, then preserves that aggregate on later defeat.
The older hide-on-defeat test expectation contradicts those settlement semantics.

Packet: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-retained-defeat-loot-1g5r9hcs
contains preimages, scope/security, red.json and red.log. Two causal failures;
twelve other cases were filtered, not executed. No campaign, retry or balance
credit is claimed.

Scope: playable-target.md G1/G5 reward visibility and loss/recovery feedback.
Use the existing summary and localized completed-wave context. No loot, XP,
settlement, combat, save or economy changes. Security check: pass; see packet.

Resolution: terminal CombatScreen renders the existing committed reward summary
for either run result. Its optional retained context uses new en/zh-CN copy and
appears only after the summary's existing empty-bag guard. Draws retain their
draw title. The prior victory-only expectation is replaced with exact bag,
identity, empty-loss and nonterminal checks.

Verification: 16 affected UI cases pass; scoped strict types (994 source files,
zero diagnostics) and five-file lint pass. Twenty constructed actual-CombatScreen
Chromium cases cover defeat/draw/empty/victory/nonterminal at 360×640 and 1280×800
in both languages. Exact summary quantities, accessible names, return-button
focus/44px targets, no page overflow and unchanged fixture holdings pass; no
page errors, warnings or failed requests. Chinese mobile screenshot is readable.
These are presentation checks, not earned acquisition or population acceptance.
Source review is self-review only. Browser/server terminal, port closed, exact
owned Vite cache removed and absence verified. Root retains the named packet
through full-v1 acceptance and removes it after consumers finish.

See [evidence](../../docs/plans/evidence/p16-retained-defeat-loot.md).
