# D11 v1a — Ordered current-town talk events

Status: accepted scoped contract, 2026-10-20; P04a02 only.
Producer independently reviewed the concrete five-file plan as ready.
Full D11/F09/F10 remain open, including other objectives, reward kinds,
point budgets, recoverable transactions and later-act towns.

The shared town NPC roster projects existing authored dialogue documents.
Accept canonical dialogue/actN/slug IDs whose npcId matches the slug; expose
canonical npc/slug, portrait slug and locale name key. Current authored ActI
has Akara, Charsi, Gheed, Kashya and Warriv. Missing acts return no NPCs;
never substitute ActI. Rendering raw legacy services/English quest branches
is not authorized by roster membership.

`mapStore.recordNpcTalk(npcId)` accepts exact canonical current-act NPC IDs.
Only matching-act tracked inProgress, unclaimed quests are eligible. A matching
talk objective advances only if every preceding authored objective was true
in the state BEFORE the event. No event banking/autostart or same-event stage
cascade. Preserve unrelated objectives/progress/claim flags; complete a quest
only when all authored flags are true. Publish one atomic update and return
the identical state for no-op. Talking never claims/grants/unlocks anything.

The UI child emits exactly one event per NPC click, then displays compact
localized conversation. Closing, rerendering or switching language emits none.
Akara after Den clear completes its final objective; Quests retains explicit
claim. Positive production combat→talk→claim proof must separate combat XP,
quest XP500, automatic level-up points and the quest's extra skill point.
Current act-only map gating already permits Cold Plains; no new unlock is
claimed here. Unsupported quest rewards/claim-failure atomicity stay separate.

Acceptance: early/wrong/unknown/noncanonical/wrong-act/untracked/status/claimed
negative cases, pre-event stage ordering, unrelated-state preservation,
subscriber count/no-op identity, no automatic rewards, and explicit repeated
claim safety for Den. Following locale/UI/browser children establish ordinary
interaction, both locales, target viewports and save/reload.
