/**
 * BottomNav — mobile-first bottom navigation; transforms to side rail at `md` breakpoint.
 * Each item is a 44px+ tap target. Strings come from i18n `common` namespace under `nav.*`.
 */
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMetaStore } from '@/stores';

interface NavItem {
  to: string;
  labelKey: string;
  icon: string; // unicode glyph; replaced with sprites later
}

const ITEMS: NavItem[] = [
  { to: '/town', labelKey: 'nav.town', icon: '🏰' },
  { to: '/map', labelKey: 'nav.map', icon: '🗺️' },
  { to: '/combat', labelKey: 'nav.combat', icon: '⚔️' },
  { to: '/inventory', labelKey: 'nav.inventory', icon: '🎒' },
  { to: '/skills', labelKey: 'nav.skills', icon: '✨' },
  { to: '/mercs', labelKey: 'nav.mercs', icon: '🛡️' },
  { to: '/gacha', labelKey: 'nav.gacha', icon: '🎲' },
  { to: '/quests', labelKey: 'nav.quests', icon: '📜' },
  { to: '/settings', labelKey: 'nav.settings', icon: '⚙️' },
];

export function BottomNav() {
  const { t } = useTranslation(['common', 'map']);
  const idleTarget = useMetaStore((s) => s.idleState.idleTarget);

  return (
    <nav
      aria-label={t('nav.aria')}
      className="
        order-last md:order-first
        flex-shrink-0
        bg-d2-panel/95 backdrop-blur border-t border-d2-border
        pb-[env(safe-area-inset-bottom)]
        md:border-t-0 md:border-r md:bg-d2-panel md:pb-0
        md:w-20 md:h-full md:overflow-y-auto
      "
    >
      <ul
        className="
          flex justify-around items-stretch
          md:flex-col md:items-stretch md:justify-start md:gap-1 md:p-2 md:overflow-y-auto
        "
      >
        {idleTarget && (
          <li
            className="hidden md:block px-1 pb-2 text-[10px] text-d2-gold/90"
            data-testid="idle-sidebar-chip"
            title={t(`map:subArea.${idleTarget}`)}
          >
            <span className="block truncate">⚙️ {t('map:idleHereShort')}</span>
            <span className="block truncate text-d2-white/70">
              {t(`map:subArea.${idleTarget}`)}
            </span>
          </li>
        )}
        {ITEMS.map((item) => (
          <li key={item.to} className="flex-1 md:flex-none">
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center justify-center gap-1',
                  'min-h-[56px] md:min-h-[64px] px-1 py-2 text-xs',
                  'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-d2-gold',
                  isActive
                    ? 'text-d2-gold bg-black/40'
                    : 'text-d2-white/70 hover:text-d2-gold hover:bg-black/20',
                ].join(' ')
              }
            >
              <span aria-hidden className="text-xl leading-none select-none">
                {item.icon}
              </span>
              <span className="text-[10px] md:text-xs leading-tight truncate max-w-full">
                {t(item.labelKey)}
              </span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
