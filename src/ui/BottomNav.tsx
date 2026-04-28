/**
 * BottomNav — mobile-first bottom navigation; transforms to side rail at `md` breakpoint.
 * Each item is a 44px+ tap target. Strings come from i18n `common` namespace under `nav.*`.
 */
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('common');

  return (
    <nav
      aria-label={t('nav.aria', { defaultValue: 'Main navigation' })}
      className="
        fixed inset-x-0 bottom-0 z-40
        bg-d2-panel/95 backdrop-blur border-t border-d2-border
        pb-[env(safe-area-inset-bottom)]
        md:static md:border-t-0 md:border-r md:bg-d2-panel md:pb-0
        md:w-20 md:h-screen md:flex-shrink-0
      "
    >
      <ul
        className="
          flex justify-around items-stretch
          md:flex-col md:items-stretch md:justify-start md:gap-1 md:p-2 md:overflow-y-auto
        "
      >
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
