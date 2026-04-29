/**
 * CharacterHud — persistent floating widget showing the player's
 * portrait/avatar, name, level, and HP/MP/EXP bars.
 *
 * Layout @ 360×640 (compact mode, the only mobile mode):
 *   ┌──────────────────────────┐
 *   │ ┌──┐  Name · Lv 12       │
 *   │ │P │  ▓▓▓▓░░░ HP         │
 *   │ │  │  ▓▓▓▓▓░░ MP         │
 *   │ └──┘  ▓░░░░░░ XP         │
 *   └──────────────────────────┘
 *   Fixed top-right, ~168×64.
 *
 * @ md+: Slightly more generous (180×72) — name shown on its own row.
 *
 * Visibility decision: hidden on `/`, `/character/new`, `/character`
 * (already on the stats screen), and `/combat` (the combat header
 * already crowds the top with Pause / Auto / Flee, and the player's
 * HP/MP appear inside the allies panel — surfacing them again on the
 * HUD would conflict at 360 wide).
 *
 * Reads from `usePlayerStore` only. Pure UI; no business logic.
 */
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePlayerStore } from '@/stores';
import { OfflineBonusChip } from '@/features/idle/OfflineBonusBanner';
import type { Player } from '@/engine/types/entities';

const HIDDEN_PATHS = new Set<string>(['/', '/character/new', '/character', '/combat']);

export function CharacterHud() {
  const { t } = useTranslation(['character', 'common']);
  const navigate = useNavigate();
  const location = useLocation();
  const player = usePlayerStore((s) => s.player);

  if (!player) return null;
  if (HIDDEN_PATHS.has(location.pathname)) return null;

  const handleClick = (): void => {
    navigate('/character');
  };

  return (
    <>
    <button
      type="button"
      onClick={handleClick}
      data-testid="character-hud"
      aria-label={t('hud.aria', {
        name: player.name,
        level: player.level,
      })}
      className="
        fixed z-40 right-1 md:right-2
        top-[max(0.25rem,env(safe-area-inset-top))]
        flex items-center gap-2
        bg-d2-panel/90 backdrop-blur
        border border-d2-border rounded-lg
        shadow-lg
        px-2 py-1.5
        min-h-[56px] min-w-[160px] md:min-w-[200px]
        text-left
        focus:outline-none focus-visible:ring-2 focus-visible:ring-d2-gold
        hover:border-d2-gold/70 active:scale-[0.98] transition-transform
      "
    >
      <Avatar player={player} />
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-baseline justify-between gap-1 leading-none">
          <span className="font-serif text-d2-gold text-xs md:text-sm truncate">
            {player.name}
          </span>
          <span className="text-[10px] md:text-xs text-d2-white/70 shrink-0">
            {t('common:level')} {player.level}
          </span>
        </div>
        <MiniBar
          label="HP"
          current={player.derivedStats.life}
          max={player.derivedStats.lifeMax}
          colorClass="bg-red-600"
          testId="hud-hp"
        />
        <MiniBar
          label="MP"
          current={player.derivedStats.mana}
          max={player.derivedStats.manaMax}
          colorClass="bg-blue-600"
          testId="hud-mp"
        />
        <MiniBar
          label="XP"
          current={player.experience}
          max={Math.max(1, player.experienceToNextLevel)}
          colorClass="bg-d2-gold"
          testId="hud-xp"
        />
      </div>
    </button>
    <div
      className="fixed z-40 right-1 md:right-2
                 top-[calc(64px+max(0.25rem,env(safe-area-inset-top)))]"
    >
      <OfflineBonusChip />
    </div>
    </>
  );
}

function Avatar({ player }: { player: Player }) {
  const [errored, setErrored] = useState(false);
  const cls = player.class;
  const src = `/assets/d2/generated/class-portraits/classes.${cls}.png`;
  const initial = (cls.charAt(0) || player.name.charAt(0) || '?').toUpperCase();

  return (
    <div
      className="
        relative shrink-0
        w-10 h-10 md:w-12 md:h-12
        rounded border border-d2-border
        bg-gradient-to-br from-d2-panel to-d2-bg
        overflow-hidden
        flex items-center justify-center
      "
      aria-hidden
    >
      {!errored ? (
        <img
          src={src}
          alt=""
          className="w-full h-full object-cover object-top"
          onError={() => { setErrored(true); }}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span className="font-serif text-d2-gold text-lg md:text-xl select-none">
          {initial}
        </span>
      )}
      <span
        className="
          absolute bottom-0 right-0
          bg-black/70 text-d2-gold
          text-[9px] md:text-[10px]
          leading-none px-1 py-0.5 rounded-tl
        "
      >
        {player.level}
      </span>
    </div>
  );
}

interface MiniBarProps {
  label: string;
  current: number;
  max: number;
  colorClass: string;
  testId: string;
}

function MiniBar({ label, current, max, colorClass, testId }: MiniBarProps) {
  const safeMax = max > 0 ? max : 1;
  const pct = Math.min(100, Math.max(0, (current / safeMax) * 100));
  return (
    <div className="flex items-center gap-1">
      <span className="text-[9px] md:text-[10px] text-d2-white/60 w-5 shrink-0 leading-none">
        {label}
      </span>
      <div
        className="flex-1 h-1.5 bg-d2-bg/80 border border-d2-border/60 rounded overflow-hidden"
        role="progressbar"
        aria-label={label}
        aria-valuenow={Math.floor(current)}
        aria-valuemin={0}
        aria-valuemax={Math.floor(safeMax)}
        data-testid={testId}
      >
        <div
          className={`h-full ${colorClass} transition-[width] duration-300`}
          style={{ width: `${String(pct)}%` }}
        />
      </div>
    </div>
  );
}
