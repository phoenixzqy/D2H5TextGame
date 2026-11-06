# P16 — Inspect equipment directly in the crafting target picker

2026-11-05. Previous goal turn was status-only and made no implementation
progress. This increment closes BUG781 locally; full private v1 stays unfinished.

## Player behavior

Each visible crafting target now has a localized Details button. Touch, Enter
or Space expands the existing item card and an ordered socket readout before
selection or preview. Opening and closing never checks the equipment, spends
materials or prepares an action. Damage/defense, requirements, affixes and native
socket effects come from the existing ItemTooltip. The socket readout is shared
with confirmation instead of duplicated. Native content order and word identity
are visible; v18 preserved rune order and word are explicitly inactive, with
historic socket effects suppressed using the existing inspection flags.

Only open rows materialize item details. Search, pagination and source removal
unmount departing rows and their local disclosure state while preserving exact
selection. Locale changes update open details. Existing twelve-row rendering and
name-localization bounds remain covered. This advances G4 informed crafting
choices and G5 essential-control usability; it does not close either whole gate.
No crafting transaction, engine rule, save format, loot or balance change occurs.

## Verification

- One Chromium baseline on the actual CraftingPanel with constructed native
  equipment proves the missing control before BUG781 is filed and source patched.
- Four new bilingual cases fail causally on missing Details buttons, then all
  58 affected CraftingTargets/CraftingPanel cases pass in one focused launch.
  They cover lazy details, independent selection, ordered native contents,
  live locale change, search/source removal, inactive preservation and existing
  preview/confirmation transactions.
- Four-file lint passes. Scoped strict types traverse 991 imported source files
  with zero diagnostics after correcting the historical test fixture's type.
  The initial fixture diagnostic is preserved; its runtime payload is unchanged.
- Two final Chromium147 pages (en/zh-CN) use the actual CraftingPanel, each
  checking 360×640,412×915,640×360,1280×800and1920×1080 without horizontal overflow.
  Details controls are at least44×44, Enter opens, Space closes and focus remains.
  Native `[Tir, El]` and preserved `[Ort, Sol]` order, visible native effects and
  suppressed historical effects pass. All five participating game stores remain
  byte-equivalent to fixture setup. Zero browser errors/warnings, failed requests
  or bad HTTP responses. Root visually inspects English mobile/desktop native
  and Chinese mobile preserved screenshots.

One initial test command finds no files because its external temporary config
needs an explicit workspace; the corrected command supplies it. Initial/final
type evidence and runner field interpretation are retained in
`verification-notes.md`. In particular `nativeContents:0` in the browser report
is a native-order locator count AFTER switching to recovery, not the item's rune
count; the exact order assertion and screenshots precede that switch.

No unrelated tests, completed campaign reruns, full build, CI, population samples
or exhausted diagnostic allowances are used. These are constructed usability
controls, not earned progression, balance-population or pacing evidence. Existing
ItemTooltip typography and overall accessibility/PWA acceptance remain separate.

## Review, evidence and cleanup

Plan self-review is ready after accounting for lazy rendering, selection isolation,
inactive history and authoritative source updates. Security check passes: local
UI only, no new dependencies, networking, credentials or export. Root reviews the
incremental preimage diff and socket-helper move; confirmation retains its
existing behavior and gains a localized list name. Root self-review only; no
independent QA/reviewer approval or whole-game acceptance is claimed.

Root retains exact preimages, runner/fixture, original failed and final passing
results, screenshots, lint/type evidence, incremental diff and cleanup receipt at:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-crafting-inspection-fs43dppv`.
Root removes this packet after full-v1 acceptance and all consumers finish.
Task Vite/Vitest caches are removed, both browser runners have exited, the owned
server port is closed, and all command handles are terminal. No cleanup failures
or disposable processes remain. This increment's finite controls are closed.

Historical14/14intended Normal completions,210source contexts and formal0/210
balance acceptance remain unchanged. Remaining gameplay/content, progression/
challenge/attainable acquisition/economy,30–50active-hour pacing, difficulty/
endgame, integrated mobile/PWA/a11y/performance/soak, independent review and later
owner playtest stay open. Continue the full objective in the existing claimed
human2 worktree. Browser works; CI excluded; no user answer is pending.
