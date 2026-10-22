/** Controlled hero/item fixtures: component semantics, not earned/browser acceptance. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { flushSync } from 'react-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import type { Item } from '@/engine/types/items';
import type { Player } from '@/engine/types/entities';
import { deriveStats } from '@/engine/progression/stats';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { getSkillsForClass } from '@/stores/skillsHelpers';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMercStore } from '@/stores/mercStore';
import { useCombatStore } from '@/stores/combatStore';
import { useMapStore } from '@/stores/mapStore';
import { useMetaStore } from '@/stores/metaStore';
import { useFormationStore } from '@/stores/formationStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { useIronGolemSelectionStore } from '@/stores/ironGolemSelectionStore';
import {
  beginWaveTransition,
  endWaveTransition,
  reserveWaveRestore,
  releaseWaveRestore
} from '@/stores/waveTransitionGuard';
import { inspectRecordedWaves } from '@/stores/recordedWaveReceipt';
import {
  abortSubAreaRun,
  startSubAreaRun,
  recoverRecordedWavePublication,
  refreshActivePlayerCombatConfig
} from '@/stores/combatHelpers';
import { resetRegistry, loadDefaultSkills, registerSkill } from '@/engine/skills/registry';
import { IronGolemPanel } from './IronGolemPanel';

const IRON = 'necromancer.iron_golem',
  BLOOD = 'necromancer.blood_golem';
function item(id = 'chosen'): Item {
  return {
    id,
    baseId: 'items/base/wp1h-short-sword',
    rarity: 'normal',
    level: 1,
    identified: true,
    equipped: false
  };
}
function hero(fields: Partial<Player> = {}, mana = 35) {
  const coreStats = { strength: 15, dexterity: 25, vitality: 100, energy: 100 };
  const player: Player = {
    ...createMockPlayer('Panel fixture', 'necromancer'),
    id: 'panel-hero',
    level: 24,
    coreStats,
    derivedStats: { ...deriveStats(coreStats, 24), mana },
    skillLevels: { [IRON]: 6, [BLOOD]: 1 },
    comboOrder: [IRON],
    ...fields
  };
  usePlayerStore.getState().setPlayer(player);
  return player;
}
function mount(rank = 6) {
  const skill = getSkillsForClass('necromancer').find(
    (s) => s.id === 'skills-necromancer-iron-golem'
  );
  if (!skill) throw new Error('Missing authored Iron skill');
  return render(
    <I18nextProvider i18n={i18n}>
      <IronGolemPanel skill={skill} rank={rank} />
    </I18nextProvider>
  );
}
const text = (key: string) => i18n.t('skills:ironGolem.' + key);
const choose = (id = 'chosen') =>
  fireEvent.change(screen.getByRole('combobox', { name: text('choose') }), {
    target: { value: id }
  });
const acknowledge = () =>
  fireEvent.click(screen.getByRole('checkbox', { name: text('acknowledge') }));
const arm = () => fireEvent.click(screen.getByRole('button', { name: text('arm') }));
beforeEach(async () => {
  abortSubAreaRun();
  for (const store of [
    useCombatStore,
    usePlayerStore,
    useInventoryStore,
    useMercStore,
    useMapStore,
    useMetaStore,
    useFormationStore
  ])
    store.getState().reset();
  resetRegistry();
  loadDefaultSkills();
  useHydrationStore.getState().setStatus('ready');
  hero();
  useInventoryStore.setState({ backpack: [item(), item('second')] });
  await i18n.changeLanguage('en');
});
afterEach(() => {
  vi.restoreAllMocks();
  abortSubAreaRun();
  useHydrationStore.getState().setStatus('idle');
  resetRegistry();
  loadDefaultSkills();
});

describe('native explicit Iron Golem draft and instruction', () => {
  for (const locale of ['en', 'zh-CN']) {
    it(`starts empty with named controls, unchecked acknowledgement and permanent rules in ${locale}`, async () => {
      await i18n.changeLanguage(locale);
      const before = useInventoryStore.getState();
      mount();
      expect(screen.getByRole('combobox', { name: text('choose') })).toHaveValue('');
      expect(screen.getByRole('checkbox', { name: text('acknowledge') })).not.toBeChecked();
      expect(screen.getByRole('button', { name: text('arm') })).toBeDisabled();
      expect(screen.getByText(text('rules'))).toBeVisible();
      expect(screen.getByText(text('attemptTiming'))).toBeVisible();
      expect(screen.getByText(text('notArmed'))).toBeVisible();
      expect(screen.getByText(text('noAttempt'))).toBeVisible();
      expect(useIronGolemSelectionStore.getState().selection).toBeNull();
      expect(useInventoryStore.getState()).toBe(before);
    });
    it(`requires a fresh item acknowledgement and arms/clears without payment in ${locale}`, async () => {
      await i18n.changeLanguage(locale);
      mount();
      const before = useInventoryStore.getState();
      choose();
      expect(screen.getByRole('button', { name: text('arm') })).toBeDisabled();
      acknowledge();
      choose('second');
      expect(screen.getByRole('checkbox', { name: text('acknowledge') })).not.toBeChecked();
      acknowledge();
      arm();
      expect(useIronGolemSelectionStore.getState().selection).toEqual({
        heroId: 'panel-hero',
        itemId: 'second'
      });
      expect(screen.getByRole('status')).toHaveTextContent(text('armDone'));
      fireEvent.click(screen.getByRole('button', { name: text('clear') }));
      expect(useIronGolemSelectionStore.getState().selection).toBeNull();
      expect(screen.getByRole('status')).toHaveTextContent(text('clearDone'));
      expect(useInventoryStore.getState()).toBe(before);
      expect(usePlayerStore.getState().player?.derivedStats.mana).toBe(35);
    });
  }
  it('uses literal rank6/7 totals and distinguishes same-name backpack instances', () => {
    mount();
    const options = screen.getAllByRole('option');
    expect(options[1]).toHaveTextContent('1 · Normal · Short Sword');
    expect(options[2]).toHaveTextContent('2 · Normal · Short Sword');
    choose();
    const current = within(screen.getByTestId('iron-preview-current')),
      next = within(screen.getByTestId('iron-preview-next'));
    for (const value of ['340', '54', '63']) expect(current.getByText(value)).toBeVisible();
    for (const value of ['356', '56', '66']) expect(next.getByText(value)).toBeVisible();
    expect(screen.getByText(text('previewScope'))).toBeVisible();
  });
});

const start = () =>
  startSubAreaRun({ subAreaId: 'areas/act1-blood-moor', runSeed: 7, challengeOrdinal: 0 });
function enableRecording(mana = 35) {
  const finisher = 'fixture.iron-panel';
  registerSkill({
    id: finisher,
    archetype: 'fixture',
    target: 'all-enemies',
    cooldown: 1,
    manaCost: 0,
    minLevel: 1,
    effects: [{ kind: 'damage', damageType: 'physical', base: [100000, 100000] }]
  });
  hero({ comboOrder: [IRON, finisher] }, mana);
}
const flush = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

describe('live authority and accessible refusal', () => {
  it('resets the draft and acknowledgement on hero replacement', () => {
    mount();
    choose();
    acknowledge();
    act(() => {
      hero({ id: 'other-hero' });
    });
    expect(screen.getByRole('combobox', { name: text('choose') })).toHaveValue('');
    expect(screen.getByRole('checkbox', { name: text('acknowledge') })).not.toBeChecked();
    expect(useIronGolemSelectionStore.getState().selection).toBeNull();
  });
  it('requires a fresh acknowledgement after the exact same-ID item changes', () => {
    mount();
    choose();
    acknowledge();
    act(() => {
      useInventoryStore.setState({ backpack: [{ ...item(), baseRolls: { attack: 9 } }] });
    });
    expect(screen.getByRole('checkbox', { name: text('acknowledge') })).not.toBeChecked();
    expect(screen.getByRole('button', { name: text('arm') })).toBeDisabled();
    expect(within(screen.getByTestId('iron-preview-current')).getByText('55')).toBeVisible();
  });
  it('refuses stale acknowledgement after a same-ID replacement skips the mounted subscriber', () => {
    const stop = useInventoryStore.subscribe(() => {
      throw new Error('inventory notification interrupted');
    });
    try {
      mount();
      choose();
      acknowledge();
      const replacement = { ...item(), baseRolls: { attack: 99 } };
      act(() => {
        expect(() => {
          useInventoryStore.setState({ backpack: [replacement] });
        }).toThrow('inventory notification interrupted');
      });
      expect(useInventoryStore.getState().backpack[0]).toBe(replacement);
      expect(screen.getByRole('checkbox', { name: text('acknowledge') })).toBeChecked();
      expect(screen.getByRole('button', { name: text('arm') })).toBeEnabled();
      arm();
      expect(useIronGolemSelectionStore.getState().selection).toBeNull();
      expect(screen.getByRole('alert')).toHaveTextContent(text('refusal.acknowledgementRequired'));
      expect(screen.getByRole('checkbox', { name: text('acknowledge') })).not.toBeChecked();
      expect(screen.getByRole('button', { name: text('arm') })).toBeDisabled();
      expect(useInventoryStore.getState().backpack).toEqual([replacement]);
      expect(usePlayerStore.getState().player?.derivedStats.mana).toBe(35);
      acknowledge();
      arm();
      expect(useIronGolemSelectionStore.getState().selection?.itemId).toBe('chosen');
    } finally {
      stop();
    }
  });
  it.each(['transfer', 'equip', 'discard'] as const)(
    'shows a stale armed %s instruction without choosing another item',
    (action) => {
      mount();
      choose();
      acknowledge();
      arm();
      act(() => {
        const inventory = useInventoryStore.getState();
        if (action === 'transfer') expect(inventory.moveToStash('chosen').ok).toBe(true);
        else if (action === 'equip') expect(inventory.equipItem(item()).ok).toBe(true);
        else inventory.discardItem('chosen');
      });
      expect(screen.getByRole('status')).toHaveTextContent(
        i18n.t('skills:ironGolem.armedInvalid', { reason: text('refusal.notInBackpack') })
      );
      expect(screen.getByRole('combobox', { name: text('choose') })).toHaveValue('chosen');
      expect(screen.getByRole('button', { name: text('arm') })).toBeDisabled();
      expect(useIronGolemSelectionStore.getState().selection?.itemId).toBe('chosen');
    }
  );
  it('shows empty and malformed-item fallbacks without raw item or base IDs', () => {
    useInventoryStore.setState({ backpack: [] });
    mount();
    expect(screen.getByText(text('emptyBackpack'))).toBeVisible();
    act(() => {
      useInventoryStore.setState({
        backpack: [{ ...item('private-instance-id'), baseId: 'items/base/private-missing-base' }]
      });
    });
    expect(screen.getByRole('option', { name: /Unknown item/ })).toBeVisible();
    choose('private-instance-id');
    expect(screen.getByRole('alert')).toHaveTextContent(text('refusal.ineligibleBase'));
    expect(screen.getByTestId('iron-golem-panel')).not.toHaveTextContent(
      /private-instance-id|private-missing-base|items:base/
    );
  });
  it.each(['unidentified', 'duplicateItem'] as const)(
    'exposes %s refusal without payment',
    (reason) => {
      useInventoryStore.setState(
        reason === 'unidentified'
          ? { backpack: [{ ...item(), identified: false }] }
          : { stash: [item()] }
      );
      mount();
      choose();
      expect(screen.getByRole('alert')).toHaveTextContent(text('refusal.' + reason));
      expect(screen.getByRole('button', { name: text('arm') })).toBeDisabled();
      expect(useIronGolemSelectionStore.getState().selection).toBeNull();
    }
  );
  it('observes a synthetic identification update without claiming a native identify action', () => {
    useInventoryStore.setState({ backpack: [{ ...item(), identified: false }] });
    mount();
    choose();
    expect(screen.getByRole('alert')).toHaveTextContent(text('refusal.unidentified'));
    act(() => {
      useInventoryStore.setState({ backpack: [item()] });
    });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('checkbox', { name: text('acknowledge') })).not.toBeChecked();
  });
  it('reacts to shared skill configuration changes before enabling Arm', () => {
    hero({ comboOrder: [] });
    mount();
    choose();
    acknowledge();
    expect(screen.getByText(text('configurationUnavailable'))).toBeVisible();
    expect(screen.getByRole('button', { name: text('arm') })).toBeDisabled();
    act(() => {
      usePlayerStore.getState().setComboOrder([IRON]);
    });
    expect(screen.getByRole('button', { name: text('arm') })).toBeEnabled();
  });
  for (const locale of ['en', 'zh-CN'])
    for (const kind of ['wave', 'restore'] as const) {
      it(`announces ${kind} guard refusal in ${locale}`, async () => {
        await i18n.changeLanguage(locale);
        mount();
        choose();
        acknowledge();
        const wave = kind === 'wave' ? beginWaveTransition(true) : null,
          restore = kind === 'restore' ? reserveWaveRestore() : null;
        try {
          arm();
          expect(screen.getByRole('alert')).toHaveTextContent(
            text('refusal.' + (wave ? 'waveBusy' : 'restorePending'))
          );
          expect(useIronGolemSelectionStore.getState().selection).toBeNull();
        } finally {
          if (wave) endWaveTransition(wave);
          if (restore) releaseWaveRestore(restore);
        }
      });
    }
  it.each(['arm', 'clear'] as const)(
    'rereads an actual %s write after an earlier subscriber throws',
    (action) => {
      if (action === 'clear')
        useIronGolemSelectionStore.setState({
          selection: { heroId: 'panel-hero', itemId: 'chosen' }
        });
      const stop = useIronGolemSelectionStore.subscribe(() => {
        throw new Error('earlier subscriber');
      });
      try {
        mount();
        choose();
        acknowledge();
        if (action === 'arm') arm();
        else fireEvent.click(screen.getByRole('button', { name: text('clear') }));
        expect(screen.getByRole('alert')).toHaveTextContent(text('actionUnverified'));
        expect(useIronGolemSelectionStore.getState().selection?.itemId ?? null).toBe(
          action === 'arm' ? 'chosen' : null
        );
        expect(screen.getByRole('status')).toHaveTextContent(
          action === 'arm'
            ? i18n.t('skills:ironGolem.armed', { item: 'Short Sword' })
            : text('notArmed')
        );
      } finally {
        stop();
      }
    }
  );
});

describe('shared rank boundaries', () => {
  it.each([0, 20])('renders rank %i without inventing current/next stats', (rank) => {
    mount(rank);
    choose();
    expect(
      screen.getByText(
        i18n.t(rank === 0 ? 'skills:details.currentEmpty' : 'skills:details.maxLevel')
      )
    ).toBeVisible();
    expect(
      within(
        screen.getByTestId(rank === 0 ? 'iron-preview-next' : 'iron-preview-current')
      ).getByText(rank === 0 ? '260' : '564')
    ).toBeVisible();
  });
  it('preserves fractional isolated contributions in the shared preview', () => {
    useInventoryStore.setState({
      backpack: [
        {
          ...item(),
          rarity: 'rare',
          baseRolls: { attack: 0 },
          affixes: [
            {
              affixId: 'fixture',
              values: new Map([
                ['statMods.life', 12.5],
                ['statMods.attack', 3.25],
                ['statMods.defense', 4.5]
              ])
            }
          ]
        }
      ]
    });
    mount();
    choose();
    const current = within(screen.getByTestId('iron-preview-current'));
    for (const value of ['352.5', '49.25', '67.5']) expect(current.getByText(value)).toBeVisible();
  });
});

describe('mounted receipt outcomes stay separate from draft and armed instruction', () => {
  for (const locale of ['en', 'zh-CN'])
    it(`observes paid success and abort, and drops the old unpaid arm announcement in ${locale}`, async () => {
      await i18n.changeLanguage(locale);
      enableRecording();
      mount();
      choose();
      acknowledge();
      arm();
      act(() => {
        start();
      });
      await flush();
      expect(screen.getByRole('status')).toHaveTextContent(
        i18n.t('skills:ironGolem.summoned', {
          item: locale === 'en' ? 'Short Sword' : '短剑',
          mana: 35
        })
      );
      expect(screen.getByRole('status')).toHaveTextContent(text('locked'));
      expect(screen.queryByText(text('armDone'))).toBeNull();
      expect(useInventoryStore.getState().backpack.map((i) => i.id)).toEqual(['second']);
      act(() => {
        abortSubAreaRun();
      });
      await flush();
      expect(screen.getByRole('status')).toHaveTextContent(text('noAttempt'));
    });
  it('reports accepted poor preparation without inventing its cause or consuming an item', async () => {
    enableRecording(34);
    mount();
    choose();
    acknowledge();
    arm();
    act(() => {
      start();
    });
    await flush();
    expect(screen.getByRole('status')).toHaveTextContent(text('notPrepared'));
    expect(screen.getByRole('status')).toHaveTextContent(text('locked'));
    expect(useInventoryStore.getState().backpack).toHaveLength(2);
    expect(useIronGolemSelectionStore.getState().selection).toBeNull();
  });
  it('shows unverified during an actual debit notification after the item disappears', async () => {
    enableRecording();
    mount();
    choose();
    acknowledge();
    arm();
    const original = useInventoryStore.setState;
    vi.spyOn(useInventoryStore, 'setState').mockImplementationOnce((value) => {
      flushSync(() => {
        original(value);
      });
      expect(useInventoryStore.getState().backpack.map((i) => i.id)).toEqual(['second']);
      expect(screen.getByRole('status')).toHaveTextContent(text('unverified'));
      expect(screen.getByRole('status')).not.toHaveTextContent(/was sacrificed|not prepared/);
    });
    act(() => {
      start();
    });
    await flush();
    expect(screen.getByRole('status')).toHaveTextContent('was sacrificed');
  });
  it('keeps conflicting item absence unverified instead of reporting success or ordinary failure', async () => {
    enableRecording();
    mount();
    choose();
    acknowledge();
    arm();
    const original = useInventoryStore.setState;
    vi.spyOn(useInventoryStore, 'setState').mockImplementationOnce((value) => {
      original(value);
      original({ backpack: [...useInventoryStore.getState().backpack] });
    });
    act(() => {
      expect(start).toThrow();
    });
    await flush();
    expect(inspectRecordedWaves().pending?.phase).toBe('conflict');
    expect(screen.getByRole('status')).toHaveTextContent(text('unverified'));
    expect(screen.getByRole('status')).not.toHaveTextContent(/was sacrificed|not prepared/);
  });
  it.each([35, 34])(
    'observes pending publication then exact promotion with %i mana',
    async (mana) => {
      enableRecording(mana);
      mount();
      choose();
      acknowledge();
      arm();
      vi.spyOn(useCombatStore.getState(), 'publishStagedRecordedBattle').mockImplementationOnce(
        () => {
          throw new Error('publisher');
        }
      );
      act(() => {
        expect(start).toThrow('publisher');
      });
      await flush();
      const pending = inspectRecordedWaves().pending;
      if (!pending) throw new Error('Missing pending receipt');
      expect(screen.getByRole('status')).toHaveTextContent(
        mana === 35
          ? i18n.t('skills:ironGolem.pendingPaid', { item: 'Short Sword', mana: 35 })
          : text('pendingNoDebit')
      );
      act(() => {
        recoverRecordedWavePublication(pending.receipt);
      });
      await flush();
      expect(screen.getByRole('status')).toHaveTextContent(
        mana === 35 ? 'was sacrificed' : text('notPrepared')
      );
      expect(screen.getByRole('status')).not.toHaveTextContent(/still needs publication/);
    }
  );
  it('keeps pending replay progress plus lock wording with no second-payment claim', async () => {
    enableRecording();
    mount();
    choose();
    acknowledge();
    arm();
    act(() => {
      start();
    });
    await flush();
    act(() => {
      useCombatStore.getState().advanceEvent();
    });
    vi.spyOn(useCombatStore.getState(), 'publishStagedRecordedBattle').mockImplementationOnce(
      () => {
        throw new Error('replay publisher');
      }
    );
    act(() => {
      expect(() => {
        refreshActivePlayerCombatConfig({ replayCurrentWave: true });
      }).toThrow('replay publisher');
    });
    await flush();
    expect(screen.getByRole('status')).toHaveTextContent(text('pendingNoDebit'));
    expect(screen.getByRole('status')).toHaveTextContent(text('replay'));
    expect(screen.getByRole('status')).toHaveTextContent(text('locked'));
    expect(screen.getByRole('status')).not.toHaveTextContent(/was sacrificed/);
  });
  it('keeps a rearmed future item distinct from the older paid receipt', async () => {
    enableRecording();
    useInventoryStore.setState({
      backpack: [item(), { ...item('second'), baseId: 'items/base/armor-chain-mail' }]
    });
    mount();
    choose();
    acknowledge();
    arm();
    act(() => {
      start();
    });
    await flush();
    choose('second');
    acknowledge();
    arm();
    expect(screen.getByRole('status')).toHaveTextContent(
      i18n.t('skills:ironGolem.armed', { item: 'Chain Mail' })
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      i18n.t('skills:ironGolem.summoned', { item: 'Short Sword', mana: 35 })
    );
    expect(useInventoryStore.getState().backpack.map((i) => i.id)).toEqual(['second']);
  });
});

describe('published replay policies', () => {
  it.each([true, false])(
    'reports %s locked replay without paying the future instruction',
    async (locked) => {
      enableRecording();
      if (!locked) usePlayerStore.getState().setComboOrder(['fixture.iron-panel']);
      mount();
      if (locked) {
        choose();
        acknowledge();
        arm();
      }
      act(() => {
        start();
      });
      await flush();
      if (!locked)
        act(() => {
          usePlayerStore.getState().setComboOrder([IRON, 'fixture.iron-panel']);
        });
      choose('second');
      acknowledge();
      arm();
      const before = useInventoryStore.getState();
      const selection = useIronGolemSelectionStore.getState().selection;
      act(() => {
        refreshActivePlayerCombatConfig({ replayCurrentWave: true });
      });
      await flush();
      expect(screen.getByRole('status')).toHaveTextContent(text('replay'));
      expect(screen.getByRole('status')).toHaveTextContent(text(locked ? 'locked' : 'unlocked'));
      expect(useInventoryStore.getState()).toBe(before);
      expect(useIronGolemSelectionStore.getState().selection).toBe(selection);
    }
  );
});

describe('current Golem Mastery and isolated selected-item previews', () => {
  function fractionalItem() {
    useInventoryStore.setState({
      backpack: [
        {
          ...item(),
          rarity: 'rare',
          baseRolls: { attack: 0 },
          affixes: [
            {
              affixId: 'fixture',
              values: new Map([
                ['statMods.life', 12.5],
                ['statMods.attack', 3.25],
                ['statMods.defense', 4.5]
              ])
            }
          ]
        }
      ]
    });
  }
  function values(id: string, expected: readonly number[]) {
    const panel = screen.getByTestId(id),
      labels = ['lifeMax', 'attack', 'defense', 'attackSpeed'];
    labels.forEach((label, index) => {
      const value = within(panel).getByText(i18n.t('skills:details.summonStat.' + label), {
        selector: 'dt'
      }).nextElementSibling;
      expect(value?.textContent).toBe(String(expected[index]));
    });
  }
  for (const locale of ['en', 'zh-CN']) {
    it.each([
      [1, 373.65, 390.61, 61],
      [20, 775.5, 810.7, 80]
    ])(
      `includes Mastery%s after fractional rank6/7 and item stats in ${locale}`,
      async (mastery, life, nextLife, speed) => {
        await i18n.changeLanguage(locale);
        hero({
          skillLevels: {
            [IRON]: 6,
            [BLOOD]: 1,
            'necromancer.clay_golem': 1,
            'necromancer.golem_mastery': mastery
          }
        });
        fractionalItem();
        const before = useInventoryStore.getState(),
          resources = usePlayerStore.getState().player?.derivedStats;
        mount();
        choose();
        values('iron-preview-current', [life, 49.25, 67.5, speed]);
        values('iron-preview-next', [nextLife, 51.25, 70.5, speed]);
        expect(
          screen.getByText(
            i18n.t('skills:ironGolem.bonuses', { life: 12.5, attack: 3.25, defense: 4.5 })
          )
        ).toBeVisible();
        expect(screen.getByText(text('previewScope'))).toBeVisible();
        expect(useInventoryStore.getState()).toBe(before);
        expect(usePlayerStore.getState().player?.derivedStats).toBe(resources);
        expect(useIronGolemSelectionStore.getState().selection).toBeNull();
      }
    );
    it.each([
      [0, 'iron-preview-next', [288.85, 39.25, 52.5, 61]],
      [20, 'iron-preview-current', [611.09, 77.25, 109.5, 61]]
    ] as const)(
      `keeps unlearned/capped summon boundaries with current Mastery in ${locale}: rank%s`,
      async (rank, id, expected) => {
        await i18n.changeLanguage(locale);
        hero({
          skillLevels: {
            [IRON]: rank,
            [BLOOD]: 1,
            'necromancer.clay_golem': 1,
            'necromancer.golem_mastery': 1
          }
        });
        fractionalItem();
        mount(rank);
        choose();
        values(id, expected);
        const other = screen.getByTestId(rank === 0 ? 'iron-preview-current' : 'iron-preview-next');
        expect(other).toHaveTextContent(
          i18n.t(rank === 0 ? 'skills:details.currentEmpty' : 'skills:details.maxLevel')
        );
      }
    );
    it(`updates live preview while keeping a locked paid recording and resources in ${locale}`, async () => {
      await i18n.changeLanguage(locale);
      enableRecording(100);
      const player = usePlayerStore.getState().player;
      if (!player) throw new Error('Missing preview fixture');
      usePlayerStore
        .getState()
        .setPlayer({
          ...player,
          skillPoints: 1,
          skillLevels: {
            [IRON]: 6,
            [BLOOD]: 1,
            'necromancer.clay_golem': 1,
            'necromancer.golem_mastery': 1
          }
        });
      mount();
      choose();
      acknowledge();
      arm();
      act(() => {
        start();
      });
      await flush();
      const published = inspectRecordedWaves().currentPublished;
      if (!published) throw new Error('Missing locked recording');
      const binding = published.binding;
      expect(binding.engineInput.golemMastery?.rank).toBe(1);
      const frozen = structuredClone({
        input: binding.engineInput,
        recording: binding.recording,
        publication: binding.publication
      });
      choose('second');
      values('iron-preview-current', [360.4, 54, 63, 61]);
      const inventory = useInventoryStore.getState(),
        resources = usePlayerStore.getState().player?.derivedStats;
      act(() => {
        usePlayerStore.getState().allocateSkillPoint('necromancer.golem_mastery');
      });
      values('iron-preview-current', [380.8, 54, 63, 62]);
      expect(screen.getByRole('status')).toHaveTextContent(text('locked'));
      expect(screen.getByRole('status')).toHaveTextContent(
        i18n.t('skills:ironGolem.summoned', {
          item: locale === 'en' ? 'Short Sword' : '短剑',
          mana: 35
        })
      );
      act(() => {
        refreshActivePlayerCombatConfig({ replayCurrentWave: true });
      });
      await flush();
      const replay = inspectRecordedWaves().currentPublished;
      if (!replay) throw new Error('Missing replay');
      expect({
        input: replay.binding.engineInput,
        recording: replay.binding.recording,
        publication: replay.binding.publication
      }).toEqual(frozen);
      expect(useInventoryStore.getState()).toBe(inventory);
      expect(usePlayerStore.getState().player?.derivedStats).toEqual(resources);
      expect(screen.getByRole('status')).toHaveTextContent(text('replay'));
      values('iron-preview-current', [380.8, 54, 63, 62]);
    });
  }
});
