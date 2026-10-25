# D05 — Selected Cleansing duration reduction and recovery

Runtime commit `dcaa59b`; local implementation and verification only.
Independent design/QA and earned class/build balance remain open.

## Delivered behavior

Cleansing now shortens finite Poison/Plague and the exact named curses in the
[family contract](../decisions/D05-paladin-aura-family-v1.md), restores actual HP
and adds authored magical dodge through the existing selected wave projection.
Preserve unlock12, Prayer prerequisite, cap20, lifeRegenPct1.5%/rank and magical
dodge0.5 percentage point/rank. Cleansing-only JSON owns durationMultiplier0.5
and independent healing of20 base HP every5000ms. These new duration/recovery
numbers are provisional local defaults. Prayer-only top-level `auraHealing`
remains separate; there is no Prayer synergy or implicit Vitality regeneration.

Incoming duration applies boss scaling, then the multiplier, then one floor to
at least1ms. Admission/refresh shortens an unmarked record's finite remaining
duration; future starts remain intact. A transient `cleansingShortened` marker
follows that status across waves and prevents repeated compounding. Preserve
source, potency, stacks, start, legacy remaining and max-expiry refresh identity.
Fresh application after expiry qualifies again; an unshortened extension clears
the old marker. Poison death spread consults each recipient's aura eligibility
without inheriting the source marker. Missing/indefinite expiry and unrelated
statuses stay unchanged. Source death never lengthens a shortened duration.
Duration coverage does not establish the other curse skills' promised effects.

Only the living source hero and original living fielded merc benefit while the
hero lives. Existing ownership/kind guards exclude summons, bench and forged
recipients. Crowd control alone does not suppress the aura. Independent healing
uses floor(20 × (1 +0.015 × rank)), giving20/20/26 HP at ranks1/2/20, capped to
missing HP. The first heal waits a full interval after each wave entry. The
shared timeline preserves periodic-death/tie/deadline/action-cap rules, with no
resurrection, banking, RNG, action, cast or mana cost. No new scheduler or saved
timer/potency/status marker; save remainsv22. Ordinary edits apply next wave;
explicit current-configuration replay retains original teams/resources/seed and
pays no duplicate income. Both locales explain the actual effects.

## Verification

| Check | Result |
| --- | --- |
| Final focused regression | 100 tests / 5 files pass |
| Standalone engine regression before last added incoming-curse case | 6,180 tests / 213 files pass |
| Engine project in final complete run | 6,181 tests / 213 files pass |
| Final full regression | 12,346 tests / 523 files pass; two existing skips |
| Final typecheck, global lint/engine purity and subsequent test-file lint | Pass |
| Production build with explicit `VITE_E2E=false` | Pass; existing bundle/PWA warnings remain |
| Production bridge scan | Four chunks, five forbidden patterns absent |
| Final production browser and separate attachment audit | Four language/viewport cases pass |

The final full process took470.176 seconds, run alone. All1,237 source/test/config
hashes,760 build hashes, HEAD/Git state and genuine save digest stayed exact
throughout. All1,237 committed source blobs separately match the validated
hashes. Existing test-time, bundle/PWA budgets, intermittent BUG180 and independent
acceptance remain unresolved.

The first full run retained12,344 passing tests, two failures and two existing
skips over523 files in488.135 seconds. Both failures were stale16-radio assertions
in the two Meditation locales. Cleansing intentionally adds the17th radio. The
correction updates that exact count and additionally asserts Cleansing enabled,
preserving exclusivity, resources and allocations. The corrected19-case file
passes in both the focused and final complete runs. The first run's1,237 source
and760 build hashes/HEAD/Git/genuine digest also stayed exact.

Original causal combat/definition/UI failures, a physical-hit fixture assumption,
strict optional-shape errors, lint failures and the first browser auditor failure
remain retained. The physical curse fixture now checks actual landed hits after
expiry rather than assuming every physical hit lands. No timeout, worker, skip,
assertion scope, gameplay rule or gate was weakened.

## Browser and native integration scope

Final browser coverage is en/zh-CN ×1280×800/360×640 using an explicitly synthetic
imported L12/two-free-points fixture. Public allocation learns Prayer1 then
Cleansing1 without implicit selection, then explicitly selects Cleansing and
None. Eight Save → close → new-page Continue pairs compare all five complete
player/inventory/map/mercs/formation domains. The separate attachment audit checks
exact allocation changes and unchanged other domains.

The first auditor incorrectly used the imported starter combo as its allocation
baseline. Existing Skills sanitization removes passive Holy Fire and
prerequisite-locked Zeal. The corrected flow first exports the prepared baseline,
asserts only `comboOrder: []` changed during that cleanup, then audits allocations
against it. The original auditor failure remains; no runtime change was needed.

Twenty geometry samples across360×640,412×915,640×360,1280×800 and1920×1080 show
no horizontal overflow and all17 radio labels at least44×44. No captured page
errors. All four final screenshots were inspected; mobile captures are scrolled
detail views with existing fixed navigation. This is bounded geometry evidence,
not whole-screen accessibility acceptance.

Native tests use explicitly synthetic large-gear/depleted-resource scaffolding
with real public allocation, engine execution, HP accounting, configuration
replay and save/import. Engine cases measure actual poison HP loss, shortened
Amplify mitigation, incoming curse debuff, duration aliases/carry/refresh/boss
scaling, source/recipient guards, dodge and healing. These do not prove earned
campaign viability, balance, pacing or offline/PWA acceptance.

## Retention and remaining scope

The [manifest](fixtures/paladin-cleansing/manifest.json) retains197 original files
and34 terminal process records, byte-verified in `raw.tar.gz`. Each manifest entry
names its archive member. Scripts, original failures, successful outputs,
source/build hashes, synthetic saves and screenshots remain versioned.
[Cleanup](fixtures/paladin-cleansing/cleanup.json) removed957 exact task-owned
files, verifies scratch-root absence and preview port4466 closure, and reports
no remaining paths or failures. Shared caches and older campaign evidence remain.

Only Cleansing gains a bounded-functional disposition. The213 IDs/order remain:
160 unverified,51 bounded-functional, one bounded-engine-functional (Ice Arrow)
and one review-needed (Cold Mastery). The52 bounded records have different proof
scopes. Sixteen of20 Paladin auras now have supported effects; Sanctuary,
Redemption, Vigor and Concentration remain under BUG181.

The genuine claimed Ancients401/Rite save remains L33 / XP149261 /23,682 gear /
next Normal402, with decompressed SHA256
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
No genuine campaign action, diagnostic-save promotion or remote publication.
Baal, C2–C4/full G0–G7, all skills, seven classes/two builds, economy/pacing,
endgame/offline/PWA/accessibility/performance and independent acceptance remain
open. The full private-v1 goal, branch and claimed worktree remain active.
