# D05 — Finite personal Bone Armor / BUG179

2026-10-24. Implemented locally on feat/playable-foundations, baseline39ebb35.
Root sole writer/self-review; independent design/QA, earned class/build balance,
C2–C4 and full G0–G7 remain open.

Bone Armor now supplies one personal pool of12 absorption per allocated rank at
fresh area-run entry (unlock1/cap20/240). It absorbs already-mitigated direct
and periodic damage, including reflected thorns, without changing saved stats,
HP maxima, mana, costs, cooldowns or RNG. Dodge consumes nothing. Landed-hit
statuses and Frozen Armor contact retaliation retain their conditions; physical
reflection uses HP actually lost. Shatter still executes through shield and life.
Periodic lethal timing includes the remaining shield, with existing death order.

Exact aliases resolve once from an eligible Necromancer allocation; malformed,
duplicate, foreign, dead and nonhero payloads supply no shield. The original
pool is independently copied at engine registration. Fresh challenge resource
restoration occurs after native projection, so a hero entering from zero HP is
armed after that separate policy restores life. Residual capacity carries across
waves without refill; upgrading/respec applies to the next fresh run. Explicit
replay uses its original input pool, without income or new capacity. Save format
is unchanged: allocation persists, the transient shield does not.

Both locales explain the actual run boundary and damage scope; Skills current/
next values agree with12/24 and positive combat chips show remaining capacity.
Damage/DoT logs distinguish absorption from HP damage. The schema accepts the
exact authored passive shape and rejects contradictory effects/scaling.

## Verification

The baseline yields10causal native/direct/periodic failures, and four bilingual
UI cases fail the stale description/chip contract. An additional native zero-HP
fresh-entry failure exposed an early life check; the final adapter/registration
split repairs it. Earlier fixture/type/lint/browser failures and corrections are
preserved without skipping assertions, widening timers or suppressing validation.
The multiwave native fixture uses constructedL30/rank19 and deliberately large
life/mana/Attack equipment, establishing carry/replay rather than earned balance.
Paid town respec with active Bone Armor is not newly browser-tested.
Final focused28cases/7files, engine6010cases/202files (91.49s Vitest), typecheck,
standard lint/engine purity and explicit lint of all16changed TypeScript paths pass.

Final unchanged full retry: **12139 passed / 511 files**, two existing skips,
427.85s Vitest / 429.22s process. All1222source/test/config hashes, HEAD and complete
Git status stayed unchanged during that run; all760build hashes and the genuine
save digest are exact. Runtime commit1ee014a and UI/browser commit8acecc3 preserve
those exact tested source inputs. Current independent acceptance is not claimed.

The first complete run is a retained failure:12138PASS/oneFAIL/two existing skips,
510passed/onefailed file,575.578s process. BUG180 records a5000ms cold inventory-
first import timeout; its unchanged13-case isolated diagnostic passes, with
player-first1747ms/inventory-first1505ms. No deterministic cycle, gameplay defect
or Bone Armor causation is established. The timeout remains an unresolved QA
observation despite the passing controlled retry; the failed run is not a pass.

The clean explicit-VITE_E2E=false build passes all five bridge checks in four JS
chunks; all760build hashes are retained. Production browser4/4 covers fresh native
L1 allocation (no imported eligibility), actual12/24 details, passive exclusion
from active slots, and explicit Save→close→new-page Continue in en/zh-CN at
1280×800 and360×640. Four decoded Continue attachments compare complete player,
inventory,map,mercs,formation; errors[], no transient pool in saves, no debug bridge.
Twenty geometry samples cover360×640,412×915,640×360,1280×800,1920×1080 with no
horizontal overflow and allocation control at least44px. English desktop allocation
and Chinese mobile Continue images were inspected. The mobile screenshot is a
scrolled section of the long detail panel; its title
is outside the unobscured portion of that viewport. This observation does not
establish an unscrollable-control defect. Icon glyph boxes remain; no whole-screen
accessibility or earned build/balance acceptance follows.

## Retention and limits

[Fixtures](fixtures/bone-armor/) retain117raw files and26terminal process records.
`raw.tar.gz` holds ordinary logs/reports/audits/screenshots; four original failed
browser trace ZIPs are retained separately under `traces/`, each below30MB. The
manifest maps every original relative path to its retained artifact, size and
SHA256. Every archived member and copied trace was byte-verified before cleanup.
Both760-file disposable builds are excluded from retention; their hashes remain.
[Cleanup](fixtures/bone-armor/cleanup.json) records exact removal of1637task-owned
files, scratch-root absence and port4461closure, with no remaining paths/failures.
Shared caches, installed tools, source/history and older campaign evidence remain
under their existing ownership. Existing test-time, bundle and PWA warning budgets
remain open.

Nine earlier functional records are separately reconciled in
[the inventory audit](skill-inventory-reconciliation.md); they are not nine new
implementations. Only Bone Armor receives a new bounded-functional disposition.
All213IDs/order remain,174unverified; Cold Mastery remains review-needed. Genuine
claimed Rite/Ancients401 save remains decompressed SHA256
c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577, nextNormal402.
No genuine campaign action or diagnostic-save promotion occurred. Baal, all-class/
build/economy/pacing/endgame/PWA/performance acceptance and independent final
review remain open. Work is local; the umbrella claim/branch/worktree stays active.
