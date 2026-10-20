# BUG-012 — Advance ordered quest talk objectives from town interaction

Severity: High (Den cannot complete through ordinary controls).
Status: P04a02 core corrected; localized ordinary town UI follows, 2026-10-20.
Base: `96eb70c`. Owner: frontend/store + narrative/QA.
Environment: Node24.21.0, Vitest1.6.1 UI/jsdom; both locales share logic.
No browser-specific or random behavior in the missing event API. Positive
production Den test uses seed7/ordinal0 and a deliberate strong wiring hero.

## Reproduction

1. Track Den, win all actual waves, then return to town (P04a01 already proves
   the real clear sets only obj-clear-den, leaving obj-return false).
2. Click Akara. TownScreen's button has no event handler and there is no quest
   talk event service. Den remains inProgress and cannot be claimed.
3. Run `npx vitest run --project ui src/stores/quest-npc-talk.test.ts --reporter=dot`.

Expected: a current-town NPC interaction advances matching tracked talk
objectives only after all earlier authored objectives are true. Den completes
after clear then Akara; explicit separate claim grants its supported rewards
once. Talking early cannot bank return credit. Wrong NPC/act/untracked/claimed
records remain unchanged.

Actual: no talk event path; all12 new cases fail with `recordNpcTalk is not a
function` at the baseline (1.75 s; second expanded wiring fixture also red).
Source evidence: TownScreen NPC buttons lack onClick, mapStore has no talk
action. Current UI also renders Act-I NPCs in later acts by fallback.

Root cause: authored talk objectives have no canonical current-act event
boundary or shared NPC roster. Existing dialogue documents already contain
NPC presence but their legacy quest IDs/services do not drive the quest store.

## Controlling plan

Producer plan review: ready. Core owns five files: shared towns projection,
mapStore, focused tests, this report and scoped D11. Project roster from
existing authored dialogue IDs/npcId; no duplicate new data kind. Validate
current-act membership and quest act, original predecessor flags, tracked
inProgress/unclaimed records. Publish one immutable update; repeats/no-ops
preserve state identity, never grant rewards. UI/locales/browser follow.
Den reward proof is limited to actual xp500/gold0/skillPoints1, with level-up
points counted separately. Cold Plains is already open under act-only gating;
this slice does not claim a new unlock or fix its legacy unlock ID.
Security check: pass; no network, credentials, save shape or policy changes.

## Core verification

Test first: 12 cases failed at the missing API before the production patch;
expanded final suite has 13 cases. After the patch,
`npx vitest run --project ui src/stores/quest-npc-talk.test.ts src/stores/quest-area-clear.test.ts --reporter=dot`
passed 23 tests (2.66 s; final status-isolation rerun 2.53 s). The actual Den
fixture wins all waves, then talks and explicitly claims; it proves wiring,
not balance. Status negatives use unclaimed records so the status condition is
independently exercised; claimed in-progress is a separate negative case.

`npm test -- --reporter=dot`: 97 files / 952 passed / 1 existing merc-XP skip,
25.75 s (>15 s budget), at this core plus P05b02 surface integration. Both
locales and both target viewports pass the existing Den/item-art browser
specs, 8/8 in 40.5 s; these existing specs do not yet exercise town talk.
No save schema, reward implementation or engine module changed. The ordinary
localized town talk/claim/save path remains the next required child.

Typecheck, repository lint/engine purity, explicit lint of the new loader/test
and ignored browser spec, and production build pass. Build 5.02 s; existing
large-chunk/unprecached-manifest warnings remain. The loader lint found one
unnecessary optional chain; correction only narrows an already-proven match,
with no suppression or behavior change. Producer independently reviewed all
five core files: APPROVE. Full F09/F10/D11 remain unaccepted.
