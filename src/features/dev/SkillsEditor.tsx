import { JsonField, NumberField } from './DevEditorFields';
import { DevDataManager } from './DevDataManager';
import type { JsonRecord } from './devJson';
import { skillFiles } from './devPaths';

export function SkillsEditor() {
  return (
    <DevDataManager
      title="Skill Manager"
      description="Edit skill damage, cooldown, mana cost, and per-level scaling."
      files={skillFiles}
      renderFields={(entry, onChange) => <SkillFields entry={entry} onChange={onChange} />}
    />
  );
}

function SkillFields({ entry, onChange }: { readonly entry: JsonRecord; readonly onChange: (entry: JsonRecord) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField entry={entry} path={['damage', 'min']} label="Base damage min" onChange={onChange} />
        <NumberField entry={entry} path={['damage', 'max']} label="Base damage max" onChange={onChange} />
        <NumberField entry={entry} path={['cooldown']} label="Cooldown" onChange={onChange} />
        <NumberField entry={entry} path={['cost', 'mana']} label="Mana cost" onChange={onChange} />
        <NumberField entry={entry} path={['scaling', 'damagePerLevel']} label="Damage per skill level" onChange={onChange} />
        <NumberField entry={entry} path={['scaling', 'costPerLevel']} label="Cost per skill level" onChange={onChange} />
      </div>
      <JsonField entry={entry} path={['damage', 'breakdown']} label="Damage type breakdown JSON" onChange={onChange} />
      <JsonField entry={entry} path={['scaling']} label="Scaling JSON" onChange={onChange} />
    </div>
  );
}
