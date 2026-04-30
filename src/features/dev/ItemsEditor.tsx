import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckboxField, EnumField, JsonField, NumberField, StringListField, TextField, type EnumOption } from './DevEditorFields';
import { DevDataManager } from './DevDataManager';
import { DevImageField } from './DevImageField';
import { asString, type JsonRecord } from './devJson';
import type { DevDataFile } from './devPaths';
import { resolveItemIcon } from '@/ui/cardAssets';

const WEAPON_TYPES = [
  'sword', 'axe', 'mace', 'dagger', 'spear', 'polearm',
  'bow', 'crossbow', 'throwing',
  'staff', 'wand', 'scepter', 'orb'
] as const;

const HANDEDNESS_VALUES = ['oneHanded', 'twoHanded'] as const;

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

/**
 * Compute the post-strip override key for an item entry. Mirrors
 * `stripPrefix` in `src/ui/cardAssets.ts`: removes everything up to and
 * including the first `/`. Returns '' when the entry has no usable id.
 */
function itemOverrideKey(rawId: string): string {
  if (!rawId) return '';
  const slash = rawId.indexOf('/');
  return slash === -1 ? rawId : rawId.slice(slash + 1);
}

export function BaseFields({ entry, onChange }: { readonly entry: JsonRecord; readonly onChange: (entry: JsonRecord) => void }) {
  const { t } = useTranslation('dev');
  const rawId = asString(entry.id);
  const key = itemOverrideKey(rawId);
  const isWeapon = entry.type === 'weapon';
  const weaponTypeMissing = isWeapon && typeof entry.weaponType !== 'string';
  const handednessMissing = isWeapon && typeof entry.handedness !== 'string';
  const weaponTypeOptions: readonly EnumOption[] = WEAPON_TYPES.map((value) => ({
    value,
    label: t(`weaponType.${value}`)
  }));
  const handednessOptions: readonly EnumOption[] = HANDEDNESS_VALUES.map((value) => ({
    value,
    label: t(`handedness.${value}`)
  }));
  return (
    <div className="space-y-4">
      {key ? (
        <DevImageField kind="item" entityId={key} inferredPath={resolveItemIcon(key)} />
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField entry={entry} path={['reqLevel']} label="Required level" onChange={onChange} />
        <NumberField entry={entry} path={['baseDefense']} label="Base defense" onChange={onChange} />
        <NumberField entry={entry} path={['baseDamage', 'min']} label="Base damage min" onChange={onChange} />
        <NumberField entry={entry} path={['baseDamage', 'max']} label="Base damage max" onChange={onChange} />
      </div>
      {isWeapon ? (
        <div className="grid gap-3 sm:grid-cols-2" data-testid="weapon-fields">
          <EnumField
            entry={entry}
            path={['weaponType']}
            label={t('itemsEditor.weaponType')}
            options={weaponTypeOptions}
            invalid={weaponTypeMissing}
            invalidHint={t('itemsEditor.requiredForWeapon')}
            onChange={onChange}
          />
          <EnumField
            entry={entry}
            path={['handedness']}
            label={t('itemsEditor.handedness')}
            options={handednessOptions}
            invalid={handednessMissing}
            invalidHint={t('itemsEditor.requiredForWeapon')}
            onChange={onChange}
          />
        </div>
      ) : null}
      <CheckboxField entry={entry} path={['canHaveAffixes']} label="Can roll affixes" onChange={onChange} />
      <JsonField entry={entry} path={['baseDamage', 'breakdown']} label="Base damage breakdown JSON" onChange={onChange} />
      <JsonField entry={entry} path={['reqStats']} label="Required stats JSON" onChange={onChange} />
    </div>
  );
}

function UniqueFields({ entry, onChange }: { readonly entry: JsonRecord; readonly onChange: (entry: JsonRecord) => void }) {
  const rawId = asString(entry.id);
  const key = itemOverrideKey(rawId);
  return (
    <div className="space-y-4">
      {key ? (
        <DevImageField kind="item" entityId={key} inferredPath={resolveItemIcon(key)} />
      ) : null}
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
  const rawId = asString(entry.id);
  const key = itemOverrideKey(rawId);
  return (
    <div className="space-y-4">
      {key ? (
        <DevImageField kind="item" entityId={key} inferredPath={resolveItemIcon(key)} />
      ) : null}
      <StringListField entry={entry} path={['items']} label="Set item ids (comma-separated)" onChange={onChange} />
      <JsonField entry={entry} path={['bonuses']} label="Piece bonuses JSON" onChange={onChange} />
    </div>
  );
}
