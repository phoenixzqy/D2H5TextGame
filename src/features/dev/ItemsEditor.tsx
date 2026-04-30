import { useState } from 'react';
import { CheckboxField, JsonField, NumberField, StringListField, TextField } from './DevEditorFields';
import { DevDataManager } from './DevDataManager';
import { DevImageField } from './DevImageField';
import { setAtPath, type JsonRecord } from './devJson';
import type { DevDataFile } from './devPaths';
import { resolveItemIcon } from '@/ui';

const WEAPON_TYPES = ['', 'sword', 'axe', 'mace', 'club', 'hammer', 'dagger', 'bow', 'crossbow', 'staff', 'wand', 'scepter', 'polearm', 'spear', 'throwing'] as const;
const HANDEDNESS = ['', '1h', '2h'] as const;

const itemTabs = {
  bases: {
    label: 'Bases',
    files: [{ label: 'Base items', path: 'src/data/items/bases.json' }],
    description: 'Edit item base requirements, defense, damage, and affix eligibility.'
  },
  uniques: {
    label: 'Uniques',
    files: [{ label: 'Unique items', path: 'src/data/items/uniques.json' }],
    description: 'Edit unique item requirements and stat modifiers.'
  },
  sets: {
    label: 'Sets',
    files: [{ label: 'Set items', path: 'src/data/items/sets.json' }],
    description: 'Edit set composition and piece bonuses.'
  }
} satisfies Record<string, { readonly label: string; readonly files: readonly DevDataFile[]; readonly description: string }>;

type ItemTab = keyof typeof itemTabs;

export function ItemsEditor() {
  const [tab, setTab] = useState<ItemTab>('bases');
  const config = itemTabs[tab];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Item managers">
        {(Object.keys(itemTabs) as ItemTab[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => { setTab(key); }}
            className={[
              'min-h-[40px] rounded border px-3 text-sm',
              tab === key ? 'border-d2-gold bg-d2-gold/10 text-d2-gold' : 'border-d2-border text-d2-white/80 hover:text-d2-gold'
            ].join(' ')}
          >
            {itemTabs[key].label}
          </button>
        ))}
      </div>
      <DevDataManager
        key={tab}
        title={`${config.label} Manager`}
        description={config.description}
        files={config.files}
        renderFields={(entry, onChange) => {
          if (tab === 'bases') return <BaseFields entry={entry} onChange={onChange} />;
          if (tab === 'uniques') return <UniqueFields entry={entry} onChange={onChange} />;
          return <SetFields entry={entry} onChange={onChange} />;
        }}
      />
    </div>
  );
}

function BaseFields({ entry, onChange }: { readonly entry: JsonRecord; readonly onChange: (entry: JsonRecord) => void }) {
  const isWeapon = entry.type === 'weapon';
  const weaponType = typeof entry.weaponType === 'string' ? entry.weaponType : '';
  const handedness = typeof entry.handedness === 'string' ? entry.handedness : '';
  return (
    <div className="space-y-4">
      <DevImageField entry={entry} onChange={onChange} resolve={resolveItemIcon} />
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField entry={entry} path={['reqLevel']} label="Required level" onChange={onChange} />
        <NumberField entry={entry} path={['baseDefense']} label="Base defense" onChange={onChange} />
        <NumberField entry={entry} path={['baseDamage', 'min']} label="Base damage min" onChange={onChange} />
        <NumberField entry={entry} path={['baseDamage', 'max']} label="Base damage max" onChange={onChange} />
      </div>
      {isWeapon && (
        <div className="grid gap-3 rounded border border-d2-border bg-black/20 p-3 sm:grid-cols-2">
          <label className="block text-sm text-d2-white/80">
            <span className="mb-1 block">Weapon type</span>
            <select
              value={weaponType}
              onChange={(event) => {
                const v = event.target.value;
                onChange(setAtPath(entry, ['weaponType'], v === '' ? undefined : v));
              }}
              className="w-full min-h-[40px] rounded border border-d2-border bg-d2-bg px-2 text-d2-white"
            >
              {WEAPON_TYPES.map((wt) => <option key={wt} value={wt}>{wt === '' ? '— none —' : wt}</option>)}
            </select>
          </label>
          <label className="block text-sm text-d2-white/80">
            <span className="mb-1 block">Handedness</span>
            <select
              value={handedness}
              onChange={(event) => {
                const v = event.target.value;
                onChange(setAtPath(entry, ['handedness'], v === '' ? undefined : v));
              }}
              className="w-full min-h-[40px] rounded border border-d2-border bg-d2-bg px-2 text-d2-white"
            >
              {HANDEDNESS.map((h) => <option key={h} value={h}>{h === '' ? '— none —' : h === '1h' ? 'One-handed' : 'Two-handed'}</option>)}
            </select>
          </label>
        </div>
      )}
      <CheckboxField entry={entry} path={['canHaveAffixes']} label="Can roll affixes" onChange={onChange} />
      <JsonField entry={entry} path={['baseDamage', 'breakdown']} label="Base damage breakdown JSON" onChange={onChange} />
      <JsonField entry={entry} path={['reqStats']} label="Required stats JSON" onChange={onChange} />
    </div>
  );
}

function UniqueFields({ entry, onChange }: { readonly entry: JsonRecord; readonly onChange: (entry: JsonRecord) => void }) {
  return (
    <div className="space-y-4">
      <DevImageField entry={entry} onChange={onChange} resolve={resolveItemIcon} />
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField entry={entry} path={['reqLevel']} label="Required level" onChange={onChange} />
        <TextField entry={entry} path={['baseId']} label="Base item id" onChange={onChange} />
      </div>
      <JsonField entry={entry} path={['stats', 'statMods']} label="Stat mods JSON" onChange={onChange} />
      <JsonField entry={entry} path={['stats']} label="Full unique stats JSON" onChange={onChange} />
    </div>
  );
}

function SetFields({ entry, onChange }: { readonly entry: JsonRecord; readonly onChange: (entry: JsonRecord) => void }) {
  return (
    <div className="space-y-4">
      <StringListField entry={entry} path={['items']} label="Set item ids (comma-separated)" onChange={onChange} />
      <JsonField entry={entry} path={['bonuses']} label="Piece bonuses JSON" onChange={onChange} />
    </div>
  );
}
