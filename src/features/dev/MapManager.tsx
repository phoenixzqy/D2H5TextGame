import { JsonField, NumberField } from './DevEditorFields';
import { DevDataManager } from './DevDataManager';
import { asNumber, isRecord, type JsonRecord } from './devJson';
import { subAreaFiles } from './devPaths';
import { scaleMonsterLevelForArea } from '@/engine/combat/monster-factory';

export function MapManager() {
  return (
    <DevDataManager
      title="Map Manager"
      description="Edit sub-area level, weighted monster pool, and wave composition."
      files={subAreaFiles}
      renderFields={(entry, onChange) => <MapFields entry={entry} onChange={onChange} />}
    />
  );
}

function MapFields({ entry, onChange }: { readonly entry: JsonRecord; readonly onChange: (entry: JsonRecord) => void }) {
  const areaLevel = asNumber(entry.areaLevel, 1);
  const baseLevel = findBaseLevel(entry, areaLevel);
  const encounterLevels = collectEncounterLevels(entry).slice(0, 8);
  return (
    <div className="space-y-4">
      <NumberField entry={entry} path={['areaLevel']} label="Area level" onChange={onChange} />
      <JsonField entry={entry} path={['monsterPool']} label="Monster pool JSON [{ archetypeId, weight }]" onChange={onChange} />
      <JsonField entry={entry} path={['waves']} label="Wave composition JSON" onChange={onChange} />
      <div className="rounded border border-d2-border bg-black/20 p-3">
        <h2 className="mb-2 font-serif text-lg text-d2-gold">Level modifier preview</h2>
        <p className="mb-2 text-sm text-d2-white/70">
          Formula: M_eff = round(areaLevel + (encounterLevel - baseLevel) * 0.5). Base level: {baseLevel}.
        </p>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          {encounterLevels.map((level, index) => (
            <div key={`${String(level)}-${String(index)}`} className="flex justify-between rounded border border-d2-border/60 px-2 py-1">
              <span>Encounter level {level}</span>
              <span className="text-d2-gold">{scaleMonsterLevelForArea(level, areaLevel, baseLevel)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function collectEncounterLevels(entry: JsonRecord): number[] {
  const levels: number[] = [];
  const waves = Array.isArray(entry.waves) ? entry.waves : [];
  for (const wave of waves) {
    if (!isRecord(wave) || !Array.isArray(wave.encounters)) continue;
    for (const encounter of wave.encounters) {
      if (isRecord(encounter) && typeof encounter.level === 'number') levels.push(encounter.level);
    }
  }
  const boss = entry.bossEncounter;
  if (isRecord(boss) && typeof boss.level === 'number') levels.push(boss.level);
  return levels.length > 0 ? levels : [asNumber(entry.areaLevel, 1)];
}

function findBaseLevel(entry: JsonRecord, areaLevel: number): number {
  const levels = collectEncounterLevels(entry);
  return levels.length > 0 ? Math.min(...levels) : areaLevel;
}
