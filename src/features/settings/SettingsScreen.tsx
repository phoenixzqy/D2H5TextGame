/**
 * SettingsScreen — locale, stealth mode, audio, save management, BMC, version.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Modal, Panel, ScreenShell } from '@/ui';
import {
  useMetaStore,
  exportSave,
  importSave,
  deleteSave,
  saveSave,
  loadSave,
} from '@/stores';

const APP_VERSION =
  (import.meta as unknown as { env?: { VITE_APP_VERSION?: string } }).env?.VITE_APP_VERSION ?? '0.1.0';

export function SettingsScreen() {
  const { t, i18n } = useTranslation(['settings', 'common']);

  const settings = useMetaStore((s) => s.settings);
  const setLocale = useMetaStore((s) => s.setLocale);
  const toggleStealthMode = useMetaStore((s) => s.toggleStealthMode);
  const toggleSound = useMetaStore((s) => s.toggleSound);
  const toggleMusic = useMetaStore((s) => s.toggleMusic);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => { setToast(null); }, 2500);
  };

  const handleLocale = (loc: 'zh-CN' | 'en') => {
    setLocale(loc);
    void i18n.changeLanguage(loc);
  };

  const handleSave = async () => {
    try {
      const existing = await loadSave();
      if (!existing) {
        flash(t('saveNoData', { defaultValue: '无可保存的数据' }));
        return;
      }
      await saveSave({ ...existing, timestamp: Date.now() });
      flash(t('saveSuccess', { defaultValue: '已保存' }));
    } catch {
      flash(t('saveFailed', { defaultValue: '保存失败' }));
    }
  };

  const handleExport = async () => {
    try {
      const json = await exportSave();
      if (!json) {
        flash(t('saveNoData', { defaultValue: '无存档可导出' }));
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
      flash(t('exportSuccess', { defaultValue: '已导出' }));
    } catch {
      flash(t('exportFailed', { defaultValue: '导出失败' }));
    }
  };

  const handleImport = async () => {
    try {
      await importSave(importText);
      setImportOpen(false);
      setImportText('');
      flash(t('importSuccess', { defaultValue: '导入成功' }));
    } catch {
      flash(t('importFailed', { defaultValue: '导入失败:格式无效' }));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSave();
      setConfirmDelete(false);
      flash(t('deleteSuccess', { defaultValue: '存档已删除' }));
    } catch {
      flash(t('deleteFailed', { defaultValue: '删除失败' }));
    }
  };

  return (
    <ScreenShell testId="settings-screen" title={t('settings')}>
      <div className="max-w-2xl mx-auto space-y-4">
        <Panel title={t('language')}>
          <div className="flex gap-2">
            {(['zh-CN', 'en'] as const).map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => { handleLocale(loc); }}
                aria-pressed={settings.locale === loc}
                className={[
                  'flex-1 min-h-[44px] px-3 py-2 rounded border',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-d2-gold',
                  settings.locale === loc
                    ? 'border-d2-gold bg-d2-gold/10 text-d2-gold'
                    : 'border-d2-border bg-d2-panel text-d2-white',
                ].join(' ')}
              >
                {loc === 'zh-CN' ? '简体中文' : 'English'}
              </button>
            ))}
          </div>
        </Panel>

        <Panel>
          <ToggleRow
            label={t('stealthMode')}
            description={t('stealthModeDesc')}
            checked={settings.stealthMode}
            onChange={toggleStealthMode}
            testId="toggle-stealth"
          />
          <div className="border-t border-d2-border my-2" />
          <ToggleRow label={t('sound')} checked={settings.soundEnabled} onChange={toggleSound} />
          <div className="border-t border-d2-border my-2" />
          <ToggleRow label={t('music')} checked={settings.musicEnabled} onChange={toggleMusic} />
        </Panel>

        <Panel title={t('saveLoad')}>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" className="min-h-[44px]" onClick={() => { void handleSave(); }}>
              {t('saveNow', { defaultValue: '保存' })}
            </Button>
            <Button variant="secondary" className="min-h-[44px]" onClick={() => { void handleExport(); }}>
              {t('exportSave')}
            </Button>
            <Button variant="secondary" className="min-h-[44px]" onClick={() => { setImportOpen(true); }}>
              {t('importSave')}
            </Button>
            <Button variant="danger" className="min-h-[44px]" onClick={() => { setConfirmDelete(true); }}>
              {t('deleteSave')}
            </Button>
          </div>
        </Panel>

        <Panel className="text-center text-xs text-d2-white/60">
          <a
            href="https://www.buymeacoffee.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-d2-gold hover:underline focus:outline-none focus-visible:ring-2
                       focus-visible:ring-d2-gold rounded inline-block min-h-[32px]"
          >
            ☕ {t('bmcLink')}
          </a>
          <div className="mt-2">
            {t('version')}: {String(APP_VERSION)}
          </div>
        </Panel>
      </div>

      <Modal isOpen={confirmDelete} onClose={() => { setConfirmDelete(false); }} title={t('deleteSave')}>
        <p className="mb-4">{t('confirmDelete')}</p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1 min-h-[44px]"
            onClick={() => { setConfirmDelete(false); }}
          >
            {t('common:cancel', { defaultValue: '取消' })}
          </Button>
          <Button variant="danger" className="flex-1 min-h-[44px]" onClick={() => { void handleDelete(); }}>
            {t('deleteSave')}
          </Button>
        </div>
      </Modal>

      <Modal isOpen={importOpen} onClose={() => { setImportOpen(false); }} title={t('importSave')}>
        <textarea
          value={importText}
          onChange={(e) => { setImportText(e.target.value); }}
          rows={8}
          placeholder={t('importPlaceholder', { defaultValue: '粘贴存档 JSON…' })}
          className="w-full bg-d2-bg border border-d2-border rounded p-2 text-xs font-mono
                     focus:outline-none focus:border-d2-gold"
        />
        <div className="flex gap-2 mt-3">
          <Button
            variant="secondary"
            className="flex-1 min-h-[44px]"
            onClick={() => { setImportOpen(false); }}
          >
            {t('common:cancel', { defaultValue: '取消' })}
          </Button>
          <Button
            variant="primary"
            className="flex-1 min-h-[44px]"
            disabled={!importText.trim()}
            onClick={() => { void handleImport(); }}
          >
            {t('importSave')}
          </Button>
        </div>
      </Modal>

      {toast && (
        <div
          role="status"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50
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
  testId,
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
