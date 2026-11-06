# P12b / P16 — Bulk discard preserves crafting investments

2026-11-04. Owned human2, branch `feat/playable-foundations`, HEAD
`b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited local edits.
Previous goal turn was status-only/no progress; ownership was revalidated for
the same live session before implementation. This turn changes production.

## Result and boundary

[BUG715](../../../production/bugs/BUG-715-bulk-discard-crafting-protection.md)
is locally fixed. Bulk discard preserves unique/set/runeword rarities, any
runeword identity marker, and nonempty inserted rune/gem contents. Empty socket
capacity remains discardable. The shared pure engine predicate is used by
rarity/tier selectors, counts and deletion against current backpack/stash items.
Existing single-item discard remains available after its explicit confirmation.
The dialog explains protection in English and Chinese.

This is a deliberate safety extension to the former unique/set-only UI policy;
old tests explicitly permitted runeword deletion. It is not a retroactive claim
that a runeword-protection contract already existed. Existing ownership guards
remain ahead of reads/mutations. No save format, combat formula, material price,
recipe, dependency, network or CI change is part of this increment.

## Affected verification

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-bulk-crafting-vcjlegqj`.
It retains exact pre-change files, task-only diff, commands/native exits/logs,
source hashes, browser state snapshots, screenshots and failed attempts.

| Check | Evidence/result |
| --- | --- |
| Behavioral reproduction | `red.log`:6expected failures/31passes across37cases, before production changes |
| Engine/selectors/toolbar/store | `green.log`:42/42pass in four affected files |
| Ownership guard | `guard.log`:2/2selected bulk-discard cases pass;45unrelated cases filtered |
| Scoped strict types | `types.log`:exit0, affected files plus Vite declarations and existing test setup |
| Scoped lint | `lint.log`:eight explicit TypeScript files, exit0/zero warnings |
| Browser | `browser-results.json`:4/4flows pass in Chromium147.0.7727.15 |
| Final screenshots | `capture-results.json`, four `capture-*.png` files; separate capture-only pass |

The store regression checks full remaining state, retained object identity,
unknown/duplicate requested IDs, protection in both containers and explicit
individual deletion. Engine tests cover all ordinary rarities, both inserted
material kinds, empty capacity, special rarities and marker-only protection.
Selectors/counts are checked for consistency and purity. Bilingual component
coverage changes a candidate after opening confirmation, then verifies the
updated preview and submitted IDs.

Real browser fixtures are **constructed**, not earned crafting acquisitions.
Each locale at1280×800 and360×640 verifies visible counts, protection copy,
keyboard activation/Escape/focus return, cancellation without mutation, a live
socket update during confirmation, exact state after bulk discard, and deliberate
single runeword discard. Full remaining backpack/stash/equipment snapshots are
compared. All four have zero page exceptions, console errors and failed requests.
Document width equals viewport width; dialogs fit; sampled action/confirmation
targets are at least44×44px. This is scoped UI evidence, not all-device/PWA
performance or accessibility sign-off.

## Corrections and review

The unsupported Vitest `--cache.dir` launch ran zero cases and is retained as
`red-invocation-failure.*`; it is not RED behavioral evidence. Final runs use
`--no-cache`. The first scoped config omitted the existing matcher setup;
`types-incomplete-config.*` is retained and the corrected config includes
`src/test/setup.ts` without relaxing strictness. Fixture gem IDs were corrected
to the canonical `gems/ruby/chipped` before GREEN validation.

The first browser driver set only localStorage locale; creating a character
restored the default Chinese setting. `browser-attempt1/` retains that failure.
The corrected driver selects the locale through Settings. Python bindings were
unavailable, so installed Node Playwright is used with the repository's Python
server-lifetime helper; no installation or browser-launch workaround was needed.
Initial screenshots caught the existing0.2s fade; final capture-only artifacts
finish animations without repeating the deletion assertions. The mobile English
final artifact was visually inspected for readable, fitting copy and controls.

Task-only diff review finds one shared policy, consistent selectors/counts/store
semantics, preserved ownership guards and no single-item API change. This is
self-review; independent acceptance remains open.

## Custody and full-goal status

`cleanup.json` verifies eight current recorded process handles absent, no owned
Vite server, and all three used ports closed. Tool sessions are terminal and
both browsers closed. The exact task-owned `vite-cache` is removed; scoped
TypeScript/Vite configs are archived as text and removed from their active paths.
No shared cache or inherited changes were removed. Root retains the required
packet above and human2 through unfinished umbrella review, then owns exact
cleanup/release.

**14/14 Act I;10/14 intended Normal;formal balance0/210 unchanged.** No campaign
replay, broad test suite or build. Holy Bolt,Zeal,Double Swing,Javelin and wider
economy/pacing/difficulty/endgame/app/soak/independent acceptance remain open.
The full privatev1 goal remains active/incomplete, with no pending user question
or browser blocker.
