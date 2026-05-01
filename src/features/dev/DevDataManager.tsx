import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { loadDevJson, saveDevJson } from './devClient';
import { isRecord, parseJsonRecord, type JsonRecord } from './devJson';
import type { DevDataFile } from './devPaths';
import { tDataKey } from '@/ui';

interface DevDataManagerProps {
  readonly title: string;
  readonly description: string;
  readonly files: readonly DevDataFile[];
  readonly renderFields: (entry: JsonRecord, onChange: (entry: JsonRecord) => void, entries: readonly JsonRecord[]) => React.ReactNode;
}

function toEntries(json: unknown): { entries: JsonRecord[]; arrayFile: boolean } {
  if (Array.isArray(json)) {
    return { entries: json.filter(isRecord), arrayFile: true };
  }
  return { entries: isRecord(json) ? [json] : [], arrayFile: false };
}

export function DevDataManager({ title, description, files, renderFields }: DevDataManagerProps) {
  const { t } = useTranslation(['dev', 'items', 'monsters', 'common']);
  const [filePath, setFilePath] = useState(files[0]?.path ?? '');
  const [entries, setEntries] = useState<JsonRecord[]>([]);
  const [arrayFile, setArrayFile] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [status, setStatus] = useState('');
  const [rawEntry, setRawEntry] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setStatus(t('manager.loading'));
    void loadDevJson<unknown>(filePath)
      .then((json) => {
        if (cancelled) return;
        const next = toEntries(json);
        setEntries(next.entries);
        setArrayFile(next.arrayFile);
        setSelectedIndex(0);
        setStatus(t('manager.loaded', { path: filePath }));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setEntries([]);
        setStatus(error instanceof Error ? error.message : t('manager.loadFailed'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [filePath, t]);

  const selected = entries[selectedIndex] ?? null;

  useEffect(() => {
    setRawEntry(selected ? JSON.stringify(selected, null, 2) : '');
  }, [selected]);

  const entryOptions = useMemo(
    () => entries.map((entry, index) => ({
      index,
      label: entryLabel(entry, index, t)
    })),
    [entries, t]
  );

  const updateSelected = (entry: JsonRecord): void => {
    setEntries((current) => current.map((item, index) => index === selectedIndex ? entry : item));
  };

  const applyRawEntry = (): void => {
    try {
      updateSelected(parseJsonRecord(rawEntry));
      setStatus(t('manager.rawApplied'));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t('manager.invalidJson'));
    }
  };

  const save = async (): Promise<void> => {
    const json: unknown = arrayFile ? entries : entries[0] ?? {};
    try {
      await saveDevJson(filePath, json);
      setStatus(t('manager.saved', { path: filePath }));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t('manager.saveFailed'));
    }
  };

  return (
    <section className="space-y-4" aria-busy={loading}>
      <header>
        <h1 className="font-serif text-2xl text-d2-gold">{title}</h1>
        <p className="mt-1 text-sm text-d2-white/70">{description}</p>
      </header>

      <div className="grid gap-3 rounded border border-d2-border bg-d2-panel p-3 md:grid-cols-2">
        <label className="text-sm text-d2-white/80">
          <span className="mb-1 block">{t('manager.dataFile')}</span>
          <select
            value={filePath}
            onChange={(event) => { setFilePath(event.target.value); }}
            className="w-full min-h-[44px] rounded border border-d2-border bg-d2-bg px-2 text-d2-white"
          >
            {files.map((file) => <option key={file.path} value={file.path}>{file.label}</option>)}
          </select>
        </label>
        <label className="text-sm text-d2-white/80">
          <span className="mb-1 block">{t('manager.entry')}</span>
          <select
            value={selectedIndex}
            onChange={(event) => { setSelectedIndex(Number(event.target.value)); }}
            className="w-full min-h-[44px] rounded border border-d2-border bg-d2-bg px-2 text-d2-white"
          >
            {entryOptions.map((entry) => <option key={entry.index} value={entry.index}>{entry.label}</option>)}
          </select>
        </label>
      </div>

      {selected ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
          <div className="space-y-3 rounded border border-d2-border bg-d2-panel p-3">
            {renderFields(selected, updateSelected, entries)}
          </div>
          <aside className="space-y-2 rounded border border-d2-border bg-d2-panel p-3">
            <label className="block text-sm text-d2-white/80">
              <span className="mb-1 block">{t('manager.selectedEntryJson')}</span>
              <textarea
                value={rawEntry}
                onChange={(event) => { setRawEntry(event.target.value); }}
                rows={18}
                className="w-full rounded border border-d2-border bg-d2-bg p-2 font-mono text-xs text-d2-white focus:border-d2-gold focus:outline-none"
              />
            </label>
            <button type="button" onClick={applyRawEntry} className="min-h-[40px] rounded border border-d2-border px-3 text-sm text-d2-white hover:text-d2-gold">
              {t('manager.applyEntryJson')}
            </button>
          </aside>
        </div>
      ) : (
        <p className="rounded border border-d2-border bg-d2-panel p-4 text-d2-white/70">{t('manager.noEntries')}</p>
      )}

      <div className="sticky bottom-2 flex flex-wrap items-center gap-3 rounded border border-d2-gold/40 bg-d2-panel/95 p-3 backdrop-blur">
        <button type="button" onClick={() => { void save(); }} className="min-h-[44px] rounded bg-d2-gold px-4 font-semibold text-black hover:bg-d2-gold/90">
          {t('manager.saveToDisk')}
        </button>
        <p role="status" className="text-sm text-d2-white/70">{status}</p>
      </div>
    </section>
  );
}

function entryLabel(entry: JsonRecord, index: number, t: ReturnType<typeof useTranslation>['t']): string {
  const raw = typeof entry.name === 'string'
    ? entry.name
    : typeof entry.id === 'string'
    ? entry.id
    : `Entry ${String(index + 1)}`;
  if (raw.includes('.') && !raw.includes('/')) return tDataKey(t, raw);
  return raw;
}
