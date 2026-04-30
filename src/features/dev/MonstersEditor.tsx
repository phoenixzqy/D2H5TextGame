import { JsonField, NumberField, NumberPairField, StringListField } from './DevEditorFields';
import { DevDataManager } from './DevDataManager';
import { DevImageField } from './DevImageField';
import { asString, type JsonRecord } from './devJson';
import { monsterFiles } from './devPaths';
import { resolveMonsterArt } from '@/ui/cardAssets';

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
