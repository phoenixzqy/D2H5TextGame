/**
 * DevImageField — preview + override editor for an entity's image mapping.
 *
 * Shows the currently-resolved icon (via `resolve()`) and an editable
 * `imagePath` field that, when persisted to JSON, becomes the runtime
 * override (see `cardAssets.ts`'s `*_OVERRIDES` maps).
 */
import { useState } from 'react';
import { getAtPath, setAtPath, type JsonRecord } from './devJson';

interface Props {
  readonly entry: JsonRecord;
  readonly onChange: (entry: JsonRecord) => void;
  /** Resolver from the entry's id to a public URL (or null). */
  readonly resolve: (id: string) => string | null;
  /** Path inside the entry where the override path lives. Defaults to ['imagePath']. */
  readonly path?: readonly string[];
}

export function DevImageField({ entry, onChange, resolve, path = ['imagePath'] }: Props) {
  const id = typeof entry.id === 'string' ? entry.id : '';
  const overrideRaw = getAtPath(entry, path);
  const override = typeof overrideRaw === 'string' ? overrideRaw : '';
  const resolved = resolve(id);
  const display = override !== '' ? override : resolved ?? '';
  const [errored, setErrored] = useState(false);

  return (
    <div className="rounded border border-d2-border bg-black/20 p-3" data-testid="dev-image-field">
      <h2 className="mb-2 font-serif text-lg text-d2-gold">Image</h2>
      <div className="flex items-start gap-3">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded border border-d2-border bg-d2-panel">
          {display && !errored ? (
            <img
              src={display}
              alt=""
              className="h-full w-full object-contain"
              onError={() => { setErrored(true); }}
            />
          ) : (
            <span aria-hidden className="font-serif text-2xl text-d2-border">?</span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="text-xs text-d2-white/60">
            <span className="block text-d2-white/50">Currently mapped</span>
            <code className="block break-all text-d2-white/80">{resolved ?? '— no auto-mapping —'}</code>
          </div>
          <label className="block text-sm text-d2-white/80">
            <span className="mb-1 block">Custom image path / URL (override)</span>
            <input
              type="text"
              value={override}
              placeholder="/assets/d2/generated/... or absolute URL"
              onChange={(event) => {
                setErrored(false);
                const value = event.target.value;
                onChange(setAtPath(entry, path, value === '' ? undefined : value));
              }}
              className="w-full min-h-[40px] rounded border border-d2-border bg-d2-bg px-2 py-1 text-d2-white focus:border-d2-gold focus:outline-none"
            />
          </label>
          <p className="text-[11px] text-d2-white/50">
            Leave empty to use the auto-resolved mapping. Saved to JSON; takes effect after refresh.
          </p>
        </div>
      </div>
    </div>
  );
}
