# BUG-715 — Preserve crafting investments during bulk discard

Status: Locally fixed and verified; independent acceptance remains open. No commit yet.
Severity: Critical (permanent loss of invested equipment and socket materials).
Owners: engine-dev/frontend-dev; root implementation.

## Reproduction

HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus inherited human2 edits.
WSL/Node24.21.0, Vitest1.6.1/jsdom; locales en and zh-CN. Browser viewport
not applicable to this first reproduction; real-browser checks pending.
No RNG or seed is involved. Fixtures are constructed, not earned equipment.

1. Put a low-ilvl runeword and normal/magic/rare equipment with inserted runes
   or gems in the backpack. Equip a higher-ilvl item in the same slot.
2. Select the corresponding rarity or below-equipped-tier bulk action.
3. Confirm deletion. Alternatively, pass the invested item's ID directly to
   `inventoryStore.bulkDiscard` (including an ID selected before socketing).

Expected under the safety extension: bulk actions preserve uniques, sets,
runewords (including an identity marker), and inserted rune/gem investments.
Counts and confirmation previews agree with deletion. Empty sockets remain
eligible. Deliberate individual discard remains available.

Actual: the below-tier selector includes runewords; rarity selectors/counts
include socketed ordinary equipment. The store removes all supplied IDs,
including unique/set IDs that its UI normally excludes.

This deliberately extends the old unique/set-only UI policy. Existing tests
explicitly treated runewords as unprotected; this is not a claim that the old
code violated an existing runeword-protection contract.

## Evidence and cause

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-bulk-crafting-vcjlegqj`.
`red.log`/`red-result.json`: six expected behavioral failures,31passes/37cases
across the selectors, bilingual toolbar and store. The prior unsupported
`--cache.dir` launch ran zero cases and is retained separately as
`red-invocation-failure.log`/`.json`; it is not behavioral evidence.

The feature's predicate only checks unique/set rarity, the count loop bypasses
it for rarity counts, and deletion has no protection predicate. Use one pure
engine rule at selection/count and current-state deletion boundaries.

Workaround: inspect and discard uninvested items individually.

Security check: pass. Local inventory preservation only; no dependency,
network, credential, permission, CI or save-format change. Existing ownership
mutation guards must remain in force.

Root retains this required packet and the owned human2 worktree through
unfinished full-v1 review, then owns exact cleanup/release. No commit yet.

## Local result — 2026-11-04

[Protection evidence](../../docs/plans/evidence/p16-bulk-crafting-protection.md).
One pure engine predicate now governs rarity/tier selectors, counts and current
backpack/stash deletion. All42affected regressions plus two selected ownership
guard cases pass, as do scoped strict types and explicit eight-file lint.
Real Chromium147 passes all four en/zh-CN desktop1280×800/mobile360×640 flows:
live socket update, exact protected-state preservation, explicit individual
discard, keyboard cancel/focus and layout. No browser errors or failed requests.
Constructed fixtures confer no earned crafting/campaign acceptance.

The original browser fixture selected English through localStorage, which new
character settings reset to Chinese. The corrected driver uses the actual
Settings language button; initial failure is retained, no production workaround.
Python Playwright is absent; the existing Node Playwright and Python server
lifecycle helper run successfully without installation. Scoped types initially
omitted the existing test matcher setup; correction includes it without changing
compiler strictness. Initial mid-animation screenshots are retained; separate
capture-only artifacts finish finite animations for legibility.

All owned tool sessions are terminal, recorded check processes are absent,
three server ports are closed, and the task cache/configs are removed (config
contents archived). Source/test hashes and full current-state browser readback
are retained. Self-review is not independent acceptance. Full privatev1 remains
active/incomplete;14/14ActI,10/14Normal,formal0/210 unchanged.
