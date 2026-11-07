/**
 * SettingsScreen — locale, stealth mode, audio, save management, BMC, version.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, Panel, ScreenShell, Tabs } from '@/ui';
import { PagedList } from '@/ui/PagedList';
import { SaveImportDialog } from './SaveImportDialog';
import { LootFilterPanel } from '@/features/inventory/LootFilterPanel';
import {
  useMetaStore,
  usePlayerStore,
  exportCurrentSave,
  importIntoStores,
  flushSave,
  deleteCurrentSave
} from '@/stores';

const APP_VERSION =
  (import.meta as unknown as { env?: { VITE_APP_VERSION?: string } }).env?.VITE_APP_VERSION ??
  '0.1.0';

export function SettingsScreen() {
  const { t, i18n } = useTranslation(['settings', 'common', 'inventory']);
  const navigate = useNavigate();
  const hasCharacter = usePlayerStore((s) => s.player !== null);

  const settings = useMetaStore((s) => s.settings);
  const setLocale = useMetaStore((s) => s.setLocale);
  const toggleStealthMode = useMetaStore((s) => s.toggleStealthMode);
  const toggleSound = useMetaStore((s) => s.toggleSound);
  const toggleMusic = useMetaStore((s) => s.toggleMusic);

  const [offline, setOffline] = useState(() => !navigator.onLine);
  useEffect(() => {
    const updateConnectivity = () => {
      setOffline(!navigator.onLine);
    };
    window.addEventListener('online', updateConnectivity);
    window.addEventListener('offline', updateConnectivity);
    updateConnectivity();
    return () => {
      window.removeEventListener('online', updateConnectivity);
      window.removeEventListener('offline', updateConnectivity);
    };
  }, []);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 2500);
  };

  const handleLocale = (loc: 'zh-CN' | 'en') => {
    setLocale(loc);
    void i18n.changeLanguage(loc);
  };

  const handleSave = async () => {
    try {
      const pending = flushSave();
      if (!pending) {
        flash(t('saveNoData'));
        return;
      }
      await pending;
      flash(t('saveSuccess'));
    } catch {
      flash(t('saveFailed'));
    }
  };

  const handleExport = async () => {
    try {
      const json = exportCurrentSave();
      if (!json) {
        flash(t('saveNoData'));
        return;
      }
      try {
        await navigator.clipboard.writeText(json);
      } catch {
        /* ignore */
      }
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `d2h5-save-${String(Date.now())}.json`;
      a.click();
      URL.revokeObjectURL(url);
      flash(t('exportSuccess'));
    } catch {
      flash(t('exportFailed'));
    }
  };

  const handleImport = async (json: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await importIntoStores(json);
      await i18n.changeLanguage(useMetaStore.getState().settings.locale);
      setImportOpen(false);
      flash(t('importSuccess'));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await deleteCurrentSave();
      setConfirmDelete(false);
      flash(t('deleteSuccess'));
      navigate('/', { replace: true });
    } catch {
      flash(t('deleteFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenShell testId="settings-screen" title={t('settings')} hideNav={!hasCharacter}>
      <div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col gap-2">
        {!hasCharacter && (
          <div className="shrink-0">
            <Button
              variant="secondary"
              className="min-h-[44px]"
              onClick={() => {
                navigate('/');
              }}
              data-testid="settings-back-home"
            >
              ← {t('common:back')}
            </Button>
          </div>
        )}
        <Tabs
          tabs={[
            {
              id: 'preferences',
              label: t('language'),
              content: (
                <PagedList
                  items={[
                    <li key="language" className="d2-panel p-3">
                      {' '}
                      <div className="flex gap-2">
                        {(['zh-CN', 'en'] as const).map((loc) => (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => {
                              handleLocale(loc);
                            }}
                            aria-pressed={settings.locale === loc}
                            className={[
                              'd2-control flex-1 min-h-[44px] px-3 py-2 rounded border',
                              'focus:outline-none focus-visible:ring-2 focus-visible:ring-d2-gold',
                              settings.locale === loc
                                ? 'border-d2-gold bg-d2-gold/10 text-d2-gold'
                                : 'border-d2-border bg-d2-panel text-d2-white'
                            ].join(' ')}
                          >
                            {/* language self-names — do not translate */}
                            {loc === 'zh-CN' ? '简体中文' : 'English'}
                          </button>
                        ))}
                      </div>
                    </li>,
                    <li key="0" className="d2-panel p-3">
                      <ToggleRow
                        label={t('stealthMode')}
                        description={t('stealthModeDesc')}
                        checked={settings.stealthMode}
                        onChange={toggleStealthMode}
                        testId="toggle-stealth"
                      />
                    </li>,
                    <li key="1" className="d2-panel p-3">
                      <ToggleRow
                        label={t('sound')}
                        checked={settings.soundEnabled}
                        onChange={toggleSound}
                      />
                    </li>,
                    <li key="2" className="d2-panel p-3">
                      <ToggleRow
                        label={t('music')}
                        checked={settings.musicEnabled}
                        onChange={toggleMusic}
                      />
                    </li>
                  ]}
                  renderItem={(item) => item}
                />
              )
            },
            {
              id: 'loot-filter',
              label: t('inventory:lootFilter.title'),
              content: <div className="min-h-0 overflow-y-auto scrollbar-d2 p-2"><LootFilterPanel /></div>
            },
            {
              id: 'save',
              label: t('saveLoad'),
              content: (
                <Panel className="!p-2 min-h-0 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2" aria-busy={busy}>
                    <Button
                      variant="secondary"
                      className="min-h-[44px]"
                      disabled={busy}
                      onClick={() => {
                        void handleSave();
                      }}
                    >
                      {t('saveNow')}
                    </Button>
                    <Button
                      variant="secondary"
                      className="min-h-[44px]"
                      onClick={() => {
                        void handleExport();
                      }}
                      data-testid="export-save-button"
                      disabled={busy}
                    >
                      {t('exportSave')}
                    </Button>
                    <Button
                      variant="secondary"
                      className="min-h-[44px]"
                      disabled={busy}
                      onClick={() => {
                        setImportOpen(true);
                      }}
                    >
                      {t('importSave')}
                    </Button>
                    <Button
                      variant="danger"
                      className="min-h-[44px]"
                      disabled={busy}
                      onClick={() => {
                        setConfirmDelete(true);
                      }}
                    >
                      {t('deleteSave')}
                    </Button>
                  </div>
                </Panel>
              )
            },
            {
              id: 'help',
              label: t('offlineBonusHelp.title'),
              content: (
                <div className="flex min-h-0 flex-1" data-testid="offline-bonus-help">
                  <PagedList
                    items={
                      offline
                        ? ['offlineArtHelp', 'noIncome', 'accrual', 'decay']
                        : ['noIncome', 'accrual', 'decay']
                    }
                    renderItem={(key) => (
                      <li key={key} className="d2-panel p-3 text-sm text-d2-white/80">
                        {key === 'offlineArtHelp' ? (
                          <span data-testid="offline-art-help">{t('offlineArtHelp')}</span>
                        ) : (
                          t(`offlineBonusHelp.${key}`)
                        )}
                      </li>
                    )}
                  />
                </div>
              )
            },
            {
              id: 'about',
              label: t('supportDev'),
              content: (
                <Panel className="text-center text-sm text-d2-white/80">
                  <a
                    href="https://www.buymeacoffee.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="d2-control inline-flex min-h-11 items-center rounded px-4 py-2 hover:underline focus-visible:ring-2 focus-visible:ring-d2-gold"
                  >
                    ☕ {t('bmcLink')}
                  </a>
                  <p className="mt-2">
                    {t('version')}: {String(APP_VERSION)}
                  </p>
                </Panel>
              )
            }
          ]}
        />
      </div>

      <Modal
        isOpen={confirmDelete}
        onClose={() => {
          setConfirmDelete(false);
        }}
        title={t('deleteSave')}
      >
        <p className="mb-4">{t('confirmDelete')}</p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1 min-h-[44px]"
            onClick={() => {
              setConfirmDelete(false);
            }}
          >
            {t('common:cancel')}
          </Button>
          <Button
            variant="danger"
            className="flex-1 min-h-[44px]"
            disabled={busy}
            onClick={() => {
              void handleDelete();
            }}
          >
            {t('deleteSave')}
          </Button>
        </div>
      </Modal>

      <SaveImportDialog
        isOpen={importOpen}
        busy={busy}
        onClose={() => {
          setImportOpen(false);
        }}
        onImport={handleImport}
      />

      {toast && !importOpen && (
        <div
          role="status"
          className="d2-surface pointer-events-none fixed bottom-20 left-1/2 -translate-x-1/2 z-50
                     bg-d2-panel border border-d2-gold text-d2-gold
                     px-4 py-2 rounded shadow-lg text-sm"
        >
          {toast}
        </div>
      )}
    </ScreenShell>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  testId
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
  testId?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer min-h-[44px]">
      <span className="flex-1 min-w-0">
        <span className="block text-d2-white">{label}</span>
        {description && <span className="block text-xs text-d2-white/60">{description}</span>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-6 h-6 accent-d2-gold cursor-pointer"
        data-testid={testId}
        aria-label={label}
      />
    </label>
  );
}
