import { EnumField, JsonField, NumberField } from './DevEditorFields';
import { DevDataManager } from './DevDataManager';
import type { JsonRecord } from './devJson';
import { skillFiles } from './devPaths';
import { useTranslation } from 'react-i18next';

export function SkillsEditor() {
  const { t } = useTranslation('dev');
  return (
    <DevDataManager
      title={t('skillsEditor.title')}
      description={t('skillsEditor.description')}
      files={skillFiles}
      renderFields={(entry, onChange) => <SkillFields entry={entry} onChange={onChange} />}
    />
  );
}

function SkillFields({ entry, onChange }: { readonly entry: JsonRecord; readonly onChange: (entry: JsonRecord) => void }) {
  const { t } = useTranslation('dev');
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField entry={entry} path={['damage', 'min']} label={t('skillsEditor.fields.baseDamageMin')} onChange={onChange} />
        <NumberField entry={entry} path={['damage', 'max']} label={t('skillsEditor.fields.baseDamageMax')} onChange={onChange} />
        <NumberField entry={entry} path={['cooldown']} label={t('skillsEditor.fields.cooldown')} onChange={onChange} />
        <NumberField entry={entry} path={['cost', 'mana']} label={t('skillsEditor.fields.manaCost')} onChange={onChange} />
        <NumberField entry={entry} path={['scaling', 'damagePerLevel']} label={t('skillsEditor.fields.damagePerLevel')} onChange={onChange} />
        <NumberField entry={entry} path={['scaling', 'costPerLevel']} label={t('skillsEditor.fields.costPerLevel')} onChange={onChange} />
        <EnumField
          entry={entry}
          path={['aoeShape']}
          label={t('skillsEditor.fields.aoeShape')}
          options={[
            { value: 'single', label: 'single' },
            { value: 'line-3', label: 'line-3' },
            { value: 'column-3', label: 'column-3' },
            { value: 'cross', label: 'cross' },
            { value: 'box-3x3', label: 'box-3x3' },
            { value: 'all-enemies', label: 'all-enemies' }
          ]}
          onChange={onChange}
        />
      </div>
      <JsonField entry={entry} path={['damage', 'breakdown']} label={t('skillsEditor.fields.damageBreakdown')} onChange={onChange} />
      <JsonField entry={entry} path={['scaling']} label={t('skillsEditor.fields.scaling')} onChange={onChange} />
    </div>
  );
}
