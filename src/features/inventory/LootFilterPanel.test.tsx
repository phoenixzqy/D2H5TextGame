import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { DEFAULT_LOOT_FILTER, LOOT_FILTER_RARITIES } from '@/engine/loot/filter';
import { useMetaStore } from '@/stores/metaStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { LootFilterPanel } from './LootFilterPanel';

const mount = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <LootFilterPanel />
    </I18nextProvider>
  );

describe.each(['en', 'zh-CN'] as const)('loot filter preferences (%s)', (locale) => {
  const english = locale === 'en';
  const cutoff = () =>
    screen.getByRole('textbox', {
      name: english ? 'Maximum item level' : '物品等级上限'
    });

  beforeEach(async () => {
    useMetaStore.getState().reset();
    await i18n.changeLanguage(locale);
  });
  afterEach(() => {
    act(() => {
      useMetaStore.getState().reset();
    });
  });

  it('defaults to disabled and keeps every rarity without editing settings on open', () => {
    const before = useMetaStore.getState().settings;
    mount();
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    expect(cutoff()).toHaveValue('0');
    for (const rarity of LOOT_FILTER_RARITIES) {
      expect(screen.getByTestId(`loot-filter-${rarity}`)).toHaveValue('keep');
      const options = screen.getByTestId(`loot-filter-${rarity}`).querySelectorAll('option');
      expect([...options].map((option) => option.textContent)).toEqual(
        english ? ['Keep', 'Auto-salvage', 'Auto-discard'] : ['保留', '自动分解', '自动丢弃']
      );
    }
    expect(screen.getByRole('region')).toHaveTextContent(
      english ? 'new combat loot only' : '仅处理新获得的战斗掉落'
    );
    expect(screen.getByRole('region')).toHaveTextContent(english ? 'crafting scrap' : '制作废料');
    expect(screen.getByRole('region')).toHaveTextContent(
      english ? 'personalized gear' : '个性化装备'
    );
    expect(screen.getByRole('region').textContent).not.toMatch(/lootFilter\.|undefined/);
    expect(useMetaStore.getState().settings).toBe(before);
  });

  it('immediately stores rarity edits and enabling, then preserves the rules when disabled', () => {
    const inventoryBefore = useInventoryStore.getState();
    mount();
    fireEvent.change(screen.getByTestId('loot-filter-normal'), { target: { value: 'salvage' } });
    fireEvent.change(screen.getByTestId('loot-filter-magic'), { target: { value: 'discard' } });
    fireEvent.change(screen.getByTestId('loot-filter-unique'), { target: { value: 'salvage' } });
    fireEvent.change(screen.getByTestId('loot-filter-set'), { target: { value: 'discard' } });
    const rules = {
      ...DEFAULT_LOOT_FILTER.actions,
      normal: 'salvage',
      magic: 'discard',
      unique: 'salvage',
      set: 'discard'
    };
    expect(useMetaStore.getState().settings.lootFilter).toEqual({
      ...DEFAULT_LOOT_FILTER,
      actions: rules
    });
    fireEvent.click(screen.getByRole('switch'));
    expect(useMetaStore.getState().settings.lootFilter).toEqual({
      ...DEFAULT_LOOT_FILTER,
      actions: rules,
      enabled: true
    });
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByRole('switch'));
    expect(useMetaStore.getState().settings.lootFilter).toEqual({
      ...DEFAULT_LOOT_FILTER,
      actions: rules
    });
    expect(useInventoryStore.getState()).toBe(inventoryBefore);
  });

  it('publishes valid inclusive level limits and zero for all levels', () => {
    mount();
    fireEvent.change(cutoff(), { target: { value: '20' } });
    expect(useMetaStore.getState().settings.lootFilter?.maxItemLevel).toBe(20);
    fireEvent.change(cutoff(), { target: { value: String(Number.MAX_SAFE_INTEGER) } });
    expect(useMetaStore.getState().settings.lootFilter?.maxItemLevel).toBe(Number.MAX_SAFE_INTEGER);
    fireEvent.change(cutoff(), { target: { value: '0' } });
    expect(useMetaStore.getState().settings.lootFilter?.maxItemLevel).toBe(0);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it.each(['', '-1', '2.5', 'abc', 'Infinity', '9007199254740992'])(
    'retains invalid draft %j without publishing it',
    (invalid) => {
      useMetaStore
        .getState()
        .updateSettings({ lootFilter: { ...DEFAULT_LOOT_FILTER, maxItemLevel: 12 } });
      mount();
      fireEvent.change(cutoff(), { target: { value: invalid } });
      expect(cutoff()).toHaveValue(invalid);
      expect(cutoff()).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByRole('alert')).toHaveTextContent(
        english ? 'Enter a whole number' : '请输入'
      );
      expect(useMetaStore.getState().settings.lootFilter?.maxItemLevel).toBe(12);
      fireEvent.click(screen.getByRole('switch'));
      expect(cutoff()).toHaveValue(invalid);
      expect(useMetaStore.getState().settings.lootFilter?.maxItemLevel).toBe(12);
      fireEvent.change(cutoff(), { target: { value: '8' } });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(useMetaStore.getState().settings.lootFilter?.maxItemLevel).toBe(8);
    }
  );

  it('refreshes an open panel after settings are restored and retains other preferences', () => {
    mount();
    act(() => {
      useMetaStore.getState().updateSettings({
        stealthMode: true,
        lootFilter: {
          ...DEFAULT_LOOT_FILTER,
          enabled: true,
          maxItemLevel: 7,
          actions: { ...DEFAULT_LOOT_FILTER.actions, rare: 'discard' }
        }
      });
    });
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    expect(cutoff()).toHaveValue('7');
    expect(screen.getByTestId('loot-filter-rare')).toHaveValue('discard');
    fireEvent.change(screen.getByTestId('loot-filter-normal'), { target: { value: 'salvage' } });
    expect(useMetaStore.getState().settings.stealthMode).toBe(true);
    expect(useMetaStore.getState().settings.lootFilter?.actions.rare).toBe('discard');
    expect(useMetaStore.getState().settings.lootFilter?.maxItemLevel).toBe(7);
  });
});
