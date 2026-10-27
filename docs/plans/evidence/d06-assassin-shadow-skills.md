# D06 — Actual Assassin shadow skill use

Local implementation checkpoint,2026-10-26. Root author only; independent
design/technical/QA and earned balance remain open. No shadow inventory credit
before actual charge/trap mechanics and final copied-runtime acceptance.

## Behavior

Warrior captures the owner's ordered, deduplicated, selected and legally learned
Assassin attack skills. Master uses strict JSON-authored independent priority:
Mind Blast, Fire Blast, Blade Fury, Dragon Talon. Passive/personal-buff/recursive
summon sources are excluded. Recursive prerequisites, level and allocations are
validated. Exact registered source semantics and recomputed owner plans qualify
the batch before payment; only newly committed paid native bodies receive private
battle-local attack bindings. Forged/preloaded bodies gain no copied authority.

Warrior captures min(owner attack rank,shadow rank); Master captures shadow rank
capped by attack maximum. Bodies spend their own authored100/150MP and cooldowns,
try later affordable skills, then basics. No new refill or regeneration. Owner
pays startup plus its own actions. Captured order/ranks remain immutable; actual
party Command adds one use-time bonus without rewriting learned ranks. Existing
startup cap/one-payment/no-refund/no-retry and all non-mana body tuning remain.

Fresh waves rebuild native projection from current allocation/priority and pay
again from carried owner resources. Save/import retain learned configuration,
never body bindings or transient plans. Actual town respec removes fresh setup.
Bilingual previews preserve startup/payment detail and show policy, own mana and
current/next/MAX rank cap. No save version, global RNG or dependency changes.

## Causal and branch evidence

BUG299's original four native allocation/payment/body/basic-damage controls
failed actual skill use; the same four now pass. Original missing-preview REDs
and source-backed test/harness corrections are retained.

Six implementation increments are independently verified and committed:
d8f2bcf9 unchanged body extraction (163/4),6f4efd87 policy (196/3),bfc4e805 own
mana (159/3),a7498e34 paid runtime (214/5),482b300d model (98/2),33c883c2
bilingual preview (78/2). Each has passing strict types and inherited lint.
d4bce21f adds permanent lifecycle/public tests: six actual native next-wave,
selection/rank capture, resource-carry, validated import and town-respec cases
PASS8.546s; scoped types/lint pass. Across these final focused batches,396
distinct cases/10files pass. Exact original19source hashes match promotion.

Real branch production build PASS12.831s atd4bce21f/all2509inputs exact:
762files/sixJS chunks, all five bridge patterns absent. Offline verifier passes
756uniqueURLs/all required assets present. Engine/i18n chunks equal prospective
build; four app/data/index/service-worker outputs differ. Existing chunk-size
and2.57MB art-manifest precache warnings remain; performance/fullPWA not accepted.

## Prospective public evidence and remaining gates

Before branch promotion, the exact runtime/UI source overlay passed8/8 public
cases187.274s: both shadows/en/zh/desktop/mobile/rank1/20. Sixteen paid native
summons and actual Fire/Arcane skill hits with damaged enemy health,80priority
control geometries,16exact seven-domain online/offline pairs and eight actual
service-worker offline Continues; zero skips/retries/flakes/page warnings/errors
and no production __GAME__. Synthetic level/prerequisite/resource fixtures are
not earned progression or affordability evidence.

All32PNG bytes retained;16mobile originals individually viewed. Names/ranks/
own MP/policy are visible. Long copy requires scrolling; lower rows are cropped
behind fixed nav, English edge labels clip, emoji glyphs show fallback boxes,
and compact shadow portraits fall back to initials. Element captures are not
whole-viewport, touch, keyboard, accessibility or whole-app/art acceptance.
Actual typed casts are asserted in log/DOM proof, not inferred from body images.

The permanent public test/config now use repository-relative imports/server
root. Actual-branch browser rerun plus consolidated engine/full/static checks
remain. Actual charge/trap runtime and copying must land before full shadow
credit. Inventory190bounded/21unverified/oneengine-only/onereview-needed and
genuineL33/Ancients-Rite/next402/Baaluncleared remain unchanged.

## Retention and ownership

[Compact packet](fixtures/assassin-shadow/packet.json) retains exact receipts,
source commits, visual limits and original support archive/cleanup metadata.
Current root-owned task remains necessary for branch browser/broad validation:
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-assassin-shadow-mozsnhn6.
Root archives/read-backs and removes exact owned paths after consumers finish;
never follow node_modules or src/engine/types symlinks. No current whole-task
cleanup is claimed. Original support task was cleaned only after6961archive
members read-back verified; raw archive/two sidecars retained through full-v1
and independent evidence review, eventual removal owned by root.
