import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Mercenary } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import { useMercStore } from '@/stores/mercStore';
import { useCombatStore } from '@/stores/combatStore';
import { getMercActiveProjection } from '@/stores/mercToCombatUnit';
import { getSkillsForClass } from '@/stores/skillsHelpers';
import { canonicalSkillIdFromData } from '@/engine/skills/dataCatalog';
import { computeSkillDisplayModel } from '@/engine/skills/displayStats';
import mercenarySkills from '@/data/skills/mercenary.json';
import itemSkills from '@/data/skills/item.json';
import { Button, tDataKey } from '@/ui';
import { PagedList } from '@/ui/PagedList';

const sorceressSkills = getSkillsForClass('sorceress');

/** Ordinary controls for choosing an owned mercenary's secondary skill priority. */
export function MercSkillPriority({ merc, equipment }: {
  merc: Mercenary; equipment: Readonly<Record<string, Item | null>>
}) {
  const { t } = useTranslation('mercs');
  const setSkillOrder = useMercStore(state => state.setSkillOrder);
  const mercBaseId = merc.id.split('#')[0] ?? merc.id;
  const stars = useMercStore(state => state.recruitmentProgress[mercBaseId]?.stars ?? 0);
  const locked = useCombatStore(state => state.inCombat ||
    (state.subAreaRunId !== null && !state.runVictory && !state.runDefeat));
  const [refused, setRefused] = useState(false);
  const projection = getMercActiveProjection(merc, equipment);
  const order = projection.configuredOrder;
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
    <section className="flex min-h-0 flex-1 flex-col gap-2" aria-label={t('priority.title')}>
      <h4 className="d2-section-title font-serif text-d2-gold">{t('priority.title')}</h4>
      <p className="mt-1 text-sm text-d2-white/75">{t('priority.help')}</p>
      <PagedList items={order} listClassName="space-y-2" renderItem={(id, index) => {
          const governed = projection.choices.find(choice => choice.id === id);
          const name = governed ? tDataKey(t, governed.nameKey) : t(`skillName.${id}`, { defaultValue: t('priority.unknown', {
            skill: id.replace(/^mskill-/, '').replace(/[-_/.]+/g, ' ')
          }) });
          const signature = index < firstSecondary;
          const nativeSkill = mercenarySkills.find(skill => skill.id === id);
          const itemSkill = id === 'item.redemption' ? itemSkills.find(skill => skill.id === 'item-redemption') : undefined;
          const spell = governed && id !== 'item.redemption'
            ? sorceressSkills.find(skill => canonicalSkillIdFromData(skill.id) === id) : undefined;
          const spellStats = spell ? computeSkillDisplayModel(spell, Math.max(1, governed?.effectiveRank ?? 0)).current : undefined;
          const damage = spellStats?.damage[0];
          const description = nativeSkill?.description ? tDataKey(t, nativeSkill.description)
            : itemSkill?.description ? tDataKey(t, itemSkill.description)
            : spell?.description && spellStats ? t(spell.description.replace(/^skills\./, 'skills:'), {
              min: damage?.min, max: damage?.max, mana: spellStats.manaCost, cooldown: spellStats.cooldown,
              maxTargets: spellStats.maxTargets,
              duration: spellStats.periodicSpell?.durationSeconds ?? (spellStats.control
                ? t('skills:details.seconds', { seconds: spellStats.control.durationSeconds }) : undefined),
              interval: spellStats.periodicSpell?.intervalSeconds, pulses: spellStats.periodicSpell?.pulses
            }) : undefined;
          return (
            <li key={id} className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="min-w-0 flex-1 break-words text-sm">{index + 1}. {governed && !governed.available
                ? t('skills:equipmentUnavailable', { skill: name }) : name}</span>
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
              {description && <p className="w-full break-words text-sm text-d2-white/75">
                {governed && governed.effectiveRank === 0 && spell && <span>{t('priority.rankPreview')} </span>}
                {description}
                {signature && nativeSkill && stars > 0 && <span> {t('priority.signatureBaseValues')}</span>}
              </p>}
            </li>
          );
        }} />
      {locked && <p className="mt-2 text-sm text-d2-gold">{t('priority.locked')}</p>}
      {refused && <p role="alert" className="mt-2 text-sm text-red-300">{t('priority.refused')}</p>}
    </section>
  );
}
