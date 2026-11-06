# BUG-607 — Apply the intended lower-level training policy in Act II

Status: fixed locally; affected checks and bounded earned comparison verified. Severity: Medium.
Found: 2026-11-02. Owner: root (campaign preparation/QA).
Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus retained local changes;
production authority77. Environment: WSL/Linux native engine; no browser,
viewport or locale dependency. Admission263, native seed4076355348.

## Reproduction

1. Restore authenticated p15-intended-lost-city-successor-v1.json at22.
2. Use the most recently cleared Lost City to earn Arcane target28.
3. Complete admission262, then enter263 and reach wave4.

Expected: an intended profile declaring cleared-level-margin-v1 trains in an
already cleared challenge whose full enemy maximum is at least two levels below
the hero. Prior clear alone does not establish a safe training area.
Actual: Act II preparation uses the last cleared area without the profile's level
margin. Lost City challenge maximum26 exceeds hero22; second farm draws after60s
with five Greater Mummies alive. Hero555Life/315Mana, Prayer dead; no Arcane entry.
The original earned diagnostic is terminal; do not extend or discard its costs.
Native player rotation remains configurable; a player can farm an earlier area.

Evidence in /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1:
p15-intended-arcane-prepared-v1.json/.journal.jsonl.gz/.native-export.json;
p15-intended-arcane-prepared-v1-readback-v2.json (passed without replay).
Two admissions/ten waves/nine wins/one draw;26200XP,63 acquired/41 salvaged items.
Combat231912.19195404762ms, terminal22/nextNormal264. Reader v1 partial zero-delta
shape error is retained; v2 verifies every native component and award-state equality.

## Scope and plan review

Affected: tests/campaign/act2-area-preparation.ts and its regression cases.
Select the highest full-challenge maximum among cleared Act I/II areas within
hero level minus2 for profiles already declaring cleared-level-margin-v1.
Re-evaluate at every training boundary; audit using each recorded entry level
and prior clear custody. Fail before admission when no eligible area exists.
Historical profiles without the policy preserve their current training behavior.
No skill/monster/XP/item tuning, no fresh balance acceptance, no earlier campaign
replay. Test selection, absence, selection updates and audit rejection; run only
affected Act II cases and scoped types/lint. Native earned follow-up remains
separately bounded and keeps all conditional ancestry/failures/costs.

Plan review: ready; fixes source selection before admission, with independent
record audit and no weakened budget/outcome assertions.
Security check: pass; authorized local policy/test/docs/evidence only, no install,
network, credentials, CI, user-save mutation or publication.

## Resolution and verification

`actTwoTrainingSource(level, cleared)` selects the highest complete challenge
maximum within level minus2 across prior-cleared Act I/II areas, with ID tie-break.
Intended preparation records the policy and reselects before every farm. No
eligible source stops before an admission. Audit selects from each recorded
entry level and prior-clear custody; the current live map is not an audit input.
A victory cannot retroactively qualify its own training source. Historical
profiles without the policy retain their original selection and fallback.

Both new behavioral cases failed against the original implementation. All37
affected cases pass, including source changes as levels grow, no-source refusal,
four consistently relabeled source forgeries, historical retries and budgets.
Final scoped strict types and explicit lint pass. A readonly test assignment and
typed redundant audit condition were corrected; original failed receipts remain.
Only the four changed forgery cases were repeated after their fixture correction.
No unrelated suites or earlier campaign route were replayed.

Successor freeze: p15-act2-safe-training-policy-freeze-v1.json. Production77's2142
inputs are exact; the113-input campaign successor changes only this helper/test
relative to the area-curse freeze (eight cumulative campaign changes).

Earned comparison p15-intended-arcane-prepared-v2 uses the corrected shared
selector from the same authenticated Lost City22/ordinal262 source. It selects
Dry Hills(max20) twice: two admissions/nine waves/eight wins/one defeat,16810XP,
60acquired/45salvaged items,117786.32916818483combat ms; terminal22/ordinal264.
Independent journal/export/custody/economy/points/clock/seed/party readback passes.
The second admission loses after Prayer dies in wave3 and hero enters wave4 at77
Life. This is a separate survival finding (BUG-608), not a failure of the fixed
level-margin selection. No Arcane entry, new quest action or balance acceptance.
Both terminal diagnostic histories/costs remain; never extend either branch.
