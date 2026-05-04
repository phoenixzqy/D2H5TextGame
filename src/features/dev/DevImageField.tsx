/**
 * DevImageField — image preview + override editor for the dev tool.
 *
 * Layout sketch (mobile-first):
 *
 *   ┌──────────────────────────────────────────────┐
 *   │  Image preview  [Override|Inferred]          │
 *   │  ┌────────┐                                  │
 *   │  │ <img>  │   Lookup key:  base/wp1h-…       │
 *   │  │  72×96 │   Override path: [_____________] │
 *   │  └────────┘   [Save override] [Clear]        │
 *   │                <status>                      │
 *   └──────────────────────────────────────────────┘
 *
 * Persistence path:
 *   - Loads `src/data/image-overrides.json` on mount via `loadDevJson`.
 *   - `Save override` writes the entry into that file via `saveDevJson`,
 *     which the dev-data Vite middleware validates against the
 *     `image-overrides.schema.json` schema before writing to disk.
 *   - `Clear override` deletes the entry, then saves.
 *
 * The dev-data save endpoint triggers a Vite full-reload, so callers
 * should be aware that any unsaved edits in the surrounding editor will
 * be lost — same caveat as the existing "Save to disk" button.
 *
 * Source: see `src/ui/imageOverrides.ts` (schema + validation contract)
 * and `vite.config.ts` `devDataPlugin` for the write semantics.
 *
 * @module features/dev/DevImageField
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { loadDevJson, saveDevJson } from './devClient';
import type { ImageOverrideKind, ImageOverridesFile } from '@/ui/imageOverrides';

const OVERRIDE_FILE_PATH = 'src/data/image-overrides.json';

interface DevImageFieldProps {
  readonly kind: ImageOverrideKind;
  readonly entityId: string;
  readonly inferredPath: string | null;
}

interface OverridesState {
  readonly file: ImageOverridesFile | null;
  readonly loadError: string | null;
}

const EMPTY_FILE: ImageOverridesFile = {
  version: 1,
  overrides: { class: {}, monster: {}, item: {}, merc: {}, skill: {} }
};

function readOverride(file: ImageOverridesFile | null, kind: ImageOverrideKind, id: string): string {
  if (!file || !id) return '';
  const map = file.overrides[kind];
  const hit = map[id];
  return typeof hit === 'string' ? hit : '';
}

export function DevImageField({ kind, entityId, inferredPath }: DevImageFieldProps) {
  const { t } = useTranslation('dev');
  const [{ file, loadError }, setState] = useState<OverridesState>({ file: null, loadError: null });
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  // Load the overrides file on mount.
  useEffect(() => {
    let cancelled = false;
    loadDevJson<ImageOverridesFile>(OVERRIDE_FILE_PATH)
      .then((json) => {
        if (cancelled) return;
        setState({ file: json, loadError: null });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Failed';
        setState({ file: null, loadError: message });
      });
    return () => { cancelled = true; };
  }, []);

  // Sync draft input to the loaded file whenever the entity changes.
  useEffect(() => {
    setDraft(readOverride(file, kind, entityId));
    setStatus('');
  }, [file, kind, entityId]);

  const currentOverride = readOverride(file, kind, entityId);
  const hasOverride = currentOverride.length > 0;
  const effectivePath = hasOverride ? currentOverride : inferredPath;

  const persist = async (nextValue: string): Promise<void> => {
    const baseFile: ImageOverridesFile = file ?? EMPTY_FILE;
    const nextMap: Record<string, string> = { ...baseFile.overrides[kind] };
    if (nextValue.length > 0) {
      nextMap[entityId] = nextValue;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete nextMap[entityId];
    }
    const nextFile: ImageOverridesFile = {
      ...baseFile,
      version: 1,
      overrides: { ...baseFile.overrides, [kind]: nextMap }
    };
    setSaving(true);
    setStatus('');
    try {
      // Strip $schema-style passthrough fields if present — the validator
      // accepts them, but keep the write narrow to what we control.
      await saveDevJson(OVERRIDE_FILE_PATH, nextFile);
      setState({ file: nextFile, loadError: null });
      setStatus(t('imageField.saved'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('imageField.saveFailed');
      setStatus(`${t('imageField.saveFailed')}: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const onSave = (): void => { void persist(draft.trim()); };
  const onClear = (): void => {
    setDraft('');
    void persist('');
  };

  const altKey = hasOverride ? 'imageField.altOverride' : 'imageField.altInferred';
  const previewAlt = t(altKey, { kind, id: entityId });

  return (
    <section
      data-testid="dev-image-field"
      data-kind={kind}
      data-entity-id={entityId}
      data-override-state={hasOverride ? 'override' : 'inferred'}
      className="rounded border border-d2-border bg-black/20 p-3"
      aria-label={t('imageField.label')}
    >
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded border border-d2-border bg-d2-bg">
          {effectivePath ? (
            <img
              src={effectivePath}
              alt={previewAlt}
              className="h-full w-full object-contain"
              loading="lazy"
            />
          ) : (
            <span className="text-[10px] text-d2-white/70">{t('imageField.noPreview')}</span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-serif text-sm text-d2-gold">{t('imageField.label')}</h3>
            <span
              data-testid="dev-image-field-badge"
              className={[
                'rounded border px-2 py-[2px] text-[10px] uppercase tracking-wide',
                hasOverride
                  ? 'border-d2-gold/70 bg-d2-gold/10 text-d2-gold'
                  : 'border-d2-border text-d2-white/70'
              ].join(' ')}
            >
              {hasOverride ? t('imageField.badge.override') : t('imageField.badge.inferred')}
            </span>
          </div>

          <p className="break-all text-xs text-d2-white/60">
            <span className="text-d2-white/70">{t('imageField.lookupKey')}:</span>{' '}
            <code className="font-mono text-d2-white/80">{entityId}</code>
          </p>

          <label className="block text-xs text-d2-white/70">
            <span className="mb-1 block">{t('imageField.overridePath')}</span>
            <input
              type="text"
              value={draft}
              onChange={(event) => { setDraft(event.target.value); }}
              placeholder={t('imageField.overridePathPlaceholder')}
              spellCheck={false}
              className="w-full min-h-[44px] rounded border border-d2-border bg-d2-bg px-2 py-1 font-mono text-xs text-d2-white focus:border-d2-gold focus:outline-none"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onSave}
              disabled={saving || !file}
              className="min-h-[44px] rounded border border-d2-gold/70 bg-d2-gold/10 px-3 text-xs text-d2-gold hover:bg-d2-gold/20 disabled:opacity-50"
            >
              {t('imageField.save')}
            </button>
            <button
              type="button"
              onClick={onClear}
              disabled={saving || !hasOverride}
              className="min-h-[44px] rounded border border-d2-border px-3 text-xs text-d2-white/80 hover:text-d2-gold disabled:opacity-50"
            >
              {t('imageField.clearOverride')}
            </button>
            {loadError ? (
              <span role="status" className="text-xs text-red-400">{t('imageField.loadFailed')}: {loadError}</span>
            ) : null}
            {status ? (
              <span role="status" className="text-xs text-d2-white/70">{status}</span>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
