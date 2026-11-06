/**
 * CharacterCreate — class picker, name, gender, stat preview.
 *
 * Layout @ 360×640:
 *   [ Title: 创建角色 ]
 *   [ Class grid 2-col (7 classes) — tap to select; selected = gold border ]
 *   [ Name input (required, 1–16 chars) ]
 *   [ Gender toggle: 男 / 女 ]
 *   [ Stat preview panel (str/dex/vit/eng/life/mana) ]
 *   [ 进入 button — disabled until class+name valid ]
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, GameCard, Panel, resolveClassPortrait } from '@/ui';
import { usePlayerStore } from '@/stores';
import { useHydrationStore } from '@/stores/persistence';
import { WaveGuardError } from '@/stores/waveTransitionGuard';
import { createCharacter } from './createCharacter';
import {
  CHARACTER_CLASSES,
  type CharacterClass,
  getStartingStatPreview,
} from './createMockPlayer';

export function CharacterCreate() {
  const { t } = useTranslation(['character', 'common']);
  const navigate = useNavigate();
  const player = usePlayerStore((s) => s.player);
  const hydrationReady = useHydrationStore((s) => s.status === 'ready');

  const [selectedClass, setSelectedClass] = useState<CharacterClass | null>(null);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [startFailed, setStartFailed] = useState(false);

  const stats = useMemo(
    () => (selectedClass ? getStartingStatPreview(selectedClass) : null),
    [selectedClass],
  );

  const trimmedName = name.trim();
  const canStart = hydrationReady && !player && !!selectedClass && trimmedName.length >= 1 && trimmedName.length <= 16;

  const handleStart = () => {
    if (!canStart) return;
    let result: ReturnType<typeof createCharacter>;
    try {
      result = createCharacter(trimmedName, selectedClass);
    } catch (error) {
      if (!(error instanceof WaveGuardError)) throw error;
      setStartFailed(true);
      return;
    }
    setStartFailed(!result.ok);
    if (result.ok) navigate('/town');
  };

  return (
    <div
      className="min-h-[100dvh] bg-d2-bg text-d2-white px-3 py-4
                 pt-[max(1rem,env(safe-area-inset-top))]
                 pb-[max(1rem,env(safe-area-inset-bottom))] overflow-x-hidden"
      data-testid="character-create"
    >
      <div className="max-w-2xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => { navigate('/'); }}
            className="text-d2-white/70 hover:text-d2-gold min-h-[44px] min-w-[44px]
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-d2-gold rounded"
            aria-label={t('common:back')}
          >
            ← {t('common:back')}
          </button>
          <h1 className="text-2xl font-serif text-d2-gold">{t('createCharacter')}</h1>
          <div className="w-12" aria-hidden />
        </header>

        <Panel title={t('selectClass')}>
          <div className="grid grid-cols-2 sm:grid-cols-3 auto-rows-[20rem] gap-3">
            {CHARACTER_CLASSES.map((cls) => {
              const selected = selectedClass === cls;
              const preview = getStartingStatPreview(cls);
              return (
                <GameCard
                  key={cls}
                  variant="character"
                  size="md"
                  fluid
                  className="min-w-0 [&>.border-b]:shrink-0 [&>.border-t]:shrink-0
                             [&_.truncate]:whitespace-normal [&_.truncate]:break-words
                             [&>.border-t>.grid]:grid-cols-1
                             [&>.border-t>.grid>div]:flex-row [&>.border-t>.grid>div]:justify-between
                             [&>.border-t>.grid>div]:gap-1
                             [&_.text-micro]:text-sm [&_.text-micro]:text-d2-white/80
                             [&_.text-micro]:normal-case [&_.text-micro]:tracking-normal
                             [&_.text-micro]:leading-5"
                  name={t(`classes.${cls}`)}
                  rarity="unique"
                  image={resolveClassPortrait(cls) ?? undefined}
                  stats={[
                    { label: t('strength'), value: preview.strength },
                    { label: t('dexterity'), value: preview.dexterity },
                    { label: t('attributes.vitality'), value: preview.vitality },
                    { label: t('energy'), value: preview.energy }
                  ]}
                  bars={[
                    { kind: 'hp', current: preview.life, max: preview.life },
                    { kind: 'mp', current: preview.mana, max: preview.mana }
                  ]}
                  selected={selected}
                  onClick={() => { setSelectedClass(cls); }}
                  testId={`class-${cls}`}
                />
              );
            })}
          </div>
        </Panel>

        <Panel title={t('characterName')}>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); }}
            placeholder={t('enterName')}
            maxLength={16}
            className="w-full min-h-[44px] px-3 py-2 rounded
                       bg-d2-bg border border-d2-border text-d2-white
                       focus:outline-none focus:border-d2-gold focus-visible:ring-2 focus-visible:ring-d2-gold"
            data-testid="character-name-input"
            aria-label={t('characterName')}
          />
        </Panel>

        <Panel title={t('gender')}>
          <div className="flex gap-2">
            {(['male', 'female'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => { setGender(g); }}
                aria-pressed={gender === g}
                className={[
                  'flex-1 min-h-[44px] px-3 py-2 rounded border',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-d2-gold',
                  gender === g
                    ? 'border-d2-gold bg-d2-gold/10 text-d2-gold'
                    : 'border-d2-border bg-d2-panel text-d2-white',
                ].join(' ')}
              >
                {t(g)}
              </button>
            ))}
          </div>
        </Panel>

        {stats && (
          <Panel title={t('startingStats')}>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <StatRow label={t('strength')} value={stats.strength} />
              <StatRow label={t('dexterity')} value={stats.dexterity} />
              <StatRow label={t('attributes.vitality')} value={stats.vitality} />
              <StatRow label={t('energy')} value={stats.energy} />
              <StatRow label={t('common:life')} value={stats.life} accent="text-red-400" />
              <StatRow label={t('common:mana')} value={stats.mana} accent="text-blue-400" />
            </dl>
          </Panel>
        )}

        {startFailed && <p role="alert" className="text-red-400">{t('common:error')}</p>}
        <Button
          variant="primary"
          onClick={handleStart}
          disabled={!canStart}
          className="w-full text-lg min-h-[52px]"
          data-testid="character-start-btn"
        >
          {t('startGame')}
        </Button>
      </div>
    </div>
  );
}

function StatRow({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <>
      <dt className="text-d2-white/70">{label}</dt>
      <dd className={`text-right font-mono ${accent ?? 'text-d2-gold'}`}>{value}</dd>
    </>
  );
}
