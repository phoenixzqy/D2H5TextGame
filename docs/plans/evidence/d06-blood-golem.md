# D06 — Blood Golem life-leech repair

2026-10-26; BUG250; root author evidence only. Core, presentation, native lifecycle
and production browser proof locally verified; independent design/review/QA and
earned balance remain open. Source commits: `aeb19477` and `aa33b6b7`.
[Contract](../decisions/D06-blood-golem-v1.md),
[original bug](../../../production/bugs/BUG-250-apply-blood-golem-life-leech.md).

## Original failure and delivered behavior

Native seed7/L30 paid rank1/2/20 preparations each actually spent25MP at time0,
created one unchanged body, and both the injured hero and body dealt real hostile
damage. The million-HP target survived, preventing kill/orb recovery from masking
the absence. All setup/payment/damage/injury/immutability assertions passed;
friendly healing remained zero. Original RED3failed/two unlearned/poor24MP
controls passed,exit1,7.076s; original logSHA256
`b9ab7e7e209938fc32aed63a841f31a10dac02bc897003d58f6fea7c27b0f485`.
Original test bytes and every failed/corrected run are retained losslessly.

Immutable Ajv2020-validated JSON now owns the unchanged complete Blood Golem
base stats and existing promised10% coefficient. Shared magical mitigation and
14life/2Attack/1Defense rank growth remain. Only successful new qualified paid
preparations receive private battle-local aura bindings. Fresh native selected
learned authority, exact registered source semantics and living original owner/
body identity are required; imported/preloaded/bare/borrowed/changed-source power
is refused. Under actual carried paid Battle Command, learned ranks1/20 qualify
while the unchanged paid body receives effective ranks2/21. Bare markers do not
supply a bonus or replace learned authority.

One shared fresh post-settlement consumer restores the living actual original
friendly hero/merc/summon source by floor(actual hostile HP removed×0.10), capped
by missing life. It covers ordinary basic/skill/component damage, attributed
periodic damage, reflection/Cold armor reactions and Static Field's separate
nonlethal path. Misses, absorption, overkill excess, self/friendly loss, unknown/
dead sources and originally hostile converted enemies grant no recovery.
Multiple paid bodies provide one boolean aura. No new action/timer/RNG/payment/
CD/save field, resurrection or stale resource overwrite.

Periodic damage retains its existing HP-ms integral, damage totals and pooled
playback event. Recovery-only attribution divides each interval's actual HP loss
by contributing source DPS×overlap; largest remainder assigns indivisible HP,
ties keep original source order. Unknown/dead/hostile shares are not redistributed.
Party scope, this attribution and precise rounding are explicit provisional
root-author interpretations of the old aura promise, not independent design or
earned balance approval.

## Regression evidence and corrections

97new regressions in six files:16definition/schema,59engine authority/numeric/
interaction,7pure previews,8bilingual components,5native causal,2native lifecycle/
save-import. Literal100hostileHP→10selfHP covers all seven supported types and
hero/merc/body/other friendly summon; floor9→0/19→1, missing-life caps, overkill,
finite absorption, typed components, self-debits, actual reflection/Cold reactions,
Static Field, periodic attribution, unknown shares, simultaneous deaths, owner/
body death, nonstack, malformed source/ranks/owner and actual paid Command carry
have explicit controls. Recorded/plain,A-A,A-B-A and caller immutability agree.
Native real allocation preserves current recordings, refreshes rank1→2 on the
next wave without refilling absolute resources and reconstructs after real
snapshot/import without persisting aura bindings.

The original numeric draft had incorrect AS300action500ms (actual400ms), a
single poison-event assumption, a seed7miss assumption and invalid targeting/
absorption fixtures. Actual scheduler/RNG/Taunt/finite Bone Armor evidence justified
fixture-only corrections; corrected unchanged-source RED20failed/15controls
passed before production edits. Cold armor's first seed dodged; seed1 proves a
positive real reaction. Presentation/Command RED16failed/58passed exposed hidden
previews and paid carried-rank refusal. A copied Fire defense36preview literal
was corrected to existing Blood defense24, without changing production stats.
No tests were skipped/weakened, thresholds changed or config bypasses added.

The first public run passed English but failed Chinese because the skill name
血魔像 differs from the existing combat body name鲜血石魔. Its observer also
mistook incoming damage for body attacks. The test now matches actual localized
source verbs and respective existing name sources. All original traces/reports/
PNGs/spec bytes remain. A separate explicit lint pass found a redundant Element
textContent fallback; only that unnecessary test fallback was removed. Default
lint excludes tests/**/*.ts; explicit --no-ignore expands checks, changing no rule.
TypeScript's existing include already covers the browser files.

## Final verification

| Check | Final result |
| --- | --- |
| Focused six Blood Golem files | 97passed / six files;12.564s |
| `npm run test:engine` | 8875passed /333files;146.716s |
| `npm test` monitored final run | 17749passed /812files;two existing skips;703.194s |
| `npm run typecheck` final source | PASS107.672s |
| `npm run lint` / engine purity | PASS205.790s |
| Explicit browser-file lint with existing rules | PASS8.229s |
| `npm run check:test-bridge-shake` | Official production build and six-chunk bridge check PASS17.095s |
| `node scripts/check-offline-precache.mjs dist` | PASS756URLs;0.051s |
| Production browser final source | Four/four PASS77.740s;no retries/skips/flaky results |


The first full regression process ended externally with tool exit143 before a
Vitest summary or terminal child receipt. Cause/sender is unproven; its complete
partial log and observed process disappearance remain retained. It is not a pass.
The final unchanged-source monitored rerun is the full-suite result above.
The two pre-existing skipped tests are opt-in authentic campaign continuations:
`tests/sim/production/fresh-campaign-continuation.test.ts:9` and
`tests/sim/production/fresh-campaign-economy.test.ts:9`. No campaign was selected.

## Production browser and visual limits

Final official production bytes, no VITE_E2E/bridge, four en/zh-CN desktop/mobile
cases PASS77.740s. Each public import/equip/keyboard allocation19→20/current-next/
MAX flow enters real Catacombs, pays25MP once, creates one actual body, observes
two outgoing Physical body hits and positive localized hero recovery5HP. Public
DOM observation only; no engine/store/debug window access. Four localized casts,
eight exact six-domain online/offline save pairs, four actual activated-SWoffline
Continues and zero page/console errors. No transient aura authority is saved.

20geometry samples span360×640,412×915,640×360,1280×800,1920×1080: no document
horizontal overflow and Allocate48pxhigh/at least120pxwide; keyboard Enter works.
All16finalPNGs were individually inspected. Desktop title/descriptions/MAX and
10%row are visible but lower stats extend below the frame; English attack type
is clipped. Mobile title captures show first description paragraphs; English
stats capture shows Current heading with rows below bottom navigation, while
Chinese shows cap/leech/Physical rows. Body crops show complete localized name/
portrait/life bar (English wraps on mobile); combat captures show actual +5chip
and body but lower enemy rows/log exceed viewport. Existing icon glyph boxes,
header/nav occlusion and black capture tails are disclosed. DOM/numeric checks
prove values; these finite screenshots do not prove complete panel visual,
safe-area,contrast,screen-reader,all-touch-target or general WCAG/G5 acceptance.
Synthetic imported levels/gear/pools are functional scaffolding, not earned
progression, affordability, TTK or class balance proof.

## Source, retention and cleanup

[Fixture index](fixtures/blood-golem/index.json) binds the final public attachments,
source/build/validation receipts, original reports and author audits. All1417frozen
source/config/test paths match actual Git blobs at`aa33b6b7`; all762build files
match the served official bytes.27terminal receipts have verified complete log
hashes, plus the separately documented externally interrupted full-run log.
All16finalPNGs are individually reviewed; original failed browser trace is retained.

Root retains these exact paths through BUG250/full-v1 evidence consumers and
will remove them after those consumers finish:

- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-blood-golem-bogayo0q-retained.tar.xz`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-blood-golem-bogayo0q-retention.json`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-blood-golem-bogayo0q-deletion-manifest.json`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-blood-golem-bogayo0q-cleanup.json`

ArchiveSHA256`e1613149d3c757a8a8e2fde53ad336e3eb7262be11291f2e2007797157244e69`;
all4699raw members were read back/hash-verified losslessly.3282exact task-owned
files and41empty directories were removed after their consumers finished.
27recorded process identities are no longer live, no readable task consumers
remain and4535was available.24restricted optional`/proc`entries limit global
visibility; no broad process termination was attempted. Cleanup remaining[] and
failures[]; the external cleanup driver was removed after it finished. Task root
and`dist/`are absent. Shared caches, tools, source and Git history remain.


## Acceptance boundary

Author five-axis/root-cause review found no remaining blocking local defect in
this stated contract. Test-evidence review is locally adequate for the specified
functional routes; overall independent sign-off remains INCOMPLETE. Root author
review is not an independent reviewer, designer or QA approval. Unresolved
bundle/test-time/PWA/performance budgets are not waived by these passes.

Exactly one Blood Golem credit:161bounded-functional/50unverified/one
engine-only/one review-needed; Necromancer19/32. All213IDs/order, the raw header
and212other raw rows are unchanged. This measures bounded skill functionality,
not a whole-game completion percentage or independent/earned class acceptance.

Genuine retained Ancients/Rite remainsL33/XP149261/nextNormal402/Nightmare0,
Ancients-Rite claimed/Baal uncleared. Compressed/raw hashes are unchanged. Only
hash/decompression inspection occurred, with no genuine campaign/replay or remote
action. C0/C1 retain narrow historical acceptance; C2-C4/fullG0-G7, all-class earned
builds/30–50hour pacing/economy/endgame/independent acceptance and full privatev1
remain unfinished. Umbrella goal/worktree stay active. Next reconcile the remaining
Necromancer summons against accepted current contracts, without blanket credits.
