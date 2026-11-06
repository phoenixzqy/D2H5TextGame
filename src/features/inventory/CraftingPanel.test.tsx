import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useInventoryStore } from '@/stores/inventoryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useMercStore } from '@/stores/mercStore';
import { useMapStore } from '@/stores/mapStore';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { __resetPersistenceForTests } from '@/stores/persistence';
import { materialRecipes } from '@/data/loaders/material-recipes';
import { socketRunewords } from '@/data/loaders/socket-effects';
import { CraftingPanel } from './CraftingPanel';

const blade = { id: 'blade', baseId: 'items/base/wp1h-short-sword', rarity: 'normal' as const,
  level: 1, identified: true, equipped: false, socketCapacity: 2 };
const stores = [useInventoryStore, usePlayerStore, useMercStore, useMapStore, useCombatStore] as const;
const mount = () => render(<I18nextProvider i18n={i18n}><CraftingPanel /></I18nextProvider>);

describe.each(['en', 'zh-CN'] as const)('crafting controls %s', locale => {
  const en = locale === 'en';
  beforeEach(async () => {
    __resetPersistenceForTests();
    for (const store of stores) store.getState().reset();
    useHydrationStore.getState().setStatus('ready');
    usePlayerStore.getState().setPlayer(createMockPlayer('Smith', 'sorceress'));
    useInventoryStore.setState({ backpack: [blade], materials: { 'runes/el': 6 } });
    await i18n.changeLanguage(locale);
  });
  afterEach(() => { act(() => { for (const store of stores) store.getState().reset(); }); });

  function category(value: string) {
    fireEvent.change(screen.getByLabelText(en ? 'Action' : '操作'), { target: { value } });
  }
  function preview() { fireEvent.click(screen.getByRole('button', { name: en ? 'Preview action' : '预览操作' })); }
  const confirm = () => screen.getByRole('button', { name: en ? 'Confirm' : '确认' });

  it('translates every advertised recipe and shows an honest progression rule', () => {
    mount();
    for (const recipe of materialRecipes.values()) expect(i18n.exists(recipe.nameKey, { lng: locale, ns: 'inventory' }), recipe.id).toBe(true);
    expect(screen.getByText(en ? /highest unlocked act/ : /最高已解锁章节/)).toBeInTheDocument();
  });
  it('exposes all runeword recipes beside insertion with exact Leaf requirements and rune order', () => {
    mount();
    expect(screen.queryByTestId('runeword-guide')).not.toBeInTheDocument();
    category('socket-insert');
    const inventory = useInventoryStore.getState();
    const map = useMapStore.getState();
    const guide = screen.getByTestId('runeword-guide');
    fireEvent.click(within(guide).getByText(en ? 'Runeword recipes' : '符文之语配方'));
    const select = within(guide).getByLabelText(en ? 'Runeword' : '符文之语');
    const options = within(select).getAllByRole('option');
    expect(options).toHaveLength(35);
    expect(options.map(option => option.textContent)).toEqual(socketRunewords.map(word => i18n.t(word.name.replace('items.', 'items:'))));
    fireEvent.change(select, { target: { value: 'runewords/leaf' } });
    expect(within(guide).getByTestId('runeword-bases')).toHaveTextContent(en ? 'Staff' : '长杖');
    expect(guide).toHaveTextContent(en ? 'Normal (white) equipment with exactly 2 sockets.' : '需要恰好有 2 个孔的普通（白色）装备。');
    expect(guide).toHaveTextContent(en ? 'Equip level: 19' : '装备等级：19');
    const order = within(guide).getByRole('list', { name: en ? 'Insert runes in this order' : '按此顺序镶嵌符文' });
    expect(within(order).getAllByRole('listitem').map(item => item.textContent)).toEqual(en ? ['Tir', 'Ral'] : ['泰尔符文', '莱尔符文']);
    expect(useInventoryStore.getState()).toBe(inventory);
    expect(useMapStore.getState()).toBe(map);
    category('salvage');
    expect(screen.queryByTestId('runeword-guide')).not.toBeInTheDocument();
  });
  it('shows alternative runeword bases without applying weapon restrictions to armor', () => {
    mount(); category('socket-insert');
    const guide = screen.getByTestId('runeword-guide');
    fireEvent.click(within(guide).getByText(en ? 'Runeword recipes' : '符文之语配方'));
    const select = within(guide).getByLabelText(en ? 'Runeword' : '符文之语');
    for (const [word, expected] of [
      ['spirit', en ? ['Sword', 'Shield'] : ['剑', '盾牌']],
      ['fortitude', en ? ['Any weapon', 'Body armor'] : ['任意武器', '胸甲']],
      ['dream', en ? ['Helm', 'Shield'] : ['头盔', '盾牌']]
    ] as const) {
      fireEvent.change(select, { target: { value: `runewords/${word}` } });
      const bases = within(guide).getByTestId('runeword-bases');
      expect(within(bases).getAllByRole('listitem').map(item => item.textContent)).toEqual(expected);
    }
  });
  it('explains word bonuses and active payment before spending without including plain rune effects', () => {
    mount(); category('socket-insert');
    const inventory = useInventoryStore.getState();
    const player = usePlayerStore.getState();
    const guide = screen.getByTestId('runeword-guide');
    fireEvent.click(within(guide).getByText(en ? 'Runeword recipes' : '符文之语配方'));
    const select = within(guide).getByLabelText(en ? 'Runeword' : '符文之语');
    fireEvent.change(select, { target: { value: 'runewords/leaf' } });
    const effects = within(guide).getByRole('list', { name: en ? 'Runeword bonuses' : '符文之语加成' });
    expect(effects).toHaveTextContent(en ? '+33 Cold Resist' : '+33 冰冷抗性');
    expect(effects).toHaveTextContent(en
      ? 'While equipped: grants Fire Bolt (Rank 3), 8 Mana, 1s cooldown'
      : '装备时：获得火弹（3级），消耗8法力，冷却1秒');
    expect(effects).toHaveTextContent(en ? '+12% Fire Damage (self only)' : '自身火焰伤害 +12%');
    expect(effects).not.toHaveTextContent(en ? '+2 Mana' : '+2 法力');
    expect(guide).toHaveTextContent(en
      ? 'Base stats and ordinary rune effects also apply. Preview an insertion to see the full item.'
      : '底材属性与各符文的普通镶嵌效果也会生效。请预览镶嵌操作，查看完整装备效果。');
    expect(useInventoryStore.getState()).toBe(inventory);
    expect(usePlayerStore.getState()).toBe(player);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('updates conditional healing and ratio-valued bonuses without retaining the previous recipe effects', () => {
    mount(); category('socket-insert');
    const guide = screen.getByTestId('runeword-guide');
    fireEvent.click(within(guide).getByText(en ? 'Runeword recipes' : '符文之语配方'));
    const select = within(guide).getByLabelText(en ? 'Runeword' : '符文之语');
    fireEvent.change(select, { target: { value: 'runewords/phoenix' } });
    const effects = () => within(guide).getByRole('list', { name: en ? 'Runeword bonuses' : '符文之语加成' });
    expect(effects()).toHaveTextContent(en
      ? 'While equipped: grants Redemption (Rank 1), 0 Mana, 4s cooldown'
      : '装备时：获得救赎（1级），消耗0法力，冷却4秒');
    expect(effects()).toHaveTextContent(en ? 'Only usable while injured.' : '仅受伤时可用。');
    expect(effects()).toHaveTextContent(en ? '+10% to existing Mana Regeneration' : '自身已有法力回复速率 +10%');
    fireEvent.change(select, { target: { value: 'runewords/last-wish' } });
    expect(effects()).toHaveTextContent(en ? '+25% Crit Chance' : '+25% 暴击率');
    expect(effects()).toHaveTextContent(en ? '+2.5% Magic Dodge' : '魔法闪避 +2.5%');
    expect(effects()).not.toHaveTextContent(en ? 'Redemption' : '救赎');
    expect(effects()).not.toHaveTextContent('skill-fade');
  });
  it('totals repeated runes and tracks live ownership while preserving the insertion selection', () => {
    useInventoryStore.setState({ materials: { 'runes/el': 6, 'runes/jah': 1, 'runes/ber': 2 } });
    mount(); category('socket-insert');
    fireEvent.click(screen.getByLabelText(/#blade/));
    const guide = screen.getByTestId('runeword-guide');
    fireEvent.click(within(guide).getByText(en ? 'Runeword recipes' : '符文之语配方'));
    fireEvent.change(within(guide).getByLabelText(en ? 'Runeword' : '符文之语'), { target: { value: 'runewords/last-wish' } });
    const inventory = useInventoryStore.getState();
    const row = () => within(guide).getByRole('row', { name: en ? /^Jah / : /^迦符文 / });
    expect(within(row()).getAllByRole('cell').map(cell => cell.textContent)).toEqual(en ? ['Jah', '3', '1'] : ['迦符文', '3', '1']);
    act(() => { useInventoryStore.setState({ materials: { ...inventory.materials, 'runes/jah': 4 } }); });
    expect(within(row()).getAllByRole('cell').map(cell => cell.textContent)).toEqual(en ? ['Jah', '3', '4'] : ['迦符文', '3', '4']);
    expect(screen.getByLabelText(/#blade/)).toBeChecked();
    expect(screen.getByLabelText(en ? 'Socket material' : '镶嵌材料')).toHaveValue('runes/el');
    expect(useInventoryStore.getState().backpack).toBe(inventory.backpack);
    expect(useInventoryStore.getState().materialActionOrdinal).toBe(inventory.materialActionOrdinal);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('previews exact fusion costs/result, cancels without spending, then confirms only one intent', async () => {
    mount();
    fireEvent.change(screen.getByLabelText(en ? 'Recipe' : '配方'), { target: { value: 'recipes/rune-fusion/el' } });
    const trigger = screen.getByRole('button', { name: en ? 'Preview action' : '预览操作' });
    trigger.focus(); preview();
    let dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent(en ? 'Costs' : '消耗');
    expect(dialog).toHaveTextContent(en ? 'El × 3' : '艾尔符文 × 3');
    expect(dialog).toHaveTextContent(en ? 'Eld × 1' : '艾尔德符文 × 1');
    expect(useInventoryStore.getState().materials).toEqual({ 'runes/el': 6 });
    fireEvent.click(within(dialog).getByRole('button', { name: en ? 'Cancel' : '取消' }));
    await waitFor(() => { expect(trigger).toHaveFocus(); });
    expect(useInventoryStore.getState().materialActionOrdinal).toBe(0);
    preview(); dialog = screen.getByRole('dialog');
    fireEvent.click(confirm()); fireEvent.click(confirm());
    expect(useInventoryStore.getState().materials).toEqual({ 'runes/el': 3, 'runes/eld': 1 });
    expect(useInventoryStore.getState().materialActionOrdinal).toBe(1);
    expect(dialog).toHaveTextContent(en ? 'Completed' : '已完成');
  });
  it('keeps its prepared request after a transient combat refusal so retry cannot create a second action', () => {
    mount();
    fireEvent.change(screen.getByLabelText(en ? 'Recipe' : '配方'), { target: { value: 'recipes/rune-fusion/el' } });
    preview();
    act(() => { useCombatStore.setState({ inCombat: true }); });
    fireEvent.click(confirm());
    expect(screen.getByRole('dialog')).toHaveTextContent(en ? /Could not complete/ : /未能完成/);
    expect(useInventoryStore.getState().materials).toEqual({ 'runes/el': 6 });
    act(() => { useCombatStore.setState({ inCombat: false }); });
    fireEvent.click(confirm()); fireEvent.click(confirm());
    expect(useInventoryStore.getState().materialActionOrdinal).toBe(1);
    expect(useInventoryStore.getState().materials).toEqual({ 'runes/el': 3, 'runes/eld': 1 });
  });
  it('shows ordered insertion output before consuming its selected material', () => {
    mount(); category('socket-insert');
    fireEvent.click(screen.getByLabelText(/blade/));
    fireEvent.change(screen.getByLabelText(en ? 'Socket material' : '镶嵌材料'), { target: { value: 'runes/el' } });
    preview();
    expect(screen.getByRole('dialog')).toHaveTextContent(en ? 'El' : '艾尔符文');
    expect(screen.getByTestId('item-tooltip-socket-stats')).toHaveTextContent(en ? '+50 Attack' : '+50 攻击');
    expect(useInventoryStore.getState().backpack[0]?.socketContents).toBeUndefined();
    fireEvent.click(confirm());
    expect(useInventoryStore.getState().backpack[0]?.socketContents).toEqual([{ kind: 'rune', id: 'runes/el' }]);
    expect(useInventoryStore.getState().materials).toEqual({ 'runes/el': 5 });
  });
  it.each([
    { materialId: 'runes/um', baseId: 'items/base/wp1h-short-sword', labelEn: '+5% Crit Chance', labelZh: '+5% 暴击率' },
    { materialId: 'runes/eld', baseId: 'items/base/armor-quilted', labelEn: '+2% Physical Dodge', labelZh: '+2% 物理闪避' }
  ])('previews ratio-valued socket effects as percentages: $materialId', ({ materialId, baseId, labelEn, labelZh }) => {
    useInventoryStore.setState({ backpack: [{ ...blade, baseId }], materials: { [materialId]: 1 } });
    mount(); category('socket-insert'); fireEvent.click(screen.getByLabelText(/#blade/));
    fireEvent.change(screen.getByLabelText(en ? 'Socket material' : '镶嵌材料'), { target: { value: materialId } });
    preview();
    expect(screen.getByTestId('item-tooltip-socket-stats')).toHaveTextContent(en ? labelEn : labelZh);
    expect(useInventoryStore.getState().materials).toEqual({ [materialId]: 1 });
    expect(useInventoryStore.getState().materialActionOrdinal).toBe(0);
  });
  it('bulk salvages selected backpack/stash gear only after an explicit destruction warning', () => {
    useInventoryStore.setState({ stash: [{ ...blade, id: 'stash-blade', rarity: 'magic' }] });
    mount(); category('salvage');
    fireEvent.click(screen.getByLabelText(/#blade/)); fireEvent.click(screen.getByLabelText(/#stash-blade/)); preview();
    expect(screen.getByRole('dialog')).toHaveTextContent(en ? /permanently destroyed/ : /永久销毁/);
    expect(screen.getByRole('dialog')).toHaveTextContent(en ? 'Scrap × 3' : '废料 × 3');
    fireEvent.click(confirm());
    expect(useInventoryStore.getState().backpack).toEqual([]); expect(useInventoryStore.getState().stash).toEqual([]);
    expect(useInventoryStore.getState().materials['materials/scrap']).toBe(3);
  });
  it('previews exact v18 recovery refunds and preserves v16 inspect-only quarantine', () => {
    const old = { ...blade, id: 'old-lore', baseId: 'items/base/armor-quilted', rarity: 'runeword' as const,
      runewordId: 'runewords/lore', runes: ['runes/ort', 'runes/sol'] };
    useInventoryStore.setState({ socketQuarantine: [{ sourceVersion: 18, item: old, origin: { container: 'stash', index: 0 } }],
      legacyGearQuarantine: [{ item: { ...blade, id: 'old16' }, origin: { container: 'stash', index: 0 } }] });
    mount(); category('recover-v18');
    expect(screen.queryByLabelText(/old16/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/old-lore/)); preview();
    const sourceSummary = screen.getByRole('dialog').querySelector('summary');
    if (!sourceSummary) throw new Error('Missing recovery source summary');
    fireEvent.click(sourceSummary);
    expect(screen.getByRole('dialog')).not.toHaveTextContent(en ? 'could not be verified' : '无法验证');
    expect(screen.getByRole('dialog')).toHaveTextContent(en ? 'Preserved rune order' : '保留的符文顺序');
    expect(screen.getByRole('dialog')).toHaveTextContent(en ? 'Socket capacity: 2' : '镶嵌孔数：2');
    expect(screen.getByRole('dialog')).toHaveTextContent(en ? 'Ort × 1' : '欧特符文 × 1');
    expect(screen.getByRole('dialog')).toHaveTextContent(en ? 'Sol × 1' : '索尔符文 × 1');
    fireEvent.click(confirm());
    expect(useInventoryStore.getState().socketQuarantine).toEqual([]);
    expect(useInventoryStore.getState().legacyGearQuarantine).toHaveLength(1);
    expect(useInventoryStore.getState().backpack.find(item => item.id === 'old-lore')).toMatchObject({ rarity: 'normal', socketContents: [] });
  });
  it('fuses gems with an exact shard cost and dismantles a perfect gem into five shards', () => {
    useInventoryStore.setState({ materials: { 'gems/amethyst/chipped': 3, 'gems/ruby/perfect': 1 }, currencies: { 'gem-shard': 1 } });
    mount(); category('gem-fusion');
    fireEvent.change(screen.getByLabelText(en ? 'Recipe' : '配方'), { target: { value: 'recipes/gem-fusion/amethyst/chipped' } });
    preview();
    expect(screen.getByRole('dialog')).toHaveTextContent(en ? 'Gem-shards × 1' : '宝石碎片 × 1');
    fireEvent.click(confirm());
    expect(useInventoryStore.getState().materials).toEqual({ 'gems/amethyst/flawed': 1, 'gems/ruby/perfect': 1 });
    expect(useInventoryStore.getState().currencies['gem-shard']).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: en ? 'Close' : '关闭' }));
    category('gem-dismantle');
    fireEvent.change(screen.getByLabelText(en ? 'Recipe' : '配方'), { target: { value: 'recipes/gem-dismantle/ruby/perfect' } });
    preview();
    expect(screen.getByRole('dialog')).toHaveTextContent(en ? 'Gem-shards × 5' : '宝石碎片 × 5');
    fireEvent.click(confirm());
    expect(useInventoryStore.getState().materials).toEqual({ 'gems/amethyst/flawed': 1 });
    expect(useInventoryStore.getState().currencies['gem-shard']).toBe(5);
    expect(useInventoryStore.getState().materialActionOrdinal).toBe(2);
  });
  it('previews and commits one seeded armor socket result without changing its source payload', () => {
    const chest = { ...blade, id: 'chest', baseId: 'items/base/armor-quilted', socketCapacity: 0, baseRolls: { defense: 17 } };
    useInventoryStore.setState({ backpack: [chest], materials: { 'runes/hel': 1, 'runes/amn': 1, 'gems/topaz/perfect': 1 } });
    mount(); category('socket-armor'); fireEvent.click(screen.getByLabelText(/#chest/)); preview();
    expect(useInventoryStore.getState().backpack).toEqual([chest]);
    fireEvent.click(confirm()); fireEvent.click(confirm());
    const output = useInventoryStore.getState().backpack[0];
    expect(output?.socketCapacity).toBeGreaterThanOrEqual(1);
    expect(output?.socketCapacity).toBeLessThanOrEqual(4);
    expect(output).toEqual({ ...chest, socketCapacity: output?.socketCapacity });
    expect(screen.getByRole('dialog')).toHaveTextContent(en ? `Socket capacity: ${String(output?.socketCapacity)}` : `镶嵌孔数：${String(output?.socketCapacity)}`);
    expect(useInventoryStore.getState().materials).toEqual({});
    expect(useInventoryStore.getState().materialActionOrdinal).toBe(1);
  });
  it('clears a completed word with an explicit destruction warning and never refunds its inserts', () => {
    const steel = { ...blade, rarity: 'runeword' as const, runewordId: 'runewords/steel',
      socketContents: [{ kind: 'rune' as const, id: 'runes/tir' }, { kind: 'rune' as const, id: 'runes/el' }] };
    useInventoryStore.setState({ backpack: [steel], materials: { 'runes/hel': 1, 'gems/skull/flawed': 1 }, currencies: { 'rune-shard': 100 } });
    mount(); category('socket-clear'); fireEvent.click(screen.getByLabelText(/#blade/)); preview();
    expect(screen.getByRole('dialog')).toHaveTextContent(en ? /No inserts are refunded/ : /不返还镶嵌材料/);
    fireEvent.click(confirm());
    expect(useInventoryStore.getState().backpack).toEqual([{ ...blade, socketContents: [] }]);
    expect(useInventoryStore.getState().materials).toEqual({});
    expect(useInventoryStore.getState().currencies['rune-shard']).toBe(0);
  });
  it('previews the exact caster amulet affixes then consumes each recipe cost once', () => {
    const amulet = { ...blade, id: 'amulet', baseId: 'items/base/amu-tin', rarity: 'magic' as const, socketCapacity: 0, ilvl: 30 };
    useInventoryStore.setState({ backpack: [amulet], materials: { 'runes/ral': 1, 'gems/amethyst/perfect': 1, 'materials/scrap': 20 }, currencies: { 'rune-shard': 1000 } });
    mount(); category('caster-amulet'); fireEvent.click(screen.getByLabelText(/#amulet/)); preview();
    const before = screen.getByRole('dialog').textContent;
    fireEvent.click(confirm());
    const output = useInventoryStore.getState().backpack[0];
    expect(output).toMatchObject({ id: 'amulet', baseId: amulet.baseId, rarity: 'rare', ilvl: 30 });
    expect(output?.affixes).toHaveLength(3);
    expect(before).toContain(en ? 'Mana' : '法力');
    expect(before).toContain(en ? '+5 Energy' : '+5 精神');
    expect(before).toContain(en ? '+20 Mana' : '+20 法力');
    expect(useInventoryStore.getState().materials).toEqual({});
    expect(useInventoryStore.getState().currencies['rune-shard']).toBe(0);
  });
  it('refuses locked outputs with localized feedback and no spending or ordinal change', () => {
    useInventoryStore.setState({ materials: { 'runes/ral': 3 } });
    const before = useInventoryStore.getState();
    mount(); fireEvent.change(screen.getByLabelText(en ? 'Recipe' : '配方'), { target: { value: 'recipes/rune-fusion/ral' } });
    expect(screen.getByRole('button', { name: en ? 'Preview action' : '预览操作' })).toBeDisabled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(en ? 'not unlocked' : '尚未解锁');
    expect(useInventoryStore.getState()).toBe(before);
  });
  it('retains bulk choices across pages and search and limits target rendering', () => {
    useInventoryStore.setState({ backpack: Array.from({ length: 25 }, (_, index) => ({ ...blade, id: `item-${String(index)}` })) });
    mount(); category('salvage');
    expect(screen.getAllByRole('checkbox')).toHaveLength(12);
    fireEvent.click(screen.getByLabelText(/#item-0\b/));
    fireEvent.click(screen.getByRole('button', { name: en ? 'Next' : '下一页' }));
    fireEvent.click(screen.getByLabelText(/#item-12\b/));
    fireEvent.change(screen.getByLabelText(en ? 'Search equipment' : '搜索装备'), { target: { value: '#item-24' } });
    fireEvent.click(screen.getByLabelText(/#item-24\b/));
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
    preview(); fireEvent.click(confirm());
    expect(useInventoryStore.getState().materials['materials/scrap']).toBe(3);
    expect(useInventoryStore.getState().backpack).toHaveLength(22);
    expect(useInventoryStore.getState().backpack.some(item => ['item-0', 'item-12', 'item-24'].includes(item.id))).toBe(false);
  });
  it('starts on Cancel and restores the trigger on Escape without spending', async () => {
    mount(); const trigger = screen.getByRole('button', { name: en ? 'Preview action' : '预览操作' });
    trigger.focus(); preview();
    const cancel = screen.getByRole('button', { name: en ? 'Cancel' : '取消' });
    await waitFor(() => { expect(cancel).toHaveFocus(); });
    // Native Tab/Shift+Tab traversal is verified in Chromium; jsdom has no Tab default action.
    fireEvent.keyDown(cancel, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => { expect(trigger).toHaveFocus(); });
    expect(useInventoryStore.getState().materialActionOrdinal).toBe(0);
  });
  it('previews a completed word with plain inserts and the word package before any spend', () => {
    useInventoryStore.setState({ backpack: [{ ...blade, socketContents: [{ kind: 'rune', id: 'runes/tir' }] }] });
    mount(); category('socket-insert'); fireEvent.click(screen.getByLabelText(/#blade/)); preview();
    expect(screen.getByRole('dialog')).toHaveTextContent(en ? 'Runeword: Steel' : '符文之语：钢铁');
    const effects = within(screen.getByTestId('crafting-output-item')).getByTestId('item-tooltip-socket-stats');
    expect(effects).toHaveTextContent(en ? '+50 Attack' : '+50 攻击');
    expect(effects).toHaveTextContent(en ? '+25 Attack Speed' : '+25 攻击速度');
    expect(useInventoryStore.getState().materialActionOrdinal).toBe(0);
  });
  it('disables this confirmation and every later crafting intent after rollback cannot be verified', () => {
    mount(); preview();
    let damaged = false;
    const unsubscribe = useInventoryStore.subscribe(state => {
      if (state.materialActionOrdinal === 1 && !damaged) { damaged = true; useInventoryStore.setState({ materials: {} }); throw new Error('publish observer failed'); }
      throw new Error('restore observer failed');
    });
    try { fireEvent.click(confirm()); } finally { unsubscribe(); }
    expect(confirm()).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent(en ? 'Restoration could not be verified' : '无法验证恢复结果');
    fireEvent.click(screen.getByRole('button', { name: en ? 'Cancel' : '取消' }));
    expect(screen.getByRole('button', { name: en ? 'Preview action' : '预览操作' })).toBeDisabled();
  });
});
