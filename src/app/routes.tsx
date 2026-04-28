import { Routes, Route, Navigate } from 'react-router-dom';
import { HomeScreen } from '@/features/character/HomeScreen';
import { CharacterCreate } from '@/features/character/CharacterCreate';
import { CharacterScreen } from '@/features/character/CharacterScreen';
import { TownScreen } from '@/features/town/TownScreen';
import { MapScreen } from '@/features/map/MapScreen';
import { CombatScreen } from '@/features/combat/CombatScreen';
import { InventoryScreen } from '@/features/inventory/InventoryScreen';
import { SkillsScreen } from '@/features/skills/SkillsScreen';
import { MercsScreen } from '@/features/mercs/MercsScreen';
import { GachaScreen } from '@/features/gacha/GachaScreen';
import { QuestsScreen } from '@/features/quests/QuestsScreen';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { RequireCharacter } from './RequireCharacter';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/character/new" element={<CharacterCreate />} />
      <Route
        path="/character"
        element={
          <RequireCharacter>
            <CharacterScreen />
          </RequireCharacter>
        }
      />
      <Route path="/settings" element={<SettingsScreen />} />
      <Route
        path="/town"
        element={
          <RequireCharacter>
            <TownScreen />
          </RequireCharacter>
        }
      />
      <Route
        path="/map"
        element={
          <RequireCharacter>
            <MapScreen />
          </RequireCharacter>
        }
      />
      <Route
        path="/combat"
        element={
          <RequireCharacter>
            <CombatScreen />
          </RequireCharacter>
        }
      />
      <Route
        path="/inventory"
        element={
          <RequireCharacter>
            <InventoryScreen />
          </RequireCharacter>
        }
      />
      <Route
        path="/skills"
        element={
          <RequireCharacter>
            <SkillsScreen />
          </RequireCharacter>
        }
      />
      <Route
        path="/mercs"
        element={
          <RequireCharacter>
            <MercsScreen />
          </RequireCharacter>
        }
      />
      <Route
        path="/gacha"
        element={
          <RequireCharacter>
            <GachaScreen />
          </RequireCharacter>
        }
      />
      <Route
        path="/quests"
        element={
          <RequireCharacter>
            <QuestsScreen />
          </RequireCharacter>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
