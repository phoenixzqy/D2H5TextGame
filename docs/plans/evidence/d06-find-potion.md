# D06 — Find Potion finite corpse recovery

Source `ef6e8dfc`. Root is sole author/reviewer. Local bounded functionality;
independent design/QA and earned balance remain open.

## Behavior

Find Potion consumes one oldest actual enemy-monster body from the existing
CE/PE/vine/Redemption FIFO, pays2MP and its rank-scaled cooldown, then restores
floor(maxHP*(10%+0.5pp/rank)) and floor(maxMP*(5%+0.25pp/rank)), capped after
payment. Ranks1/2/20 at1000HP/100MP give100/105/195HP and5/5/9MP before caps.
Require a living hostile and useful HP or net pre-payment MP gain. Empty supply,
full pools or an ineligible actor skip without payment, corpse use or RNG.

Exact native learned Barbarian authority, immutable copied projections and
registered semantics prevent old markers from granting power. Current rank is
recomposed each wave; playback applies ordinary heal/mana events once. Save22
persists configuration only. No potion, item, extra orb, XP or reward is granted.
Bilingual current/next/MAX descriptions expose the real recovery and skip rules.

## Validation

112 new tests:37 definition/schema,62 causal,5 native and8 bilingual UI.
Final focused112/4 and engine8261/308 pass. Full unit16656/751 passes with two
existing skips (715.27s process). Final types/lint, production build,
actual755-URL precache guard, corrected five-chunk bridge scan and explicit
browser-file lint pass. The final focused command also supplied an unmatched
dataCatalog.test.ts filter; it ran four actual files/112tests, not the loader.
The existing real loader was covered by earlier focused runs and the full suite.

Production en/zh-CN × desktop/mobile:4/4, retries0. Public create/export/import/
equip/allocate/Blood Moor/playback/Pause/Flee/Save/fresh Continue, eight exact
six-domain save pairs, four actual service-worker offline Continues and20geometry
checks. Allocation controls48px; no horizontal page overflow. Each retained log
shows a real death before consumption and19HP capped recovery. Imported synthetic
characters establish mechanics, not earned progression or balance.

All eight final screenshots inspected. Desktop captures show recovery feedback;
mobile combat captures show later log rows, with the recovery outside the visible
capture. Mobile preview edges overlap existing fixed header/navigation. General
UX/a11y remains open. The resource observer used the wrong HP label and captured
only stable MP1181; browser evidence does not prove exact MP debit/gain. Causal
tests prove that arithmetic. Initial-page console errors were empty; fresh-page
pageerrors were asserted. No claim about all console warnings is made.

Representative captures: [desktop en](fixtures/find-potion/find-potion-desktop-en-combat.png),
[desktop zh-CN](fixtures/find-potion/find-potion-desktop-zh-CN-combat.png),
[mobile en preview](fixtures/find-potion/find-potion-mobile-en-skill-preview.png) and
[mobile zh-CN preview](fixtures/find-potion/find-potion-mobile-zh-CN-skill-preview.png).

## Failures and limits

Original six-test native RED retained. Three first-green assertions omitted normal
death-orb recovery; the corrected oracle accounts for actual orb events separately
while retaining exact skill-heal assertions. Registry test setup was corrected to
the real one-argument registerSkill API; source typing gained optional tree.
The first browser case timed out after body creation under ordinary1x playback;
three cases did not run. Final cases use the public4x speed control, with unchanged
timeouts, retries, workers and assertions. The failed trace/screenshot remain raw.
Final lint corrected a test-only non-null assertion. The original bundle audit's
overescaped word boundaries were corrected and all five chunks rescanned clean.
BUG180/237 and test/build/bundle/performance budgets remain open.

## Integrity and disposition

All1255 frozen source/config/test/contract files match committed implementation
blobs;761 build files match recorded hashes. Three post-build changes are tests/
spec only. The other29 raw Barbarian JSON objects remain byte-exact.

Only Find Potion gains credit:146bounded-functional/65unverified/one engine-only/
one review-needed; Barbarian27/30. Other212 raw CSV rows and all213 IDs/order are
exact. Cold Mastery stays review-needed. BUG225 remains open for Find Item and
Grim Ward; Battle Command is also unverified. A separate Find Item contract is
drafted for the next repair, with no implementation or credit.

The genuine Ancients401 decompressed hash remains
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`:
L33/XP149261/nextNormal402/Nightmare0/Ancients-Rite claimed/Baal uncleared.
No genuine campaign or remote action. C0/C1 retain limited acceptance; C2 is
underway. C3/C4/fullG0-G7, all-class earned builds,30–50hour pacing, economy,
endgame and the full privatev1 remain unfinished.

[Contract](../decisions/D06-find-potion-v1.md),
[BUG225](../../../production/bugs/BUG-225-barbarian-corpse-skills-ignore-bodies.md),
[packet](fixtures/find-potion/packet.json),
[terminal results](fixtures/find-potion/terminal-results.json),
[browser audit](fixtures/find-potion/browser-audit.json),
[source identity](fixtures/find-potion/source-delivered.json),
[integrity](fixtures/find-potion/integrity-delivered.json),
[inventory audit](fixtures/find-potion/inventory-audit.json) and
[author review](fixtures/find-potion/author-review.json) retain exact conclusions.

## Retention and cleanup

Root retains [d2h5-find-recovery-retained-vx2tnouk.tar.xz](/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-find-recovery-retained-vx2tnouk.tar.xz):
172 regular members, 43548420bytes, SHA256
`38e6fab72a6adfdd780eac252ac8b0b8f9e43e569ee35065675eb541922a807f`. Every member was byte-verified. 881 unpacked trace duplicates were
compared directly with byte-identical retained failure-ZIP entries; the archive
retains their exact path/hash/ZIP mapping and all unique artifacts. Disposable dist/runtime
were excluded. Root removes this exact archive after original failure diagnosis
and all full-v1 evidence consumers finish. [Retention](fixtures/find-potion/retention.json).

[Cleanup](fixtures/find-potion/cleanup.json) removed2354
exact task files, including761build and
541runtime files. All661
recorded PID/starttime identities and3profiles are
absent;4520closed; no process killed. Scratch absent, remaining[]/failures[].
Source/history, genuine save, shared caches/tools, prior archives and the active
umbrella worktree/branch/claim are preserved.
