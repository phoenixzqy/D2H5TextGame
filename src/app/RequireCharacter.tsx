/**
 * RequireCharacter — route guard that redirects to the title screen
 * when no player character exists. Used to gate all in-game routes
 * (town, map, combat, inventory, skills, mercs, gacha, quests).
 *
 * Settings is intentionally NOT guarded so locale/save-import remain
 * usable before character creation, but its ScreenShell hides the
 * BottomNav in that state so the player cannot bypass the welcome
 * flow via the nav rail.
 */
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePlayerStore } from '@/stores';

interface RequireCharacterProps {
  children: ReactNode;
}

export function RequireCharacter({ children }: RequireCharacterProps) {
  const player = usePlayerStore((s) => s.player);
  if (!player) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
