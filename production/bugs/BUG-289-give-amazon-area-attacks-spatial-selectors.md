# BUG-289 — Give Amazon area attacks explicit spatial selectors

Severity: High. Status: fixed locally in `8ff84618`/`61fbe690`;current integrated/browser validation pending.
Build: 9f04c8a8; Vitest1.6.1/jsdom on Linux; engine diagnosis, no viewport claim.
Locale: locale-independent; existing en/zh-CN skill promises inspected. Seed7.
Owner: root, engine/data/schema/UI/QA; independent acceptance open.

1. Native L30 Amazon, actual prerequisite/skill allocation at ranks1/20, canonical
   training bow equipped through store; project through playerToCombatUnit.
2. Isolate one paid action at1700ms,zero mitigation/dodge/crit,2000HP/100MP.
3. Three living enemies at(0,0),(0,1),(1,0),one distant at(9,9); reorder the distant
   enemy immediately after primary to distinguish spatial order from array order.
4. Check actual target IDs,typed damage,MP/statuses,HP,replay and input immutability.

Expected: Fend covers surrounding enemies; explosions select their footprint;
Lightning Fury chains nearest neighbors through all original living enemies.
The exact Fend cross/cap5 and explosion box3×3/cap9 are provisional author v1
choices in [the author contract](../../docs/plans/decisions/D04-amazon-area-v1.md),not inferred final balance approval.

Actual: Fend/Exploding/Immolation use first-two fallback; Fend omits a third
adjacent enemy. Reordering candidates hits a distant enemy instead of the nearby
ones. Fury covers all but follows input order rather than the documented chain.
Initial diagnosis2Fend failures/six observational controls9.756s; full proposed
contract8REDs9.023s. One initial external afterAll URL observer failed under
jsdom; absolute task-owned output fixed without changing gameplay assertions.
Initial physical third-hit guess90 was wrong; independently sampled Mulberry32
proves76 at rank1/190 at rank20. Original draft/source/log retained.

Root cause: omitted aoeShape on three area skills; Fury all-enemies route bypasses
chain selection. Reuse shared area/chain selector with exact JSON/schema tuning,
without adding skill-specific combat branches. No existing player workaround
restores targeting. No campaign/save/remote action. Root owns all current raw
artifacts in /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-amazon-area-8f7ngk0q
through validation and exact retention/cleanup. Javelin full18901/870 is terminal PASS with verified retention/cleanup. Original
full-v1 objective remains open.

## Repository implementation

`8ff84618` activates exact schema/JSON spatial selection and29native/schema
regressions;`61fbe690` adds source-backed bilingual previews/40UI cases. Native
lifecycle8 and public production pair now committed. Focused native/schema/UI/
lifecycle/static checks pass;engine9661/365 passes166.985s. [Evidence](../../docs/plans/evidence/d04-amazon-area.md)
retains exact commands and original oracle/config/command-path errors. Fresh
integrated full/static/build/public checks pending;no skill credit yet.
