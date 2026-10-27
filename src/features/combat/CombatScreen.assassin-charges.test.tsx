import * as React from 'react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import skills from '@/data/skills/assassin.json';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { abortSubAreaRun, playerToCombatUnit } from '@/stores/combatHelpers';
import { useCombatStore, useMapStore, useMetaStore, usePlayerStore, useInventoryStore, useFormationStore } from '@/stores';
import { useHydrationStore } from '@/stores/hydrationStore';
import { runBattleRecorded } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { CombatScreen } from '@/features/combat/CombatScreen';
const stores = [useCombatStore,useMapStore,useMetaStore,usePlayerStore,useInventoryStore,useFormationStore];
beforeEach(() => { abortSubAreaRun(); for (const store of stores) store.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); abortSubAreaRun(); for (const store of stores) store.getState().reset(); useHydrationStore.getState().setStatus('idle'); });
const families = [
 ['tiger-strike','Tiger Strike','虎击'], ['fists-of-fire','Fists of Fire','火焰拳'],
 ['cobra-strike','Cobra Strike','眼镜蛇攻击'], ['claws-of-thunder','Claws of Thunder','雷电爪'],
 ['blades-of-ice','Blades of Ice','寒冰刀'], ['phoenix-strike','Phoenix Strike','凤凰攻击']
] as const;
for (const locale of ['en','zh-CN'] as const) for (const [slug,en,zh] of families) for (const rank of [1,20])
 it(`shows actual ${slug} rank${String(rank)} counts, lifetime and discharge in ${locale}`, async () => {
  await i18n.changeLanguage(locale);
  const id = 'skills-assassin-' + slug, levels = Object.fromEntries(skills.map(row => [row.id,1])); levels[id] = rank;
  const player = { ...createMockPlayer('Constructed charge feedback','assassin'), level:30,
   skillLevels:levels, comboOrder:[id,'skills-assassin-dragon-talon'] };
  usePlayerStore.getState().setPlayer(player);
  const native = playerToCombatUnit(player), hold = { id:'stun', sourceId:'constructed-hold', stacks:1, remaining:-1 };
  const hero: CombatUnit = { ...native, life:2000, mana:1000, manaRegenPerSecond:0, manaRegenBaselinePerSecond:0,
   stats:{ ...native.stats, lifeMax:2000, manaMax:1000, attackSpeed:100, defense:0, magicResist:0,
    physDodge:0, magicDodge:0, critChance:0 }, statuses:[{...hold,remaining:1.7,appliedAtMs:1701,expiresAtMs:3401},
    {...hold,remaining:1.7,appliedAtMs:5101,expiresAtMs:6801},{...hold,appliedAtMs:10201}] };
  const enemy: CombatUnit = { ...hero, id:'constructed-charge-target', side:'enemy', kind:'monster',
   life:1000000, stats:{...hero.stats,lifeMax:1000000}, skillOrder:[], skillLevels:{}, assassinMartialRanks:{}, statuses:[hold] };
  const out = runBattleRecorded({ seed:7, playerTeam:[hero], enemyTeam:[enemy] });
  const observations = out.events.filter(e => e.kind === 'status-state').filter(e => e.target === hero.id);
  const chargeId = 'charge-' + slug;
  const gains = [1,2,3].map(count => observations.find(e => e.statuses.some(s => s.id === chargeId && s.stacks === count && s.remaining === 15)));
  const finisher = out.events.find(e => e.kind === 'action' && e.actor === hero.id && e.skillId === 'assassin.dragon_talon');
  const clear = observations.find(e => e.simClockMs === finisher?.simClockMs && !e.statuses.some(s => s.id === chargeId));
  if (!gains[0] || !clear) throw new Error('Missing actual paid gain/discharge observation');
  useCombatStore.setState({ inCombat:true,isPaused:true,playerTeam:[{...hero,statuses:gains[0].statuses}],enemyTeam:[enemy] });
  render(<I18nextProvider i18n={i18n}><React.Suspense fallback={null}><MemoryRouter future={{v7_startTransition:true,v7_relativeSplatPath:true}}><CombatScreen /></MemoryRouter></React.Suspense></I18nextProvider>);
  const card = screen.getByTestId('unit-card-' + hero.id), name = locale === 'en' ? en : zh;
  for (const [index,gain] of gains.entries()) {
   if (!gain) throw new Error('Missing actual paid gain');
   act(() => { useCombatStore.setState({ playerTeam:[{...hero,statuses:gain.statuses}] }); });
   const text = locale === 'en' ? `${name} charges ${String(index+1)}/3 · 15s` : `${name} 蓄气 ${String(index+1)}/3 · 15秒`;
   expect(within(card).getByText(text)).toHaveClass('text-blue-200');
   expect(within(card).getByTestId('unit-effect-chips').textContent).not.toMatch(/charge-|skills:|undefined|NaN|×/);
  }
  act(() => { useCombatStore.setState({playerTeam:[{...hero,statuses:clear.statuses}]}); });
  expect(within(card).queryByTestId('unit-effect-chips')).not.toBeInTheDocument();
 });
