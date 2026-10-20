# BUG-033 — Fire Bolt displays flat damage as a percentage

- Status: Open. Reporting only; no copy or runtime fix in P08a01b.
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
