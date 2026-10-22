import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Mercenary } from '@/engine/types/entities';
import { useMercStore } from '@/stores/mercStore';
import { useCombatStore } from '@/stores/combatStore';
import { getMercSkillOrder } from '@/stores/mercToCombatUnit';
import { Button } from '@/ui';

/** Ordinary controls for choosing an owned mercenary's secondary skill priority. */
export function MercSkillPriority({ merc }: { merc: Mercenary }) {
  const { t } = useTranslation('mercs');
  const setSkillOrder = useMercStore(state => state.setSkillOrder);
  const locked = useCombatStore(state => state.inCombat ||
    (state.subAreaRunId !== null && !state.runVictory && !state.runDefeat));
  const [refused, setRefused] = useState(false);
  const order = getMercSkillOrder(merc);
  const firstSecondary = merc.signatureSkillId ? 1 : 0;
  const move = (index: number, direction: -1 | 1) => {
    const next = [...order];
    const a = next[index];
    const b = next[index + direction];
    if (!a || !b) return;
    next[index] = b;
    next[index + direction] = a;
    setRefused(!setSkillOrder(merc.id, next));
  };
  return (
    <section className="mt-3 border-t border-d2-border pt-3" aria-label={t('priority.title')}>
      <h4 className="font-serif text-d2-gold">{t('priority.title')}</h4>
      <p className="mt-1 text-sm text-d2-white/75">{t('priority.help')}</p>
      <ol className="mt-2 space-y-2" aria-live="polite">
        {order.map((id, index) => {
          const name = t(`skillName.${id}`, { defaultValue: t('priority.unknown', {
            skill: id.replace(/^mskill-/, '').replace(/[-_/.]+/g, ' ')
          }) });
          const signature = index < firstSecondary;
          return (
            <li key={id} className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="min-w-0 flex-1 break-words text-sm">{index + 1}. {name}</span>
              {signature ? <span className="text-sm text-d2-gold">{t('signature')}</span> : (
                <div className="flex gap-1">
                  <Button variant="secondary" className="min-h-[44px] min-w-[44px] px-2"
                    aria-label={t('priority.earlier', { skill: name })}
                    disabled={locked || index <= firstSecondary} onClick={() => { move(index, -1); }}>
                    {t('priority.up')}
                  </Button>
                  <Button variant="secondary" className="min-h-[44px] min-w-[44px] px-2"
                    aria-label={t('priority.later', { skill: name })}
                    disabled={locked || index === order.length - 1} onClick={() => { move(index, 1); }}>
                    {t('priority.down')}
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {locked && <p className="mt-2 text-sm text-d2-gold">{t('priority.locked')}</p>}
      {refused && <p role="alert" className="mt-2 text-sm text-red-300">{t('priority.refused')}</p>}
    </section>
  );
}
