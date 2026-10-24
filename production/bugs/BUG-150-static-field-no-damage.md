# BUG-150 — Make Static Field damage enemy health

Severity: High. Status: fixed locally; independent acceptance pending. Owner: root/engine,
game design, frontend and QA. Current source: `b67f0a0`.
Environment: actual production skill registry and deterministic engine via Vite
SSR; no browser or campaign control. Seed1, heroL24, ranks1/20.

1. Load the actual default skill catalog.
2. Give a hero sufficient mana and the real `sorceress.static_field` priority
   and learned rank. Hold further hero actions after1701ms and hold the enemy
   throughout to isolate the first real cast at1700ms.
3. Use a1000HP enemy with zero lightning resistance/MR.
4. Inspect the resulting health, mana and ordinary recorded events.

Expected: the player-facing Static Field damage promise changes enemy health.
Actual: at both ranks a real cast spends mana and emits `status:static-field`,
but target health remains1000 and there is no damage. This is a missing effect,
independent of whether the current Duriel build can win.

Root cause: `src/engine/skills/dataCatalog.ts` adapts the damage-free JSON row to
a generic debuff; `src/engine/combat/combat.ts` applies a marker without an HP
consumer. The213-skill inventory already flags this consumer as unverified.
Workaround: other damage skills work; Static Field itself has none.

Evidence: exact script/log/JSON at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-respec-b3pdijst/static-field-before.{mjs,log,json}`.
Root retains these through the fix/review/full-v1 consumers and removes them
afterward. No source mutation or earned campaign entry was used in this proof.

Canonical design reference checked2026-10-24:
https://classic.battle.net/diablo2exp/skills/sorceress-lightning.shtml#staticfield
It specifies25% current health, lightning resistance, diminished repeat damage,
and a33% maximum-health floor in Nightmare. The H5 adaptation must explicitly
reconcile its no-range rule, rank scaling, independent MR, nonlethal behavior,
floor-aware priority, and immutable difficulty before implementation. Do not
silently copy unrelated PvP/Hell/range rules or tune Duriel around this omission.

Next: close a bounded data/engine/store/UI contract; causal rank1/cap/negative
tests; preserve deterministic recordings/carry and currentSave21; verify real
production casts and then screen the exact earned input using only legal point
allocation. No diagnostic projection becomes authoritative campaign progress.
Authoritative earned save remains L24/SP2/next258, raw SHA256
`458c75cc6b609f1b15cdb6d77fd8435917cad10d1df9d1525a1925a9917f1fd7`.

Local resolution: [Static Field evidence](../../docs/plans/evidence/d04-static-field.md).
Real catalog casts now damage current health; rank/floor/eligibility/replay/UI
controls pass. Duriel remains unchanged. All full-v1 gates remain open.
