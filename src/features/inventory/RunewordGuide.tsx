import { useId, useState } from 'react';
import { Button, Modal, Tabs } from '@/ui';
import { PagedList } from '@/ui/PagedList';
import { useTranslation } from 'react-i18next';
import { socketRunewords } from '@/data/loaders/socket-effects';
import { resolveStatPackage } from '@/engine/items/statRolls';
import { useInventoryStore } from '@/stores/inventoryStore';
import { tDataKey } from '@/ui/i18nKey';
import { formatDisplayStat, formatRunewordGrantLines } from '@/ui/itemDisplay';
import { craftingBalanceName } from './craftingPresentation';

/** Read-only recipe reference using the same catalog as live socket matching. */
export function RunewordGuide() {
  const { t } = useTranslation(['inventory', 'items']);
  const id = useId();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(socketRunewords[0]?.id ?? '');
  const materials = useInventoryStore(state => state.materials);
  const word = socketRunewords.find(entry => entry.id === selectedId);
  if (!word) return null;

  const bases: string[] = [];
  if (word.allowedBases.includes('weapon')) {
    bases.push(word.allowedWeaponTypes?.length
      ? word.allowedWeaponTypes.map(type => t(`crafting.runewordGuide.weaponType.${type}`)).join(t('crafting.runewordGuide.or'))
      : t('crafting.runewordGuide.anyWeapon'));
  }
  if (word.allowedBases.includes('armor')) {
    bases.push(...word.allowedSlots.filter(slot => slot !== 'weapon').map(slot => t(`crafting.runewordGuide.armorSlot.${slot}`)));
  }
  const runeCounts = new Map<string, number>();
  for (const rune of word.runes) runeCounts.set(rune, (runeCounts.get(rune) ?? 0) + 1);
  const bonuses = [
    ...resolveStatPackage(word.stats).map(stat => formatDisplayStat(stat, t)),
    ...formatRunewordGrantLines(word.grants ?? [], t)
  ];

  return <>
    <Button variant="secondary" onClick={() => { setOpen(true); }}>{t('crafting.runewordGuide.title')}</Button>
    <Modal isOpen={open} onClose={() => { setOpen(false); }} title={t('crafting.runewordGuide.title')}>
    <div className="flex min-h-0 flex-1 flex-col gap-2 text-sm" data-testid="runeword-guide">
      <label htmlFor={id} className="block">{t('crafting.runewordGuide.select')}</label>
      <select id={id} value={selectedId} onChange={event => { setSelectedId(event.target.value); }}
        className="d2-field min-h-[44px] w-full min-w-0 max-w-full rounded border border-d2-border bg-d2-bg px-3 text-base text-d2-white focus-visible:ring-2 focus-visible:ring-d2-gold">
        {socketRunewords.map(entry => <option key={entry.id} value={entry.id}>{tDataKey(t, entry.name)}</option>)}
      </select>
      <Tabs tabs={[
        { id: 'bases', label: t('crafting.runewordGuide.bases'), content: <div className="space-y-2">
      <p>{t('crafting.runewordGuide.sockets', { count: word.sockets })}</p>
      <div>
        <p className="font-bold text-d2-gold">{t('crafting.runewordGuide.bases')}</p>
        <ul className="list-inside list-disc break-words" data-testid="runeword-bases">
          {bases.map(base => <li key={base}>{base}</li>)}
        </ul>
      </div>
      <p>{t('crafting.runewordGuide.level', { level: word.reqLevel })}</p>
      </div> },
      { id: 'bonuses', label: t('crafting.runewordGuide.bonuses'), content: <div className="flex min-h-0 flex-1 flex-col gap-2">
        <p id={`${id}-bonuses`} className="font-bold text-d2-gold">{t('crafting.runewordGuide.bonuses')}</p>
        <PagedList items={bonuses} renderItem={line => <li key={line.key}>{line.text}</li>} />
        <p className="mt-1 text-d2-white/90">{t('crafting.runewordGuide.bonusNote')}</p>
      </div> },
      { id: 'ingredients', label: t('crafting.runewordGuide.ingredients'), content: <div className="space-y-2">
      <div>
        <p className="font-bold text-d2-gold">{t('crafting.runewordGuide.order')}</p>
        <ol aria-label={t('crafting.runewordGuide.order')} className="list-inside list-decimal break-words">
          {word.runes.map((rune, index) => <li key={index}>{craftingBalanceName(t, rune)}</li>)}
        </ol>
      </div>
      <table className="w-full table-fixed text-left">
        <caption className="mb-1 text-left font-bold text-d2-gold">{t('crafting.runewordGuide.ingredients')}</caption>
        <thead><tr>
          <th scope="col" className="w-2/5 break-words py-1 pr-2">{t('crafting.runewordGuide.rune')}</th>
          <th scope="col" className="break-words py-1 pr-2">{t('crafting.runewordGuide.needed')}</th>
          <th scope="col" className="break-words py-1">{t('crafting.runewordGuide.owned')}</th>
        </tr></thead>
        <tbody>{[...runeCounts].map(([rune, count]) => <tr key={rune} className="border-t border-d2-border/60">
          <td className="break-words py-1 pr-2">{craftingBalanceName(t, rune)}</td>
          <td className="break-words py-1 pr-2">{count}</td>
          <td className="break-words py-1">{materials[rune] ?? 0}</td>
        </tr>)}</tbody>
      </table>
      </div> },
      { id: 'instructions', label: t('details'), content: <p className="text-d2-white/90">{t('crafting.runewordGuide.instructions')}</p> }
      ]} />
    </div>
    </Modal>
  </>;
}
