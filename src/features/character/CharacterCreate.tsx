/** Class and identity tabs keep creation within the available viewport. */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Panel, Tabs, Modal, resolveClassPortrait } from '@/ui';
import { usePlayerStore } from '@/stores';
import { useHydrationStore } from '@/stores/persistence';
import { WaveGuardError } from '@/stores/waveTransitionGuard';
import { createCharacter } from './createCharacter';
import { CHARACTER_CLASSES, type CharacterClass, getStartingStatPreview } from './createMockPlayer';

export function CharacterCreate() {
  const { t } = useTranslation(['character', 'common']);
  const navigate = useNavigate();
  const player = usePlayerStore((s) => s.player);
  const hydrationReady = useHydrationStore((s) => s.status === 'ready');

  const [selectedClass, setSelectedClass] = useState<CharacterClass | null>(null);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [statsOpen, setStatsOpen] = useState(false);
  const [startFailed, setStartFailed] = useState(false);

  const stats = useMemo(
    () => (selectedClass ? getStartingStatPreview(selectedClass) : null),
    [selectedClass]
  );

  const trimmedName = name.trim();
  const canStart =
    hydrationReady &&
    !player &&
    !!selectedClass &&
    trimmedName.length >= 1 &&
    trimmedName.length <= 16;

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
      className="d2-create h-[100dvh] bg-d2-bg text-d2-white px-3 py-4
                 pt-[max(1rem,env(safe-area-inset-top))]
                 pb-[max(1rem,env(safe-area-inset-bottom))] overflow-hidden"
      data-testid="character-create"
    >
      <div className="mx-auto flex h-full min-h-0 max-w-3xl flex-col gap-2">
        <header className="d2-create-header !py-0 shrink-0 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              navigate('/');
            }}
            className="d2-control px-3 text-d2-white/70 hover:text-d2-gold min-h-[44px] min-w-[44px]
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-d2-gold rounded"
            aria-label={t('common:back')}
          >
            ← {t('common:back')}
          </button>
          <h1 className="text-2xl font-serif text-d2-gold">{t('createCharacter')}</h1>
          <div className="w-12" aria-hidden />
        </header>

        <Tabs
          tabs={[
            {
              id: 'class',
              label: t('selectClass'),
              content: (
                <div className="flex min-h-0 flex-1 flex-col gap-2">
                  <div className="grid shrink-0 grid-cols-4 gap-1">
                    {CHARACTER_CLASSES.map((cls) => (
                      <button
                        key={cls}
                        type="button"
                        data-testid={`class-${cls}`}
                        aria-pressed={selectedClass === cls}
                        className={`d2-control min-h-11 rounded border px-1 text-xs focus-visible:ring-2 focus-visible:ring-d2-gold ${selectedClass === cls ? 'border-d2-gold text-d2-gold' : 'border-d2-border text-d2-white/80'}`}
                        onClick={() => {
                          setSelectedClass(cls);
                        }}
                      >
                        {t(`classes.${cls}`)}
                      </button>
                    ))}
                  </div>
                  {selectedClass && stats ? (
                    <div className="flex min-h-0 flex-1 gap-3">
                      <img
                        src={resolveClassPortrait(selectedClass) ?? undefined}
                        alt=""
                        className="min-h-0 w-1/2 rounded border border-d2-border object-contain"
                      />
                      <div className="min-w-0 flex-1 self-center">
                        <h2 className="mb-2 font-serif text-d2-gold">
                          {t(`classes.${selectedClass}`)}
                        </h2>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setStatsOpen(true);
                          }}
                        >
                          {t('startingStats')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="m-auto text-d2-white/70">{t('selectClass')}</p>
                  )}
                </div>
              )
            },
            {
              id: 'identity',
              label: t('characterName'),
              content: (
                <div className="grid min-h-0 gap-2 sm:grid-cols-2">
                  <Panel title={t('characterName')}>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                      }}
                      placeholder={t('enterName')}
                      maxLength={16}
                      className="d2-field w-full min-h-[44px] px-3 py-2 rounded
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
                          onClick={() => {
                            setGender(g);
                          }}
                          aria-pressed={gender === g}
                          className={[
                            'd2-control flex-1 min-h-[44px] px-3 py-2 rounded border',
                            'focus:outline-none focus-visible:ring-2 focus-visible:ring-d2-gold',
                            gender === g
                              ? 'border-d2-gold bg-d2-gold/10 text-d2-gold'
                              : 'border-d2-border bg-d2-panel text-d2-white'
                          ].join(' ')}
                        >
                          {t(g)}
                        </button>
                      ))}
                    </div>
                  </Panel>
                </div>
              )
            }
          ]}
        />

        <Modal
          isOpen={statsOpen}
          onClose={() => {
            setStatsOpen(false);
          }}
          title={t('startingStats')}
        >
          {stats && (
            <dl className="grid grid-cols-2 gap-1 text-sm">
              <StatRow label={t('strength')} value={stats.strength} />
              <StatRow label={t('dexterity')} value={stats.dexterity} />
              <StatRow label={t('attributes.vitality')} value={stats.vitality} />
              <StatRow label={t('energy')} value={stats.energy} />
              <StatRow label={t('common:life')} value={stats.life} accent="text-red-400" />
              <StatRow label={t('common:mana')} value={stats.mana} accent="text-blue-400" />
            </dl>
          )}
        </Modal>

        {startFailed && (
          <p role="alert" className="text-red-400">
            {t('common:error')}
          </p>
        )}
        <Button
          variant="primary"
          onClick={handleStart}
          disabled={!canStart}
          className="w-full shrink-0 text-lg min-h-[44px]"
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
