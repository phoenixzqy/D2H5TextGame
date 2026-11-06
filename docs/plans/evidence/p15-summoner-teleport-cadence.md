# P15 — Native Summoner Teleport opportunity

2026-11-05, BUG782. Previous goal turn was status-only, no implementation
progress. This increment completes the functional correction; full v1 remains
active and unfinished.

## Behavior

The Summoner's three priority attacks previously occupied every ordinary action,
so its advertised Teleport never happened. Existing per-monster metadata now
sets Fire Ball and Frost Nova recovery to6s only on the Summoner. Lightning2s,
Teleport3s, the full native bar and separate startup summon remain unchanged.
At native unmodified speed110, actions1620/3240/4860/6480ms become Fire Ball,
Frost Nova, Lightning, Teleport; the cycle repeats6480ms later. Teleport has its
existing +50 percentage-point magical dodge for1000ms. Interruptions, slows,
death and available actions can change this sequence.

This deliberately trades some attack frequency for an authored defense. It is
functional evidence, not current whole-encounter balance or earned pacing.
[Decision](../decisions/P15-summoner-teleport-cadence-v1.md) supersedes only older
retained-cadence clauses; HP, defense, elemental profile, reward and save rules
stay under their existing decisions.

## Focused results

- Corrected pre-patch RED has two causal failures: absent Teleport and missing
  metadata. Original fixture-period mistake is retained separately.
- Twelve cases pass across the new native cadence file, existing Summoner and
  existing cooldown-override files. They establish all three elemental damage
  types, startup summon, exact paid6480–7480ms window, immutability and replay.
- Two isolated Teleport dodge cases and four native Teleport controls pass:
  **18 distinct affected cases total**. Other mixed-file cases are filtered,
  not passed. The first native-name filter missed its quoted names; assertion
  result statuses, not Vitest's misleading summary count, establish execution.
- Strict schema validates38ActII definitions. Every field and row equals its
  exact preimage except the two intended Summoner overrides. Shared spell
  cooldowns stay3/3/2/3s and copied override metadata remains frozen.
- Scoped strict types traverse718imported files with zero diagnostics; two-file
  lint passes. Two initial TS2339 errors and one lint error came from the new
  test's missing event type predicate; an explicit Extract predicate fixes
  typing without changing runtime assertions. No repeat unit run is needed
  for that annotation-only correction; initial diagnostics are retained.
- Final Chromium147 checks en/zh-CN at360×640and1280×800. Actual native recorded
  events project through existing playback into actual paused CombatScreen.
  Native actions, three damage types, startup summon, blue localized Teleport
  chip, localized cast log and actual expiry all pass. No horizontal overflow,
  raw chip keys, browser errors/warnings, failed requests or bad responses;
  map/meta/inventory stores remain equal to fixture setup. Root visually checks
  Chinese mobile and English desktop enemy-card screenshots.

First browser assertions passed, but visual inspection found fixture issues:
generic enemy ID bypassed normal name/art lookup, hero lacked grid placement,
header defaulted to ActI, and mobile fullPage capture missed the scrolled card.
All original outputs remain under browser-initial/. One corrected four-case
launch uses the factory's generated identity, explicit constructed placement/
ActII header and direct card screenshots. This is a fixture correction, not
an earned or full-screen bilingual acceptance claim. Existing English tier
suffix in Chinese presentation is outside this cadence increment.

No campaigns, completed-act reruns, population/holdout samples, broad suite,
build or CI are run. Existing exhausted diagnostic/sample/retry budgets stay
closed. Browser's terminal log contains an outdated Browserslist database
notice; there are no browser console warnings and no dependency update is made.

## Review and retention

Root self-review compares exact incremental preimages: one JSON override pair,
one obsolete zero-cast exception removed, one new native regression file.
The existing priority/cooldown path fixes starvation without new AI or altered
shared spells. Independent review/QA and final acceptance remain open.

Root retains exact preimages, original failures, final results, scripts,
screenshots, incremental diff and cleanup receipt at:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-summoner-cadence-l42tj9uu`.
Root removes it after full-v1 acceptance and all review/QA consumers finish.
Both browser handles and scoped type/lint handles have exited. Both recorded
PIDs are absent, owned port5173is closed, and exact Vite/Vitest caches are
removed and verified. No task disposable processes or cleanup failures remain.

Historical14/14intended Normal completions,210source contexts and formal0/210
balance acceptance remain unchanged. Remaining gameplay/content, progression/
acquisition/economy,30–50active-hour pacing, difficulty/endgame, integrated
device/PWA/a11y/performance/soak and independent/later owner acceptance remain.
Continue the full objective in the existing claimed human2 worktree. No
pending question or external blocker; browser works and CI stays excluded.
