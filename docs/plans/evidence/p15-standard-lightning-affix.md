# P15 — Standard Lightning Enchanted verification

Locally implemented and verified 2026-11-05; uncommitted. BUG788 completes
standard Lightning Enchanted's +50 lightning resistance (existing cap75) and
25% receiving-direct-hit40–60base bolt. Existing active Lightning remains;
actual promoted ActI carriers preserve D07's active-only exception. See the
[exact rule](../decisions/P15-standard-lightning-affix-v1.md).

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-lightning-affix-ru4ypvkc`.
Root retains this exact packet through full private-v1 acceptance, then removes
it after all consumers finish. It contains original/review preimages and hashes,
causal failures, focused reports, browser drivers/screenshots, exact increment,
source hashes, self-review and cleanup receipt.

## Checks and observed behavior

- Native construction RED demonstrates absent resistance/metadata. Runtime RED
  loads the exact saved pre-Lightning combat module and executes a direct-strike
  test that fails for an absent bolt. The earlier override setup failure executes
  no cases and is not causal evidence.
- Six exact affected files pass109 actual cases. They cover basic/spell/paid
  projectile/mixed strikes, one probability argument per strike, controlled
  probability boundaries and damage endpoints, ordinary crit/resistance and
  attacker-shield absorption, misses/immunity/lethal/thorns deaths, original-body
  ownership/duplicate identity, periodic damage, authentic/fabricated Conversion,
  cold reaction exclusion, deterministic native RNG/plain-recorded parity/input
  preservation, strict metadata/schema and factory rejection before RNG, native
  resistance50/75/50 and actual all-act manual/idle carriers.
- Self-review finds secondary impact bolts lacked auxiliary identity and could
  roll four retaliations for one strike plus three releases. A new executed RED
  proves this. The sole dispatch site now marks impact-bolt; all child damage
  retains ordinary settlement while the direct-only retaliation gate excludes it.
  The final two-file run passes34 actual cases, including eight existing impact
  bolt regressions and26 receiving-hit cases. Across both GREEN reports118distinct
  cases have a latest pass; occurrence indexes preserve duplicate parameter names.
  The filtered RED's25unselected cases are not executed passes. An initial rejected
  deprecated cache flag ran no test and provides no causal evidence.
- Final scoped strict types import933files with zero diagnostics;13initial
  affected TS/test paths and the two final changed paths lint clean. Initial
  fixture mistakes/failures remain retained in `initial-failures.md`.
- Chromium147 passes en/zh-CN at360×640 and1280×800. Native seed7 yields four
  retaliation attempts:25damage, natural dodge0,25damage,23damage after50%
  lightning resistance. No-affix control has none; action count stays12, no mana
  payment, caller input preserved, no Attack scaling. Actual all-act manual/idle
  planner carriers preserve ActI specialization and later standard metadata.
  Localized CombatLog renders without overflow, console errors/warnings or failed
  requests. The zh mobile screenshot was inspected.
- After the review correction, the final zh-CN360×640 Chromium rerun passes:
  a separate native strike emits one primary plus three child damage events,
  one retaliation, one action, zero mana payments and deterministic unchanged
  inputs. It also rechecks the original mechanic/log/planner controls. Screenshot
  `review-zh-CN-360.png` preserves the final source rendering.

## Limits and review

Root self-review covers correctness, readability, native metadata/identity
boundaries, validation and bounded reaction cost. The secondary-release finding
is fixed and causally checked. No independent approval or merge readiness is
claimed. Schema validates bounded shape; native copy additionally validates
ordered damage endpoints before factory RNG. Battle metadata is transient and
requires no save migration; affix membership, cardinality and selection draws
are unchanged. No pending question or external blocker.

Constructed mechanics/log fixtures do not establish full CombatScreen, earned
progression, population balance or pacing acceptance. Generic log wording is
still “attack”/“普攻”; affix labels are checked separately and visual affix tags
remain open. The shield test verifies an absorbed bolt on its attacker, not a
fully absorbed incoming strike on an enemy carrier. `maxRounds` does not bound
the existing60-second engine loop; timed indefinite stun limits test actions.

Historical14/14 intended Normal completions,210retained contexts and formal
balance acceptance0/210 stay unchanged. Full private-v1 remains active and
unfinished: gameplay/content, attained power/acquisition/crafting economy,
retry/population balance,30–50active-hour pacing, higher difficulties/endgame
and integrated bilingual/mobile/a11y/save/PWA/performance/soak/independent
acceptance remain. Browser works; CI excluded; owner playtest later. No spent
campaign/pilot/sample/retry budget renewed; no broad suite rerun.

Recorded test/type/lint/browser handles are terminal. Exact browser PIDs and
port4381 are absent/unbound, and only the packet-owned `vite-cache` is removed;
`cleanup.json` records actual results. The named evidence packet remains root's
retained handoff artifact through umbrella acceptance.
