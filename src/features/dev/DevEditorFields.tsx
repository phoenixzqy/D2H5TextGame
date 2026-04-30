import { asNumber, asStringArray, getAtPath, setAtPath, type JsonRecord } from './devJson';

interface FieldProps {
  readonly entry: JsonRecord;
  readonly path: readonly string[];
  readonly label: string;
  readonly onChange: (entry: JsonRecord) => void;
}

export function NumberField({ entry, path, label, onChange }: FieldProps) {
  const id = `dev-${path.join('-')}`;
  const value = asNumber(getAtPath(entry, path));
  return (
    <label className="block text-sm text-d2-white/80" htmlFor={id}>
      <span className="mb-1 block">{label}</span>
      <input
        id={id}
        type="number"
        value={value}
        onChange={(event) => { onChange(setAtPath(entry, path, Number(event.target.value))); }}
        className="w-full min-h-[40px] rounded border border-d2-border bg-d2-bg px-2 py-1 text-d2-white focus:border-d2-gold focus:outline-none"
      />
    </label>
  );
}

export function TextField({ entry, path, label, onChange }: FieldProps) {
  const id = `dev-${path.join('-')}`;
  const value = String(getAtPath(entry, path) ?? '');
  return (
    <label className="block text-sm text-d2-white/80" htmlFor={id}>
      <span className="mb-1 block">{label}</span>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => { onChange(setAtPath(entry, path, event.target.value)); }}
        className="w-full min-h-[40px] rounded border border-d2-border bg-d2-bg px-2 py-1 text-d2-white focus:border-d2-gold focus:outline-none"
      />
    </label>
  );
}

export function CheckboxField({ entry, path, label, onChange }: FieldProps) {
  const value = getAtPath(entry, path) === true;
  return (
    <label className="flex min-h-[40px] items-center gap-2 text-sm text-d2-white/80">
      <input
        type="checkbox"
        checked={value}
        onChange={(event) => { onChange(setAtPath(entry, path, event.target.checked)); }}
        className="h-4 w-4 accent-d2-gold"
      />
      {label}
    </label>
  );
}

export function StringListField({ entry, path, label, onChange }: FieldProps) {
  const id = `dev-${path.join('-')}`;
  const value = asStringArray(getAtPath(entry, path)).join(', ');
  return (
    <label className="block text-sm text-d2-white/80" htmlFor={id}>
      <span className="mb-1 block">{label}</span>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => {
          const next = event.target.value.split(',').map((item) => item.trim()).filter(Boolean);
          onChange(setAtPath(entry, path, next));
        }}
        className="w-full min-h-[40px] rounded border border-d2-border bg-d2-bg px-2 py-1 text-d2-white focus:border-d2-gold focus:outline-none"
      />
    </label>
  );
}

export function JsonField({ entry, path, label, onChange }: FieldProps) {
  const id = `dev-${path.join('-')}`;
  const value = JSON.stringify(getAtPath(entry, path) ?? {}, null, 2);
  return (
    <label className="block text-sm text-d2-white/80" htmlFor={id}>
      <span className="mb-1 block">{label}</span>
      <textarea
        id={id}
        value={value}
        onChange={(event) => {
          try {
            onChange(setAtPath(entry, path, JSON.parse(event.target.value) as unknown));
          } catch {
            // Keep editing local text impossible with controlled JSON; validation happens on save.
          }
        }}
        rows={8}
        className="w-full rounded border border-d2-border bg-d2-bg px-2 py-1 font-mono text-xs text-d2-white focus:border-d2-gold focus:outline-none"
      />
    </label>
  );
}

interface NumberPairProps {
  readonly entry: JsonRecord;
  readonly path: readonly string[];
  readonly label: string;
  readonly onChange: (entry: JsonRecord) => void;
}

export function NumberPairField({ entry, path, label, onChange }: NumberPairProps) {
  const raw = getAtPath(entry, path);
  const pair = Array.isArray(raw) ? raw : [0, 0];
  const min = asNumber(pair[0]);
  const max = asNumber(pair[1]);
  return (
    <fieldset className="grid grid-cols-2 gap-2 text-sm text-d2-white/80">
      <legend className="col-span-2 mb-1">{label}</legend>
      <input
        aria-label={`${label} min`}
        type="number"
        value={min}
        onChange={(event) => { onChange(setAtPath(entry, path, [Number(event.target.value), max])); }}
        className="min-h-[40px] rounded border border-d2-border bg-d2-bg px-2 py-1 text-d2-white focus:border-d2-gold focus:outline-none"
      />
      <input
        aria-label={`${label} max`}
        type="number"
        value={max}
        onChange={(event) => { onChange(setAtPath(entry, path, [min, Number(event.target.value)])); }}
        className="min-h-[40px] rounded border border-d2-border bg-d2-bg px-2 py-1 text-d2-white focus:border-d2-gold focus:outline-none"
      />
    </fieldset>
  );
}
