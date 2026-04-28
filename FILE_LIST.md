# Full React UI File List

## Created Files (by category)

### Stores (7 files)
1. `src/stores/save-adapter.ts` — Dexie persistence (loadSave, saveSave, exportSave, importSave, deleteSave, hasSave)
2. `src/stores/playerStore.ts` — Player character state management
3. `src/stores/inventoryStore.ts` — Backpack, stash, equipment, currencies
4. `src/stores/combatStore.ts` — Combat state & log buffer
5. `src/stores/mapStore.ts` — Map progress, location, quests
6. `src/stores/mercStore.ts` — Mercenary roster & fielded selection
7. `src/stores/metaStore.ts` — Settings, idle state, gacha state

### UI Components (10 files)
8. `src/ui/Tabs.tsx` — Tab switcher component
9. `src/ui/Modal.tsx` — Overlay modal with keyboard nav
10. `src/ui/Tooltip.tsx` — Hover/long-press tooltip
11. `src/ui/StatBar.tsx` — HP/MP/XP progress bars
12. `src/ui/RarityText.tsx` — Rarity-colored text
13. `src/ui/ItemTooltip.tsx` — Item detail tooltip
14. `src/ui/BottomNav.tsx` — Mobile bottom nav / desktop side rail
15. `src/ui/ScreenShell.tsx` — Common screen layout wrapper

### Feature Screens (11 files)
16. `src/features/character/CharacterCreate.tsx` — Character creation screen
17. `src/features/character/createMockPlayer.ts` — Mock player factory
18. `src/features/town/TownScreen.tsx` — Town hub screen
19. `src/features/map/MapScreen.tsx` — World map screen
20. `src/features/combat/CombatScreen.tsx` — Combat screen with log
21. `src/features/inventory/InventoryScreen.tsx` — Inventory management screen
22. `src/features/skills/SkillsScreen.tsx` — Skill tree & combo editor
23. `src/features/mercs/MercsScreen.tsx` — Mercenary roster screen
24. `src/features/gacha/GachaScreen.tsx` — Gacha pull screen
25. `src/features/quests/QuestsScreen.tsx` — Quest log screen
26. `src/features/settings/SettingsScreen.tsx` — Settings & save management

### i18n Locales (20 files)
**zh-CN:**
27. `src/i18n/locales/zh-CN/character.json`
28. `src/i18n/locales/zh-CN/combat.json`
29. `src/i18n/locales/zh-CN/inventory.json`
30. `src/i18n/locales/zh-CN/skills.json`
31. `src/i18n/locales/zh-CN/settings.json`
32. `src/i18n/locales/zh-CN/town.json`
33. `src/i18n/locales/zh-CN/map.json`
34. `src/i18n/locales/zh-CN/mercs.json`
35. `src/i18n/locales/zh-CN/gacha.json`
36. `src/i18n/locales/zh-CN/quests.json`

**en:**
37. `src/i18n/locales/en/character.json`
38. `src/i18n/locales/en/combat.json`
39. `src/i18n/locales/en/inventory.json`
40. `src/i18n/locales/en/skills.json`
41. `src/i18n/locales/en/settings.json`
42. `src/i18n/locales/en/town.json`
43. `src/i18n/locales/en/map.json`
44. `src/i18n/locales/en/mercs.json`
45. `src/i18n/locales/en/gacha.json`
46. `src/i18n/locales/en/quests.json`

### Stealth Mode (2 files)
47. `src/styles/stealth.css` — Stealth mode styles
48. `src/app/useStealthMode.ts` — Stealth mode hook

### Documentation (2 files)
49. `UI_DELIVERY.md` — Comprehensive delivery report
50. `FILE_LIST.md` — This file

## Updated Files (9 files)

1. `src/stores/index.ts` — Added store exports
2. `src/ui/index.ts` — Added component exports
3. `src/i18n/index.ts` — Added all namespace imports
4. `src/i18n/locales/zh-CN/common.json` — Added nav keys
5. `src/i18n/locales/en/common.json` — Added nav keys
6. `src/styles/index.css` — Added stealth import & animations
7. `src/app/App.tsx` — Added useStealthMode hook
8. `src/app/routes.tsx` — Wired all 11 routes
9. `src/features/character/HomeScreen.tsx` — Rewritten with Continue/New/Settings

**Plus:**
- Fixed 4 lint issues in pre-existing engine code:
  - `src/engine/combat/combat.ts`
  - `src/engine/combat/combat.test.ts`
  - `src/engine/combat/status.test.ts`

## Total Count

- **Created:** 50 files
- **Updated:** 9 files
- **Total changed:** 59 files

## Deliverables Summary

✅ 6 Zustand stores  
✅ 8 reusable UI components  
✅ 11 feature screens  
✅ 20 i18n locale files (bilingual)  
✅ Stealth mode CSS + hook  
✅ Full routing setup  
✅ PWA-ready build  
✅ Mobile-first responsive (360×640 → desktop)  
✅ Safe-area insets  
✅ Bottom nav / side rail  
✅ TypeScript strict (0 errors)  
✅ Lint passing (0 errors)  
✅ Build succeeds (407 KB precache)  

**Status:** ✅ READY FOR QA & CONTENT INTEGRATION
