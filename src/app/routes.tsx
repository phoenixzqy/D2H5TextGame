import { Routes, Route, Navigate } from 'react-router-dom';
import { HomeScreen } from '@/features/character/HomeScreen';
import { CharacterCreate } from '@/features/character/CharacterCreate';
import { TownScreen } from '@/features/town/TownScreen';
import { MapScreen } from '@/features/map/MapScreen';
import { CombatScreen } from '@/features/combat/CombatScreen';
import { InventoryScreen } from '@/features/inventory/InventoryScreen';
import { SkillsScreen } from '@/features/skills/SkillsScreen';
import { MercsScreen } from '@/features/mercs/MercsScreen';
import { GachaScreen } from '@/features/gacha/GachaScreen';
import { QuestsScreen } from '@/features/quests/QuestsScreen';
import { SettingsScreen } from '@/features/settings/SettingsScreen';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/character/new" element={<CharacterCreate />} />
      <Route path="/town" element={<TownScreen />} />
      <Route path="/map" element={<MapScreen />} />
      <Route path="/combat" element={<CombatScreen />} />
      <Route path="/inventory" element={<InventoryScreen />} />
      <Route path="/skills" element={<SkillsScreen />} />
      <Route path="/mercs" element={<MercsScreen />} />
      <Route path="/gacha" element={<GachaScreen />} />
      <Route path="/quests" element={<QuestsScreen />} />
      <Route path="/settings" element={<SettingsScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
