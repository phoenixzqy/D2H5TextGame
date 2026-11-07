/**
 * BottomNav — mobile-first bottom navigation; transforms to side rail at `md` breakpoint.
 * Each item is a 44px+ tap target. Strings come from i18n `common` namespace under `nav.*`.
 */
import { useState } from 'react';
import { Modal } from './Modal';
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
  const [moreOpen, setMoreOpen] = useState(false);
  const idleTarget = useMetaStore((s) => s.idleState.idleTarget);

  const renderLink = (item: NavItem, close = false) => (
    <li key={item.to} className="min-w-0">
      <NavLink
        to={item.to}
        onClick={() => {
          if (close) setMoreOpen(false);
        }}
        className={({ isActive }) =>
          `d2-nav-link flex min-h-[48px] flex-col items-center justify-center gap-1 px-1 py-1 text-xs ${isActive ? 'd2-nav-link--active text-d2-gold' : 'text-d2-white/70 hover:text-d2-gold'}`
        }
      >
        <NavIcon name={item.icon} />
        <span className="max-w-full truncate">
          {item.label ?? (item.labelKey ? t(item.labelKey) : '')}
        </span>
      </NavLink>
    </li>
  );
  return (
    <>
      <nav
        aria-label={t('nav.aria')}
        className="d2-nav d2-compact-nav order-last md:order-first shrink-0 border-t md:border-t-0 md:border-r border-d2-border"
      >
        <ul className="d2-primary-nav">
          {NAV_ITEMS.slice(0, 4).map((item) => renderLink(item))}
          <li>
            <button
              type="button"
              className="d2-nav-link w-full min-h-[48px] text-xs text-d2-gold"
              onClick={() => {
                setMoreOpen(true);
              }}
              aria-haspopup="dialog"
            >
              <span aria-hidden="true" className="block text-xl leading-5">
                •••
              </span>
              {t('nav.more')}
            </button>
          </li>
        </ul>
        {idleTarget && (
          <span
            className="hidden md:block truncate p-1 text-center text-[10px] text-d2-gold"
            data-testid="idle-sidebar-chip"
            title={t(`map:subArea.${idleTarget}`)}
          >
            {t('map:idleHereShort')}
          </span>
        )}
      </nav>
      <Modal
        isOpen={moreOpen}
        onClose={() => {
          setMoreOpen(false);
        }}
        title={t('nav.more')}
      >
        <nav aria-label={t('nav.aria')}>
          <ul className="grid grid-cols-3 gap-2">
            {NAV_ITEMS.slice(4).map((item) => renderLink(item, true))}
            {renderLink({ to: '/character', labelKey: 'nav.character', icon: 'mercs' }, true)}
            {renderLink({ to: '/gacha', labelKey: 'nav.gacha', icon: 'skills' }, true)}
          </ul>
        </nav>
      </Modal>
    </>
  );
}
