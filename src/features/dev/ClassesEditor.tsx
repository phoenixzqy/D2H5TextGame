import { NumberField, StringListField } from './DevEditorFields';
import { DevDataManager } from './DevDataManager';
import { DevImageField } from './DevImageField';
import { asNumber, asRecord, asString, getAtPath, type JsonRecord } from './devJson';
import { classFiles } from './devPaths';
import { resolveClassPortrait } from '@/ui/cardAssets';
import { useTranslation } from 'react-i18next';

export function ClassesEditor() {
  const { t } = useTranslation('dev');
  return (
    <DevDataManager
      title={t('classesEditor.title')}
      description={t('classesEditor.description')}
      files={classFiles}
      renderFields={(entry, onChange) => <ClassFields entry={entry} onChange={onChange} />}
    />
  );
}

function ClassFields({ entry, onChange }: { readonly entry: JsonRecord; readonly onChange: (entry: JsonRecord) => void }) {
  const { t } = useTranslation('dev');
  const stats = asRecord(entry.startingStats);
  const growth = asRecord(entry.statGrowth);
  const previewLevels = [1, 10, 30];
  const rawId = asString(entry.id);
  // Class IDs are `classes/<slug>`; the resolver strips the first segment.
  const slug = rawId.includes('/') ? rawId.slice(rawId.indexOf('/') + 1) : rawId;
  return (
    <div className="space-y-4">
      {slug ? (
        <DevImageField kind="class" entityId={slug} inferredPath={resolveClassPortrait(slug)} />
      ) : null}
      <div>
        <h2 className="mb-2 font-serif text-lg text-d2-gold">{t('classesEditor.sections.startingStats')}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(['strength', 'dexterity', 'vitality', 'energy'] as const).map((key) => (
            <NumberField key={key} entry={entry} path={['startingStats', key]} label={t(`classesEditor.stats.${key}`)} onChange={onChange} />
          ))}
        </div>
      </div>
      <div>
        <h2 className="mb-2 font-serif text-lg text-d2-gold">{t('classesEditor.sections.statGrowth')}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(['strength', 'dexterity', 'vitality', 'energy'] as const).map((key) => (
            <NumberField key={key} entry={entry} path={['statGrowth', key]} label={t(`classesEditor.stats.${key}`)} onChange={onChange} />
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField entry={entry} path={['lifePerLevel']} label={t('classesEditor.fields.lifePerLevel')} onChange={onChange} />
        <NumberField entry={entry} path={['manaPerLevel']} label={t('classesEditor.fields.manaPerLevel')} onChange={onChange} />
      </div>
      <StringListField entry={entry} path={['starterSkills']} label={t('classesEditor.fields.starterSkills')} onChange={onChange} />
      <div className="rounded border border-d2-border bg-black/20 p-3">
        <h2 className="mb-2 font-serif text-lg text-d2-gold">{t('classesEditor.sections.statCurvePreview')}</h2>
        <div className="grid gap-2 text-sm md:grid-cols-3">
          {previewLevels.map((level) => (
            <dl key={level} className="rounded border border-d2-border/60 p-2">
              <dt className="text-d2-white/60">{t('classesEditor.preview.level', { level })}</dt>
              {(['strength', 'dexterity', 'vitality', 'energy'] as const).map((key) => (
                <dd key={key} className="flex justify-between"><span>{t(`classesEditor.stats.${key}`)}</span><span className="text-d2-gold">{Math.round(asNumber(stats[key]) + Math.max(0, level - 1) * asNumber(growth[key]))}</span></dd>
              ))}
              <dd className="flex justify-between"><span>{t('classesEditor.preview.life')}</span><span className="text-red-300">{Math.round(asNumber(getAtPath(entry, ['lifePerLevel'])) * Math.max(0, level - 1))}</span></dd>
              <dd className="flex justify-between"><span>{t('classesEditor.preview.mana')}</span><span className="text-blue-300">{Math.round(asNumber(getAtPath(entry, ['manaPerLevel'])) * Math.max(0, level - 1))}</span></dd>
            </dl>
          ))}
        </div>
      </div>
    </div>
  );
}
