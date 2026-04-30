import { JsonField, NumberField, NumberPairField, StringListField } from './DevEditorFields';
import { DevDataManager } from './DevDataManager';
import { DevImageField } from './DevImageField';
import type { JsonRecord } from './devJson';
import { monsterFiles } from './devPaths';
import { resolveMonsterArt } from '@/ui';

export function MonstersEditor() {
  return (
    <DevDataManager
      title="Monster Manager"
      description="Edit archetype HP, growth, attack cadence, defense, resistances, and skills."
      files={monsterFiles}
      renderFields={(entry, onChange) => <MonsterFields entry={entry} onChange={onChange} />}
    />
  );
}

function MonsterFields({ entry, onChange }: { readonly entry: JsonRecord; readonly onChange: (entry: JsonRecord) => void }) {
  return (
    <div className="space-y-4">
      <DevImageField entry={entry} onChange={onChange} resolve={resolveMonsterArt} />
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberPairField entry={entry} path={['life']} label="Base HP range" onChange={onChange} />
        <NumberPairField entry={entry} path={['lifeGrowth']} label="HP growth range" onChange={onChange} />
        <NumberField entry={entry} path={['defense']} label="Defense" onChange={onChange} />
        <NumberField entry={entry} path={['attackSpeed']} label="Attack speed" onChange={onChange} />
      </div>
      <StringListField entry={entry} path={['skills']} label="Skill list (comma-separated)" onChange={onChange} />
      <JsonField entry={entry} path={['resistances']} label="Resistances JSON" onChange={onChange} />
    </div>
  );
}
