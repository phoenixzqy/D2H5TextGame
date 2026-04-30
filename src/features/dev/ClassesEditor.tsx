import { NumberField, StringListField } from './DevEditorFields';
import { DevDataManager } from './DevDataManager';
import { asNumber, asRecord, getAtPath, type JsonRecord } from './devJson';
import { classFiles } from './devPaths';

export function ClassesEditor() {
  return (
    <DevDataManager
      title="Class Manager"
      description="Edit class stat curves, life/mana growth, and starter skills."
      files={classFiles}
      renderFields={(entry, onChange) => <ClassFields entry={entry} onChange={onChange} />}
    />
  );
}

function ClassFields({ entry, onChange }: { readonly entry: JsonRecord; readonly onChange: (entry: JsonRecord) => void }) {
  const stats = asRecord(entry.startingStats);
  const growth = asRecord(entry.statGrowth);
  const previewLevels = [1, 10, 30];
  return (
    <div className="space-y-4">
      <div>
        <h2 className="mb-2 font-serif text-lg text-d2-gold">Starting stats</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(['strength', 'dexterity', 'vitality', 'energy'] as const).map((key) => (
            <NumberField key={key} entry={entry} path={['startingStats', key]} label={key} onChange={onChange} />
          ))}
        </div>
      </div>
      <div>
        <h2 className="mb-2 font-serif text-lg text-d2-gold">Per-level stat growth</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(['strength', 'dexterity', 'vitality', 'energy'] as const).map((key) => (
            <NumberField key={key} entry={entry} path={['statGrowth', key]} label={key} onChange={onChange} />
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField entry={entry} path={['lifePerLevel']} label="Life per level" onChange={onChange} />
        <NumberField entry={entry} path={['manaPerLevel']} label="Mana per level" onChange={onChange} />
      </div>
      <StringListField entry={entry} path={['starterSkills']} label="Starter skills (comma-separated)" onChange={onChange} />
      <div className="rounded border border-d2-border bg-black/20 p-3">
        <h2 className="mb-2 font-serif text-lg text-d2-gold">Stat curve preview</h2>
        <div className="grid gap-2 text-sm md:grid-cols-3">
          {previewLevels.map((level) => (
            <dl key={level} className="rounded border border-d2-border/60 p-2">
              <dt className="text-d2-white/60">Level {level}</dt>
              {(['strength', 'dexterity', 'vitality', 'energy'] as const).map((key) => (
                <dd key={key} className="flex justify-between"><span>{key}</span><span className="text-d2-gold">{Math.round(asNumber(stats[key]) + Math.max(0, level - 1) * asNumber(growth[key]))}</span></dd>
              ))}
              <dd className="flex justify-between"><span>life</span><span className="text-red-300">{Math.round(asNumber(getAtPath(entry, ['lifePerLevel'])) * Math.max(0, level - 1))}</span></dd>
              <dd className="flex justify-between"><span>mana</span><span className="text-blue-300">{Math.round(asNumber(getAtPath(entry, ['manaPerLevel'])) * Math.max(0, level - 1))}</span></dd>
            </dl>
          ))}
        </div>
      </div>
    </div>
  );
}
