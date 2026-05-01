import { JsonField, NumberField, NumberPairField, StringListField } from './DevEditorFields';
import { DevDataManager } from './DevDataManager';
import { DevImageField } from './DevImageField';
import { asString, type JsonRecord } from './devJson';
import { monsterFiles } from './devPaths';
import { resolveMonsterArt } from '@/ui/cardAssets';
import { useTranslation } from 'react-i18next';

export function MonstersEditor() {
  const { t } = useTranslation('dev');
  return (
    <DevDataManager
      title={t('monstersEditor.title')}
      description={t('monstersEditor.description')}
      files={monsterFiles}
      renderFields={(entry, onChange) => <MonsterFields entry={entry} onChange={onChange} />}
    />
  );
}

function MonsterFields({ entry, onChange }: { readonly entry: JsonRecord; readonly onChange: (entry: JsonRecord) => void }) {
  const { t } = useTranslation('dev');
  const rawId = asString(entry.id);
  // Monster IDs are `monsters/act<N>.<slug>`; resolver strips the first segment
  // (everything up to and including the first `/`), leaving `act<N>.<slug>`.
  const overrideKey = rawId.includes('/') ? rawId.slice(rawId.indexOf('/') + 1) : rawId;
  return (
    <div className="space-y-4">
      {overrideKey ? (
        <DevImageField kind="monster" entityId={overrideKey} inferredPath={resolveMonsterArt(overrideKey)} />
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberPairField entry={entry} path={['life']} label={t('monstersEditor.fields.life')} onChange={onChange} />
        <NumberPairField entry={entry} path={['lifeGrowth']} label={t('monstersEditor.fields.lifeGrowth')} onChange={onChange} />
        <NumberField entry={entry} path={['defense']} label={t('monstersEditor.fields.defense')} onChange={onChange} />
        <NumberField entry={entry} path={['attackSpeed']} label={t('monstersEditor.fields.attackSpeed')} onChange={onChange} />
      </div>
      <StringListField entry={entry} path={['skills']} label={t('monstersEditor.fields.skills')} onChange={onChange} />
      <JsonField entry={entry} path={['resistances']} label={t('monstersEditor.fields.resistances')} onChange={onChange} />
    </div>
  );
}
