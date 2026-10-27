/**
 * BottomNav — mobile-first bottom navigation; transforms to side rail at `md` breakpoint.
 * Each item is a 44px+ tap target. Strings come from i18n `common` namespace under `nav.*`.
 */
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMetaStore } from '@/stores';

interface NavItem {
  to: string;
  labelKey?: string;
  label?: string;
  icon: keyof typeof ICON_PATHS;
}

// Inline paths keep navigation recognizable on devices without emoji fonts.
const ICON_PATHS = {
  town: 'M3 21V5h4v3h3V3h4v5h3V5h4v16H3Zm7 0v-6h4v6M7 12h1m8 0h1',
  map: 'm3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16',
  combat: 'M3 3h5l12 12-5 5L3 8V3Zm0 18 5-5m6-6 7-7v5l-4 4M3 16l5 5m8-18 5 5m-7 12 6-6',
  inventory: 'M8 7V5a4 4 0 0 1 8 0v2M5 7h14v14H5V7Zm3 8h8v6H8v-6ZM3 11v7m18-7v7M9 10h6',
  skills: 'm12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Zm7 0v4m-2-2h4',
  mercs: 'M12 2 3 6v6c0 5 5 8 9 10 4-2 9-5 9-10V6l-9-4Zm0 5v10m-4-5h8',
  quests:
    'M7 3h12a2 2 0 0 1 2 2v3h-4V5a2 2 0 0 1 2-2M7 3a2 2 0 0 0-2 2v12H3v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M5 21a2 2 0 0 0 2-2v-2m2-9h5m-5 4h5',
  settings:
    'M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1 1-3Zm6 9a3 3 0 1 0-6 0 3 3 0 0 0 6 0Z',
  dev: 'm8 7-5 5 5 5m8-10 5 5-5 5m-3-14-2 18'
} as const;

function NavIcon({ name, small = false }: { name: NavItem['icon']; small?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={small ? 'h-3 w-3 shrink-0' : 'h-5 w-5 shrink-0'}
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

const ITEMS: readonly NavItem[] = [
  { to: '/town', labelKey: 'nav.town', icon: 'town' },
  { to: '/map', labelKey: 'nav.map', icon: 'map' },
  { to: '/combat', labelKey: 'nav.combat', icon: 'combat' },
  { to: '/inventory', labelKey: 'nav.inventory', icon: 'inventory' },
  { to: '/skills', labelKey: 'nav.skills', icon: 'skills' },
  { to: '/mercs', labelKey: 'nav.mercs', icon: 'mercs' },
  { to: '/quests', labelKey: 'nav.quests', icon: 'quests' },
  { to: '/settings', labelKey: 'nav.settings', icon: 'settings' }
];

const NAV_ITEMS: readonly NavItem[] = import.meta.env.DEV
  ? [...ITEMS, { to: '/dev', label: 'Dev Tool', icon: 'dev' }]
  : ITEMS;

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
            <span className="flex items-center gap-1">
              <NavIcon name="settings" small />
              <span className="truncate">{t('map:idleHereShort')}</span>
            </span>
            <span className="block truncate text-d2-white/70">
              {t(`map:subArea.${idleTarget}`)}
            </span>
          </li>
        )}
        {NAV_ITEMS.map((item) => (
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
                    : 'text-d2-white/70 hover:text-d2-gold hover:bg-black/20'
                ].join(' ')
              }
            >
              <NavIcon name={item.icon} />
              <span className="text-[10px] md:text-xs leading-tight truncate max-w-full">
                {item.label ?? (item.labelKey ? t(item.labelKey) : '')}
              </span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
