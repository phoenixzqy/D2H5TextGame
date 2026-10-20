# BUG-033 — Fire Bolt displays flat damage as a percentage

- Status: Partially fixed in `a150f5b`: flat damage and seconds presentation corrected; canonical cast-name fallback remains Open.
- Severity: Low; misleading skill units and an untranslated combat skill name.
- Affected systems: shared skill detail formatting, skill locale copy, combat-log
  skill-name lookup. Root explicitly delegated this report outside the browser
  card's three-file ownership on 2026-10-20.
- Reproduction head: `f3892e9d04032c4cdbf650893ee4af56cc6a7477` plus the
  P08a01b browser spec/config only; runtime source unchanged. Chromium desktop
  1280×800 and mobile 360×640, `en` and `zh-CN`, Node24.21.0/npm11.19.0.

## Ordinary reproduction and expected/actual

1. Create a fresh Sorceress through the production UI, choose either locale,
   open Skills, and select Fire Bolt. No bridge, save import or state injection.
2. Expected: the rank-1 preview identifies **30–45 flat Fire damage**; the
   cooldown uses seconds. Actual rendered browser DOM from the first P08a01b
   run, English desktop:

   ```text
   Fire Bolt
   Unlearned / 20 · Active
   Fire Bolt: Fire attack 30% ~ 45%.
   Learned at Lv. 1
   Fire attack     30% ~ 45%
   Mana Cost      8
   Cooldown       1 turn(s)
   Applies        Burn
   ```

   The corresponding Chinese DOM reads `火弹：火焰攻击 30% ~ 45%。`,
   `30% ~ 45%`, and `冷却` / `1 回合`. The authored cooldown is one second.
3. Allocate the fresh point, configure Fire Bolt, earn the next point through
   an actual eight-monster Blood Moor wave, then allocate rank2. The second
   P08a01b run verified Current `30% ~ 45%` at rank1 and `34% ~ 49%` at rank2
   in all four viewport/locale cases. Expected rank2 is **34–49 flat damage**.

The independent rank-1 browser mechanics oracle is a first hit of21 after
defense12, leaving the literal seeded target at26/47 HP. This report does not
claim the displayed percentage governs damage or that rank2 browser damage
was measured.

## Separately observed skill-name fallback

During ordinary rank-1 combat the second run required, and observed, these
literal cast lines in the two locales:

```text
Earned Fire Bolt casts sorceress.fire_bolt.
Earned Fire Bolt 施放了 sorceress.fire_bolt。
```

Expected names are `Fire Bolt` and `火弹`. This is a name-lookup symptom,
separate from percentage/cooldown units. The following actual noncritical
damage lines were also observed and paired with target HP26/47:

```text
Earned Fire Bolt attacks Fallen A for 21 fire damage.
Earned Fire Bolt 普攻 堕落者 A，造成 21 点火焰伤害。
```

## Evidence and affected source

- `tests/pwa/fire-bolt-earned.spec.ts` pins the observed numeric rank displays
  and actual cast/hit identity; it explicitly does **not** certify correct units
  or fully localized copy.
- Command: `PWA_PORT=4337 npx playwright test --config=tests/pwa/playwright.config.ts fire-bolt-earned.spec.ts --output=/tmp/d2h5-p08a01b-earned-browser-2`.
  Result: **4passed,0failed,0skipped,1.3m**, retries0.
- First output directory `/tmp/d2h5-p08a01b-earned-browser-1` held the ordinary
  UI DOM/screenshots/traces used above. Its **4 failures** were a test-only
  exact-label mistake (omitting ` · Active` / ` · 主动`), corrected before
  run2. They are **not** a failed desired-unit regression; no such regression
  was run and no product fix is claimed. The observed DOM, preserved above,
  is the bug reproduction evidence.
- `src/features/skills/SkillsScreen.tsx`: damage rows always use
  `details.percentRange`; dynamic descriptions use `details.descriptionDamage`;
  cooldown rows use `details.turns`.
- `src/i18n/locales/{en,zh-CN}/skills.json`: these shared keys supply the
  percentage/turn wording, and localized names live at `sorceress.fire-bolt`.
- `src/stores/eventToLogI18n.ts`: action names look up the canonical underscore
  ID `sorceress.fire_bolt.name`, falling back to that raw ID.
- `docs/plans/decisions/D04-fire-status-alias-v1.md` and the authored skill
  establish flat damage/rank scaling; this browser card changes neither.

Security: PASS; local ordinary gameplay and game-save exports only. No
credentials, external publication, save migration, or runtime behavior change.
Root/producer completed independent review and declared artifact consumer-done.
The QA worker deleted and verified absence of its exact owned browser outputs
and generated `dist`. This report preserves the necessary small text evidence
independently of those disposable files. BUG-033 remains Open.


## P08a01c desired-unit reproduction before presentation edits

The separately approved control is `docs/plans/decisions/D04-skill-display-units-v1.md`.
At input `a6f5728`, only mounted tests changed before this command:

```sh
npx vitest run --project ui src/features/skills/SkillsScreen.test.tsx --reporter=dot --silent
```

On 2026-10-20 the genuine RED exited 1: **6 failed / 38 passed**, 44 tests,
**5.94 s**. Both locales failed Fire Bolt's flat current/next ranges, flat +4/+4
delta and dynamic description, actual Vengeance mixed-type rows and totals, and
authored Holy Shield rank-3 **3.9-second** cooldown. Actual values retained
percentage suffixes or turn units. Real Warmth rank-2/3 mana/fire percentage
rows and deltas passed in both locales. No presentation/locale/browser source
had changed. This is the desired-unit RED; it is distinct from P08a01b's label
fixture failure.

Root and producer independently reviewed the full test diff and approved the
presentation fix before implementation. Exact raw JSON was retained for those
consumers at `/tmp/d2h5-p08a01c-units-red.json`; QA owns cleanup after final
review. Final fix/combined-head/browser evidence is pending. The canonical
cast-name fallback remains a separately open issue outside the unit correction.


## P08a01c unit correction and evidence

Worker `78cd0c96ccc60232da1a1ab318f60b904f7835e2` integrated as `a150f5b`.
The shared presentation now uses localized flat ranges/deltas/descriptions and
cooldown seconds; numeric values and mechanics are unchanged. Mounted tests
pin Fire Bolt rank1/2, Vengeance mixed/total ranges, Holy Shield rank3 3.9seconds
and genuine Warmth percentages in both locales. Focused 44 passed in6.76s;
related60/2files in11.49s; full1453,zero pending,in48.39s. Full preceded removing
an unsupported test-only RTL exact option; focused44 and typecheck/lint passed
afterward. Typecheck/lint/forced browser-spec ESLint/build5.43s/diffcheck passed.
Related/full5/15second budgets remain unmet; ordinary build warnings remain.

Fresh guarded production PWA command:

```sh
PWA_PORT=4338 npx playwright test --config=tests/pwa/playwright.config.ts fire-bolt-earned.spec.ts --output=/tmp/d2h5-p08a01c-units-browser-2
```

Passed4/4 in55.9s, desktop1280×800/mobile360×640 × en/zh-CN, native timers,
fixed Date only,retries0. Original21hit/47→26HP,eight-enemy160XP,earnedrank2,
whole-save/read-onlyIDB and actual close/newpage/Continue assertions retained.
No overflow/pageerrors. Initial browser4fail were solely a new test-only
`dt` accessible-name locator; DOM already showed1s/1秒. Exact visible label
and its adjacent definition corrected the locator without changing timing,
mechanics or acceptance. Raw canonical cast-name observation stays in the test.

Root and producer independently reviewed the complete five-file diff, raw
RED44/38/6, full1453 and browser evidence: APPROVE/ADEQUATE. Both consumers
finished before QA removed and verified absence of exact RED/full JSON, browser
attempt1/2 outputs, dist and task-local .vite. Shared node_modules preserved;
all task processes ended, port4338 free, clean Git and worktree4 released.
Combined-head validation follows runtime integration and remains separately
required. BUG033 stays open solely for the separate cast-name identity issue;
full skill/localization/campaign gates are not accepted.


## Remaining cast-name source investigation (read-only)

At `16fa6c6`, independent design_contracts traced live playback and legacy
battleEventToLogEntry to the same eventToLogI18n converter. It directly looks
up skills:<canonical-ID>.name; authored SkillDef.name already points to the
correct hyphenated catalog key. All283 authored names resolve in both locales,
while197canonical direct lookups miss per locale. No catalog additions needed.
Proposed P08a01d: private authored/canonical name-key index inside the shared
converter, translate each event in current locale, preserve unknown original-ID
fallback and existing direct-key compatibility. No engine/event/save change.

Candidate five-file boundary: eventToLogI18n.ts/test, combatStore.test.ts real
recorded Fire Bolt→advanceEvent integration, and exact localized cast-copy
substitutions in fire-bolt-earned/warmth-earned production browser specs.
Keep every existing MP/action-count/timing/damage/progression/save oracle.
Test literal bilingual names across all seven classes, monster and merc/aura
families, actual data aliases, unknown/basic action and locale changes.
Merc name references belong to skills:mercenary, not mercs:skillName (whose
wording differs). Broader buff/status/history localization is separate.
This is a source-grounded proposed plan, not an implemented or accepted fix;
producer plan review, genuine tests-first RED and final browser proof follow.
No investigator artifacts/processes were created.
