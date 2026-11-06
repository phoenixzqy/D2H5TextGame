# Shared main-quest wishstone budget

Nineteen more main quests now grant their authored non-kill wishstone bonuses,
adding 360 to the existing 55 starter wishes. The shared main-quest total is
415 across 22 of 24 main quests. Cain and Malus require specialized currency
rollback integration and remain open, along with side/specialized/repeatable
quest budgets. This is a P15 tuning group, not final economy acceptance.

## Authored amounts

| Group, in authored order | New wishes |
| --- | --- |
| Countess | 15 |
| Act II: Radament, Staff, Sun, Arcane Sanctuary, Seven Tombs | 20 / 20 / 15 / 15 / 25 |
| Act III: Golden Bird, Gidbinn, Khalim, Tome, Guardian | 15 / 15 / 20 / 15 / 25 |
| Act IV: Izual, Hellforge, Diablo | 20 / 20 / 25 |
| Act V: Siege, Rescue, Prison, Rite, Eve | 15 / 15 / 20 / 20 / 25 |

The frozen pre-edit table and [contract](../plans/decisions/P15-main-quest-wish-budget-v1.md)
record the exact IDs and amounts. All values remain within drop-tables §9's
10–25 range. Every old quest field is preserved, including XP, points, bound
items, table rewards, services, prerequisites and unlocks. New wishes share
the existing explicit claim, claimed flag and rollback; they bypass kill,
difficulty and offline multipliers. Existing claims are not reopened or
compensated. No save format, price, kill RNG or other economy settings change.

## Integrity and player display

BUG580 found that early numeric preflight still consulted the historical
plural wallet while publication used canonical `wishstone`. One private key
mapping now serves both. A valid grant succeeds even if the opaque old plural
balance is MAX_SAFE_INTEGER; canonical overflow remains refused.

BUG582 was exposed when a new main bonus paid wishes before a cache's shard
grant. An observer could overflow that already-paid wish balance; the pending
grant preflight no longer checked it. Every participating current currency
balance is now validated during inventory preflight and before/after claimed
publication. The unsafe grant rolls back and can be retried. Valid independent
same-wallet additions still survive alongside the authored reward. The old
failed overflow assertion is retained rather than weakened.

BUG583 corrects the quest card's raw `wishstones: 15` fallback to the existing
localized labels: `15 祈愿石` / `15 Wishstones`. Formatting stays in the existing
reward presenter; no layout or gameplay flow changes.

## Evidence and limits

Two intended pre-edit failures reproduce the opaque-wallet refusal and missing
main bonuses. Incremental affected checks cover 572 distinct passing assertions
across twelve suites; filtered cases do not count as passes. Final core/family
cases run after the transaction correction. Tests retain XP, point, cache,
retained-item, service, title, source-proof, duplicate, observer and rollback
assertions. Act IV and V verify exact additional 65/95 wishes independently
of table rewards; Staff and Khalim explicitly verify their 20-wish claims.
Exact data comparison removes only the nineteen additions to reproduce the
entire previous main document. The production loader/Ajv validates all rows.
No snapshots were regenerated or completed campaign routes replayed.

Two bilingual card assertions fail before the display fix and pass afterward.
A fresh ordinary browser flow reproduces the old Chinese label before the fix;
four after-cases verify both locales at 360×640 and 1280×800, no document
overflow, an enabled 44px-minimum Start control, no page exceptions or HTTP
errors. Screenshots are retained and inspected. No development bridge, state
injection, import, battle or reward claim is used. This is focused label
verification, not final G5 or owner playtesting. Scoped strict types and
explicit lint are recorded in the final check receipt.

The retained earned pilot claimed seventeen main rows worth 340 prospectively
under the current authoring. Its 23 existing Normal clear flags would add 115,
giving a prospective non-kill total of 455, versus 155 from the starter slice.
That arithmetic never changes its old wallet or replaces its earned history.
New recruitment could alter future choices, so this is not a new campaign,
affordability timestamp, population result or pacing acceptance.

The external packet remains
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Principal receipts are `p15-main-quest-wish-budget-v1.json`, the bug580–583
red/green/browser reports, `p15-campaign-harness-source-audit-v24.json`,
`bug580-583-final-checks-v1.json` and `bug580-583-artifacts-v1.json`.
Authority24 verifies 2,097 source inputs, twelve deliberate transitions and
the unchanged campaign helper manifest. Root retains the worktree and exact
diagnostic/baseline/driver/screenshot paths for full-v1/review consumers, and
owns their later cleanup. Task-local type configuration and caches are removed.

Accepted balance cells remain zero. Full-v1 still requires the remaining quest
budgets, actual L70 Hell faucet, inventory pressure, fourteen-build chronological
acquisition/fairness/holdouts, retry/manual-idle, calibrated 30–50 active hours,
integrated G0–G7, soak, review and the later owner playtest.
