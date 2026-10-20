# P04a07c — Authored Andariel unique reward

Inputc6f27ad; generic claim dependency3fa3eb8. Claimed human worktree2 on
feat/playable-foundations. Linux Node24.21.0/npm11.19.0. This activates the
approved new bounded design in [D11](../decisions/D11-explicit-unique-quest-rewards-v1.md)
and [spec](../../design/quest-unique-reward.md), not an existing runtime defect.
Designer/technical, producer and QA plan READY before tests/content changes.

Actual quest is quests/act1-sisters-to-the-slaughter with sole obj-kill-andariel.
Expected reward bag is exactly8000XP,0extraSkillPoints and one explicit Coif of
Glory ilvl19; remove only its quest lootTable reference. Other row metadata,
unlocks, quests, normal boss loot and unused treasure class stay unchanged.
No kill-award call, additional table picks, gold conversion or automatic claim.

FrozenRED9=2missing authored-activation failures/7unchanged persistence controls,
0pending/todo4.631s. One fails exact loaded authored bag; one fails actual-bundle
claim (`unsupported-rewards` rather than `ok`). JSON/handler unchanged at RED.
Test-only typecheck10.960s and targeted lint5.891s pass. Source-backed oracles use
actual quest.id and player.id for complete seeded item plus ID-draw prefix,
hero+8000 progression, merc starting baseline+6000, exact otherwise unchanged
inventory/map, once-only autosave/export/import/hydration. Only IDB IO faked.
Synthetic objective completion is integration wiring, not earned Andariel victory.
Producer/QA frozenRED APPROVE/ADEQUATE before content edit. Byte-identical
new tests GREEN9/9,0pending/todo4.612s after exactly one reward-row edit.

First related1324=1323pass1old-contractfailure40.276s: existing combat-objective
test expected explicit authored Andariel claim unsupported. Approved activation
requires ok. Producer and QA independently approved only that explicit-claim
section replacement, preserving automatic completion/no-extraXP checks and all
new frozen C assertions. New checks require+8000XP, exactly one appendedCoif19
with prior bossloot prefix unchanged, claimedflag and no changes on secondclaim/
idleadvance. Original test and failed report are retained; no runtime fix.
Amended related1324/62 pass45.265s, amended typecheck25.184s/lint56.694s purity53
pass. Pre-amendment typecheck21.816/lint52.532 also retained. Full unit2825/147
0pending/todo39.958s pass; guarded production build9.191s pass after all tests
exited. Existing build warnings and exceeded timing budgets stay unchanged.
Independent producer/QA final audits APPROVE/ADEQUATE and explicitly released
retention. Root removed exact RAW/dist/node_modules/.vite and verified absence;
no task processes, original checkout clean on main.

Root owns RAW
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-andariel-reward-3kag9fe5
and task-created dist/node_modules/.vite (absent after B cleanup). Retain until
independent final consumers release, then exact cleanup/absence verification.
No server. Actual production localized desktop/mobile claim/save, earned boss,
C1/C0–C4/G0–G7/fullv1 remain open. No push/PR/merge/deployment.

[Outcome packet](fixtures/p04a07c-outcome.json) retains exact commands, counts,
source/report/log hashes, complete failed/scoped assertion lists,5source/plan
snapshots and one-row byte-preservation checks. No oracle changes in new C tests.
