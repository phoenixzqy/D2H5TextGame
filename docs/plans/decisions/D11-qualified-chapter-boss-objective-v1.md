# D11 v1 — Qualified chapter-boss quest event

Status: bounded P04a05 contract and final producer/QA audits APPROVE; evidence
ADEQUATE. Earned victory and reward support remain open.

Canonicalize only Andariel's target to monsters/act1.andariel and area to
areas/act1-catacombs. Preserve objective ID and reward bag. Generic map action
recordBossKill({actId,areaId,bossArchetypeId}):void advances exact authored
kill-boss objectives only on tracked inProgress/unclaimed quests; unmet target
and all predecessors must already satisfy the pre-event ordering rule. Preserve
unrelated progress, idempotent same-reference no-op. No cascading or history.

Emit once at qualified finalwave settlement: player win, original hero alive,
playback complete, current installed outcome/events identity and run/wave/count,
original chapterboss dead enemy/monster/chapter-boss. Capture its built ID only
from one exact catalog-backed authored chapter spawn and one built unit, with
consistent source archetype IDs. No fallback/name/ID parsing. Provenance gates
only this new event; existing combat XP/loot/clear/finalization unchanged.
Event act/area come from activeRun. Tracking before settlement counts; tracking
after consumed event does not backfill. Real manual/idle fullruns may qualify,
but this card proves manual wiring only. Inherit terminal [0,60000] inclusive
and existing timeout/death rules; no extra level/difficulty/time/RNG threshold.

Completion can trigger existing completedquest OR clearedCatacombs ActII unlock
policy. Unsupported quest reward bag remains refused, no extra8000XP/loot/claim
flag. No auto-tracking, reward grant, save migration or other quest-ID cleanup.
Validate actual engine run with explicit imported wiring gear, independent
negative guards and public exported quest-state equality. This accepts event
wiring only; earned victory, reward support, C1 and broader D11 remain open.
