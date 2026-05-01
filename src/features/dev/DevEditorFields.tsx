import { asNumber, asStringArray, getAtPath, setAtPath, type JsonRecord } from './devJson';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('dev');
  const raw = getAtPath(entry, path);
  const pair = Array.isArray(raw) ? raw : [0, 0];
  const min = asNumber(pair[0]);
  const max = asNumber(pair[1]);
  return (
    <fieldset className="grid grid-cols-2 gap-2 text-sm text-d2-white/80">
      <legend className="col-span-2 mb-1">{label}</legend>
      <input
        aria-label={t('fields.minAria', { label })}
        type="number"
        value={min}
        onChange={(event) => { onChange(setAtPath(entry, path, [Number(event.target.value), max])); }}
        className="min-h-[40px] rounded border border-d2-border bg-d2-bg px-2 py-1 text-d2-white focus:border-d2-gold focus:outline-none"
      />
      <input
        aria-label={t('fields.maxAria', { label })}
        type="number"
        value={max}
        onChange={(event) => { onChange(setAtPath(entry, path, [min, Number(event.target.value)])); }}
        className="min-h-[40px] rounded border border-d2-border bg-d2-bg px-2 py-1 text-d2-white focus:border-d2-gold focus:outline-none"
      />
    </fieldset>
  );
}


export interface EnumOption {
  readonly value: string;
  readonly label: string;
}

interface EnumFieldProps {
  readonly entry: JsonRecord;
  readonly path: readonly string[];
  readonly label: string;
  readonly options: readonly EnumOption[];
  readonly onChange: (entry: JsonRecord) => void;
  /** When true, renders a red border + warning hint below the select. */
  readonly invalid?: boolean;
  /** Optional warning text shown when invalid is true (already i18n-resolved). */
  readonly invalidHint?: string;
  /** Show an empty -- option so the field can be left unset. Default: true. */
  readonly allowEmpty?: boolean;
}

/**
 * Generic enum-as-select dev-tool field. Used for weaponType and
 * handedness on weapon item bases. Persists the raw string value at
 * path (or removes the key entirely when set to empty).
 */
export function EnumField({ entry, path, label, options, onChange, invalid = false, invalidHint, allowEmpty = true }: EnumFieldProps) {
  const id = `dev-${path.join('-')}`;
  const raw = getAtPath(entry, path);
  const value = typeof raw === 'string' ? raw : '';
  const baseClass = 'w-full min-h-[40px] rounded border bg-d2-bg px-2 py-1 text-d2-white focus:outline-none';
  const borderClass = invalid ? 'border-red-500 focus:border-red-400' : 'border-d2-border focus:border-d2-gold';
  return (
    <label className="block text-sm text-d2-white/80" htmlFor={id}>
      <span className="mb-1 block">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          if (next === '') {
            // Remove the key entirely when "unset" is chosen.
            const head = path[0];
            if (path.length === 1 && head !== undefined) {
              const cloned: JsonRecord = { ...entry };
              // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
              delete cloned[head];
              onChange(cloned);
              return;
            }
            onChange(setAtPath(entry, path, undefined));
            return;
          }
          onChange(setAtPath(entry, path, next));
        }}
        aria-invalid={invalid}
        className={[baseClass, borderClass].join(' ')}
      >
        {allowEmpty ? <option value="">--</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {invalid && invalidHint ? (
        <span role="alert" className="mt-1 block text-xs text-red-400">{invalidHint}</span>
      ) : null}
    </label>
  );
}
