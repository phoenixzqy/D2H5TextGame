# BUG-291 — Apply the paid Amazon Inner Sight to actual Defense

Severity: High. Status: runtime fixed locally in bcb809ed; UI fixed in e4fc315f; integrated/lifecycle/public acceptance pending.
Build: f1fbd1698b6cffc303944683dc45b934d52123fa.
Environment: Linux, Vitest1.6.1/jsdom, locale-independent native engine/store
reproduction; no browser/viewport claim. Seed7. Owner: root (engine/data/UI).

1. Create an actual level30 Amazon, allocate Inner Sight at rank1 or20 through
   usePlayerStore, equip the canonical training bow through useInventoryStore,
   then project with playerToCombatUnit.
2. Use constructed2000HP/100MP pools, no regen/crit/resistance/dodge. Let the
   owner act once at1700ms and then hold it. An original allied mercenary makes
   ordinary100Physical hits against50Defense.
3. Compare identical seeded recordings with the owner held before the cast.

Expected: actual Defense reduction changes the ally's post-cast Physical hit,
with a finite duration and no extra damage/hit RNG. The provisional author
contract chooses25%/8000ms, giving62 damage rather than50.
Actual: both ranks pay5/4MP but ally damage remains50, identical to the no-cast
control. Generic inner-sight status expires after only the generic fallback1s
and carries no numerical effect. The shared damage projection only consumes
merc-inner-sight, a distinct Rogue skill explicitly excluding Amazon.

Evidence: canonical amazon-support-native-diagnostic-canonical.json/log retains
6supportREDs/2Valkyriecontrols. The focused inner-sight-native-red.json/log retains
8featureREDs/4guardcontrolsPASS9.676s, all2451inputs and HEAD exact. Files reside
in /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-amazon-support-ssrbktv_.
The test also checks paid packet clocks, living-tier scope and unchanged cadence;
no weakened or skipped assertions. No player workaround restores this skill.

Root cause: missing authored metadata, timed paid packet and damage consumer.
Fix those existing paths, preserve native ownership/cost/cooldown and Rogue
identity, and use the strongest Inner Sight reduction once when both coexist.
Update current/next/MAX bilingual copy to describe Defense mitigation accurately;
no promised accuracy boost. Independent design/QA and earned balance remain open.
Security check:pass; local first-party gameplay/data/tests, no credentials,
dependency/CI/network/save-format/remote or genuine campaign/replay action.


## Functional implementation and corrected causal observation

30715967 validates finite JSON tuning,bcb809ed applies the paid Defense packet,
e714e91d covers shared consumers/localized chips,e4fc315f supplies actual bilingual
previews.97new focused cases pass;focused definition/runtime/UI types and lint
pass. The initial first1700ms ally hit precedes the tied hero cast,so that hit
correctly stays50;it is not by itself a causal probe. The longer pre-fix recording
retains post-cast5100/6800/8500ms hits50;fixed hits62,with expiry10200ms hit50.
No scheduler,RNG or threshold change. Original diagnostics,first promoted oracle
failure,boundary-order proof,strict fixture/config and Melt1.25 combo corrections
remain retained. [Evidence](../../docs/plans/evidence/d04-amazon-inner-sight.md)
distinguishes this author checkpoint from pending integrated/lifecycle/public,
independent and earned acceptance. No inventory credit or task cleanup yet.
