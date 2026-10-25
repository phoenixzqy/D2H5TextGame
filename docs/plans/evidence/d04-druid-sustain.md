# D04 — Feral Rage and Hunger restore actual life

Runtime `7b7f3b2` repairs BUG193; presentation `801d97f` explains the actual
effects in both languages and localizes existing buff-log identities. Exactly
these two skills receive bounded local functional credit. Independent design/QA,
earned class/build balance and complete private v1 remain open.

## Behavior and controlling contract

[Contract](../decisions/D04-druid-sustain-v1.md) explicitly reconciles Feral
Rage's ambiguous life wording as immediate recovery. New JSON tuning is
provisional: Feral restores10% and Hunger50% of actual direct enemy HP removed;
Feral grants additive5% self attack speed per qualifying hit, cap5, refreshing
8000ms, and applies10%-of-final-hit/s Bleed with the existing3s/cap1 rules.
Only existing direct damage grows with rank. Authored ranges/growth, MP3/11,
cooldowns1/2s, unlocks12/24, full prerequisites and cap20 remain unchanged.
Both attacks work in human/wolf/bear form without requiring a separately paid
transformation. These numbers are neither canonical D2 tuning nor earned balance.

Recovery uses floor(actualHPRemoved*fraction), after absorption and overkill
clipping, capped by missing life. Ordinary target-death/orb and surviving-target
reflection settlement happens first. A fresh surviving caster is read before
healing and again before writing speed, so lethal reflection cannot resurrect
the caster and stack writes cannot overwrite healing. No minimum-one recovery,
mana recovery, additional RNG, or basic/periodic/aura drain is added. Hunger's
inert enemy marker is removed; Feral's formerly dropped secondary Bleed becomes
an explicit primary on-hit payload.

Only fresh sanitized native class-active authority permits Feral self speed.
Finite source-bound stacks are copied and rebased through existing next-wave
clocks; expiry preserves pending action progress, and lost configuration,
prerequisite or class removes speed on the next wave. Fresh runs/imports have
no stacks; Save22 saves no transient field. Initial new contract wording wrongly
implied that all explicit replays freeze allocations. Native verification
corrected this to the existing controlling ordinary current-configuration replay
over original resources/residual clocks. Unchanged configuration repeats exactly;
Iron-locked replay retains captured input. Shared replay semantics are unchanged.

## Causal checks and corrections

The [original native reproduction](d04-druid-sustain-repro.md) has six RED
expectations: four legal paid rank1/20 hits restore0HP and both Feral follow-up
gaps remain1700ms. The original reproduction now passes unchanged. Nine new test
files add114 cases:29 schema,6 pure authority/stack,34 combat,3 pure display,
16 native causal,6 native lifecycle,16 bilingual Skills,2 CombatScreen and2 log
localization. Tests assert actual HP/MP, rank1/2/20 damage/Bleed, absorption,
overkill/caps, reflection, misses/fallback/CD, no later drain or extra RNG,
stack cap/refresh/expiry/phase, paid forms, native rebase/authority/replay/import
and current/next/MAX/unlearned presentation.

Original failures and sources are retained. A real introduced cadence defect
made100*(1+.05*3) round below115 and then floor114. Feral's contribution now adds
before existing Enrage/Chill/clamps without globally rounding non-Feral cadence.
The unchanged exact action assertion passes at
1700,3360,4980,6560,8100,9600,11100ms. Other fixture corrections retain their
original assertions: the engine's5% minimum hit means seed7 did not actually
miss, so established seed1 is used; expired cooldown keys are absent; the paid
bear fixture needs Lycanthropy; initial UI bounds must use actual data. Native
adversarial class/prerequisite tests disclose direct store injection because
public `setPlayer` deliberately aborts a run. This is not a public class-change
flow. Original replay/fixture/lint/UI failures remain in the raw packet.

Production playback exposed raw `feral-rage` text despite existing translations.
Two locale RED tests precede the shared log lookup fix, which resolves existing
`combat:effect.buff` names and retains exact unknown-ID fallback. Unchanged
shared log/CombatScreen compatibility passes168 cases across3 files. Root
source/test/visual review is author self-review, not independent acceptance.

## Production browser proof and limits

Four final en/zh-CN ×desktop/mobile cases have actual terminal exit0 against the
same clean explicit-false build:34.963s,31.821s,33.488s and31.749s respectively.
Public controls create/export/import, Save/close/new-page/Continue, allocate
rank1→2, select attacks, enter Catacombs, Flee and repeat Continue. The attachment
audit separately re-reads eight attack entries with actual positive hero-only
healing logs, eight exact player/inventory/map/mercs/formation Continue pairs,
and20 geometry samples at360×640,412×915,640×360,1280×800 and1920×1080.
Sixteen final screenshots are retained; eight were individually inspected.
Feral has an actual positive blue stack chip and Bleed playback. No page errors.

Fixtures are synthetic L30/full-prerequisite/50000-life-and-mana gear with
attackSpeed−80, critChance+1 and critDamage+0.5. They establish public allocation,
combat recovery and persistence, not earned balance. The first no-crit fixture
produced actual1HP hits and correctly rounded recovery to0. Excess critical
damage then killed the observer's intended living target in three cases. The
final lower critical modifier preserves the original living-target assertion;
all failed attempts, traces and driver variants remain. A scratch audit reused
its payload filename for its command receipt; the payload was regenerated from
unchanged attachments under distinct names. The authoritative payload is
`browser-attachment-audit.json`, with `attachment-audit-command.json` receipt.

Existing mobile nested scrolling/header/nav occlusion and icon/font fallback
remain. In a selected mobile capture the Feral chip partly overlaps the bottom
navigation. Geometry checks do not establish complete mobile/a11y/PWA acceptance.
Existing bundle/precache/Browserslist warnings and runtime/test budgets remain
open. The exact owned preview PID392639 has exited and port4479 is closed.

## Final validation and scope

Final engine: **7027 tests /246 files**,82.206s wrapper wall. Final standard
full: **13519 tests /591 files**, **two existing skips**,482.649s wrapper wall
(481.15s Vitest duration). Typecheck54.720s, lint124.360s, clean production
build11.808s and four-chunk forbidden-bridge scan pass. Focused complete59/4,
UI42/3 including24 existing attack tests, and shared log compatibility168/3 pass.
No assertions were weakened, new skips added or timeout gates relaxed.

All **1316 source/test/config hashes**, **760 final build hashes**, HEAD/Git
status and the genuine-save digest remain exact throughout the final full run.
After both local commits, the audit reads actual committed HEAD blobs and
compares all1316 contents with tested snapshots and disk. The full result is
terminal0; no source changes follow. Retained build hashes replace disposable
build output in the archive.

Exactly Feral Rage and Hunger gain credit. All213 IDs/order remain:
**135 unverified /76 bounded-functional /one engine-only /one review-needed**.
Proof scopes differ; these are not overall completion percentages. Genuine
Ancients401 retains decompressed SHA256
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`:
L33 /XP149261 /23682 gear /nextNormal402 /Nightmare0, Ancients/Rite claimed,
**Baal uncleared**. No genuine campaign or remote action occurs. C0/C1 retain
narrow historical acceptance; C2-C4/fullG0-G7, all-class earned builds/economy/
pacing/endgame, independent review and complete mobile/a11y/PWA/performance
remain open. Root remains sole writer; umbrella goal/branch/worktree stay active.

## Retention and cleanup

[Manifest](fixtures/druid-sustain/manifest.json) inventories every retained raw
file by size/hash; [archive](fixtures/druid-sustain/raw.tar.gz) and four trace
attachments under `fixtures/druid-sustain/traces/` preserve original RED/failures,
scripts, logs/terminal receipts, browser exports/screenshots/traces, freeze maps,
committed-source proof and author reviews. The four original large trace ZIPs
remain separate to keep each committed blob below100MB. Every retained member is
compared with its original before disposal. Disposable production output is
represented by its760 hashes. Exact task cleanup and remaining paths are recorded
in the accompanying [receipt](fixtures/druid-sustain/cleanup.json). Older required
campaign evidence and shared caches remain under their existing ownership.

All **245 raw files**, including **47 terminal command receipts**, are
byte-verified (241 archive members and four original trace attachments).
Exact cleanup removed **1005 task-owned disposable files**; the scratch is absent,
owned preview PID392639 is absent, port4479 is closed, and remaining paths and
cleanup failures are both `[]`.
