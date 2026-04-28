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
import { Button, Panel, GameImage, getClassPortraitUrl } from '@/ui';
import { usePlayerStore } from '@/stores';
import {
  CHARACTER_CLASSES,
  type CharacterClass,
  createMockPlayer,
  getStartingStatPreview,
} from './createMockPlayer';

export function CharacterCreate() {
  const { t } = useTranslation(['character', 'common']);
  const navigate = useNavigate();
  const setPlayer = usePlayerStore((s) => s.setPlayer);

  const [selectedClass, setSelectedClass] = useState<CharacterClass | null>(null);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');

  const stats = useMemo(
    () => (selectedClass ? getStartingStatPreview(selectedClass) : null),
    [selectedClass],
  );

  const trimmedName = name.trim();
  const canStart = !!selectedClass && trimmedName.length >= 1 && trimmedName.length <= 16;

  const handleStart = () => {
    if (!canStart) return;
    const player = createMockPlayer(trimmedName, selectedClass as NonNullable<typeof selectedClass>);
    setPlayer(player);
    navigate('/town');
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
            aria-label={t('common:back', { defaultValue: 'Back' })}
          >
            ← {t('common:back', { defaultValue: '返回' })}
          </button>
          <h1 className="text-2xl font-serif text-d2-gold">{t('createCharacter')}</h1>
          <div className="w-12" aria-hidden />
        </header>

        <Panel title={t('selectClass')}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CHARACTER_CLASSES.map((cls) => {
              const selected = selectedClass === cls;
              return (
                <button
                  key={cls}
                  type="button"
                  onClick={() => { setSelectedClass(cls); }}
                  aria-pressed={selected}
                  className={[
                    'min-h-[64px] px-3 py-2 rounded border text-base font-serif',
                    'flex flex-col items-center gap-1',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-d2-gold transition-colors',
                    selected
                      ? 'border-d2-gold bg-d2-gold/10 text-d2-gold shadow-[0_0_8px_rgba(218,165,32,0.35)]'
                      : 'border-d2-border bg-d2-panel text-d2-white hover:border-d2-gold/60',
                  ].join(' ')}
                  data-testid={`class-${cls}`}
                >
                  <GameImage
                    src={getClassPortraitUrl(cls)}
                    alt={t(`classes.${cls}`)}
                    fallbackIcon={cls.charAt(0).toUpperCase()}
                    size="lg"
                    className={selected ? 'border-d2-gold' : ''}
                  />
                  <span className="truncate max-w-full">{t(`classes.${cls}`)}</span>
                </button>
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

        <Panel title={t('gender', { defaultValue: '性别' })}>
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
          <Panel title={t('startingStats', { defaultValue: '起始属性' })}>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <StatRow label={t('strength', { defaultValue: '力量' })} value={stats.strength} />
              <StatRow label={t('dexterity', { defaultValue: '敏捷' })} value={stats.dexterity} />
              <StatRow label={t('vitality', { defaultValue: '体力' })} value={stats.vitality} />
              <StatRow label={t('energy', { defaultValue: '能量' })} value={stats.energy} />
              <StatRow label={t('common:life', { defaultValue: '生命' })} value={stats.life} accent="text-red-400" />
              <StatRow label={t('common:mana', { defaultValue: '法力' })} value={stats.mana} accent="text-blue-400" />
            </dl>
          </Panel>
        )}

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
