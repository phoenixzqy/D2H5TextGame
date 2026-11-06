# Private v1 implementation handoff — 2026-11-05

The owner's current goal is to finish production implementation and stop
agent-run gameplay testing. Gameplay acceptance, balance and measured pacing
are a later owner activity. Earlier requirements to continue campaigns,
independent gameplay certification or soak runs do not hold this handoff open.
CI remains removed. Historical failures and unknown measurements are preserved.

Status: the source implementation goal is complete under this revised scope.
Owner gameplay acceptance remains deferred. Earlier ledger entries that keep
the goal active for campaigns, balance certification or pacing measurements
are historical and superseded by the owner's execution update.

## Current implementation coverage

This table records source implementation, not a new gameplay acceptance verdict.
The older baseline table in feature-coverage.md is historical and should not be
used as a list of still-missing features.

| Plan feature | Production implementation |
| --- | --- |
| F01 Seven classes and growth | CharacterCreate, playerStore, data/classes, progression/stats and xp |
| F02 Combat and turn order | engine/combat, engine/turn-order.ts, engine/rng.ts, combatStore |
| F03 Skills and combos | data/skills, engine/skills, features/skills; all 213 inventory rows have bounded-functional dispositions and source/evidence references |
| F04 Summons and one mercenary | engine/skills/summons.ts, paid traps/shadow skill bindings, mercStore, mercToCombatUnit and formation controls |
| F05 Loot and equipment | engine/loot, data/items, equipment-mods, inventoryStore; ordinary weapon/shield/armor source gaps repaired |
| F06 Crafting and stash | engine/crafting, socket-contents, runeword-grants, CraftingPanel and inventoryStore stash transfers |
| F07 Recruitment | engine/gacha, gachaActions, mercStore, GachaScreen; costs, pity, duplicates, stars and mercenary growth |
| F08 Five acts | data/maps/sub-areas/act1–5.json, mapStore, sub-area-run and five chapter bosses |
| F09 Towns and NPCs | Act-aware TownScreen, dialogue data, QuestServicePanel and individual services |
| F10 Quests and bounties | data/quests, quest actions/claim/delivery/crafting, regional-bounties and bounty settlement |
| F11 XP, points and currency | progression/xp and stats, playerStore and journalled quest/reward currency paths |
| F12 Online idle | idlePlaybackClock and CombatScreen native run continuation |
| F13 Offline bonus | engine/idle, metaStore, persisted bonus and OfflineReturnToast; next-online XP/MF window |
| F14 Saves | persistence.ts, IndexedDB, serialize/validate/migrate and save33; import/export controls |
| F15 Locales, layouts, stealth | en/zh-CN locale resources, responsive feature screens, useStealthMode and stealth.css |
| F16 PWA | Vite PWA configuration, service worker registration and offline precache integration |
| F17 Post-campaign dungeon | worldstone-remnant.json, engine/endgame, endgameActions and live EndgamePanel readiness/entry |
| F18 Achievement rewards | EndgamePanel achievement readiness/claim and persistent endgame reward state |
| F19 Art | GameImage, item/class/monster mappings, recoverable image handling and retained asset provenance |
| F20 Optional support | SettingsScreen support link; currently points to the generic Buy Me a Coffee site |
| F21 Bounded presentation | CombatLog virtualization, 200-entry retained log and bounded playback batching |

## Final implementation repairs

- Localized monster Boss/Elite suffixes through the shared display-name formatter
  and both locale resources. Instance letters and native identities are preserved.
- Added 154 ordinary armor rows and 24 ordinary two-handed weapon rows. Original
  table data and item stats remain intact. See
  [static content report](evidence/p15-ordinary-armor-and-two-handed-tiers.md).
- Corrected five stale campaign metric fixtures to include the existing periodic
  provenance shape and replaced a removed monster-stub import with current native
  skill catalogs in the projectile fixture. These are source/type repairs; the
  fixtures were not executed.

## Validation boundary and known limitations

Final `npm run typecheck` passed, including both application and Node TypeScript
projects. Scoped ESLint passed for the final changed source, reconstruction
helpers and loot/projectile fixtures. Campaign fixture files are excluded by
the repository's lint configuration but included in compilation. Static schema,
reference, level-coverage and exact predecessor checks passed; `git diff --check`
passed for the final touched files. These results do not imply a full lint pass.

No gameplay tests or simulations were started after the owner's stop instruction.
Only source review, compilation, scoped ESLint and static JSON/schema/reference/
coverage/preservation checks are used for this handoff. No new certification
harness or test suite was added. The existing i18n linter still reports historical
literal/enum/plural-key findings; no full-i18n-clean claim is made.

Balance is not accepted. The last retained Act III comparison had six of fourteen
paired clears; that result was not rerun or superseded. The 30–50 active-hour
campaign target, representative acquisition/drop odds, defeat/retry fairness,
higher-difficulty/endgame balance, performance and long-session stability remain
unverified for the combined current tree. Historical fourteen Normal route
completions do not establish current population acceptance.

Earlier bug records such as BUG080, BUG299 and BUG305 preserve their initial
Open labels, although their production repairs are present and later evidence
exists. They do not require reimplementation or renewed gameplay execution.
Other historical balance and harness findings are retained for the owner's
playtest; they are not silently converted into passes.

## Workspace and retained work

Implementation is in `feat/playable-foundations` at
`/home/felixzhao/.zai/profiles/anonymous/worktrees/D2H5TextGame-human-worktree-2`.
The initial handoff kept the combined changes local and uncommitted. The owner
subsequently requested committing and pushing this branch on 2026-11-05.
No reset, merge or deployment is part of that request. The original workspace
checkout remains untouched. The local `pnpm-workspace.yaml` contains an
unconfigured package-manager prompt and is excluded from commits; it is preserved.
There are no new disposable task directories from this final source-only work.

Historical evidence stays at the exact paths recorded in its feature reports.
In particular, root retains
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-shield-progression-sbyup5r_`
for the owner handoff; root removes it after its remaining review consumers
finish. The archived scoped configuration is evidence; the disposable original
configuration was removed earlier. No shared caches or historical evidence were
purged.
