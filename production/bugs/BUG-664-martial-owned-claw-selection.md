# BUG-664 — Martial preparation rejects owned offensive claw upgrades

- **Status:** Fixed and verified locally — intended preparation only; final umbrella review pending.
- **Severity:** Medium; a player can manually equip an eligible owned claw.
- **Owner / affected systems:** root / intended campaign equipment preparation.
- **Build:** `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus frozen working tree.
- **Environment:** WSL/Linux, Node24.21/Vite SSR. No browser/viewport or locale
  claim; retained native save only. No new combat or RNG consumption.

## Reproduction

1. Read the retained Martial level49/next708 export, SHA256
   `e1888fb3b5f58b9a7d52bfb1a39c018ca88113e10ada1956c90faaee1d47cd4d`.
2. Compare owned weapons with native `checkEligibility`/`prepareCompareEquip`
   and the current `isClearNetUpgrade` predicate; do not rerun failed encounters.
3. Inspect the stashed Greater Claws `it-3k9m-eh6` against the socketed equipped
   Wrist Blade `it-6ytcb-39h`.

## Expected and actual

Intended Martial preparation should allow an owned offensive claw upgrade with
explicit defensive tradeoffs, as the existing physical weapon policy already
does for other weapon-dependent builds. Native claw eligibility remains binding.

The eligible candidate raises the existing basic physical expectation from
278.710037 to329.673792, but loses4MagicResist from the old weapon's diamond.
All-stat nondecrease rejects it. Several eligible Greater Claws are similarly
rejected. Feral Claws still require level50 even with lower item level.

## Cause, evidence and boundary

The Martial profile opts into claw affinity but omits the existing offensive
mainhand policy. This is a preparation omission, not a native equip/combat bug.
Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p15-martial-owned-weapon-v1`.
`diagnosis.json` retains complete signed comparisons and zero native actions;
all2169current source/campaign input hashes match before/after. An initial
task-local import error occurred before any comparison and is retained.

Use the existing physical comparison with claw affinity, no global predicate or
game formula changes. Preserve custody, reserved items, capacity, resources and
all prior failed/exhausted campaign budgets. BUG652 remains Open: better
preparation alone does not prove Izual viability, acquisition, pacing or balance.

## Implemented and verified — 2026-11-03

The Martial profile now opts into existing physical-offense-v1 from JSON level1
while retaining claw affinity. All39affected equipment cases, scoped strict
TypeScript and explicit two-path ESLint pass. RED failures, first GREEN matcher
expectation error and initial matcher lint failure remain in the packet. Later
offhand selection can recover resistance; the regression checks the defensive
tradeoff at the mainhand boundary.

One prospectively bounded retained-save preparation uses28native actions
(26staging, one retrieval, one equip), selects it-3k9m-eh6 and preserves all394
items, costs, quests, level49/next708 and current Life140/Mana87. Native Attack
268→291, LifeMax987→1019, ManaMax500→527, MagicResist50→46. The second call is
byte-exact unchanged. Whole-save readback passes every action; no combat,
clock advancement, income, healing, admissions or renewed budgets occurs.
Successor SHA256: 88fde2d43c6c72b887bcc71221f0b0f84899214a48b9a009c10cd96305699e37.
[Evidence](../../docs/plans/evidence/p15-martial-owned-weapon.md). This closes the
preparation omission only; BUG652 and broader balance acceptance remain Open.
