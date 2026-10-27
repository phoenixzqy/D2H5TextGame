/** Constructed L30/equipment/prior-act fixtures, never earned campaign or balance evidence. */
import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import type { Item } from '../../src/engine/types/items';
import { createCharacter, navTo } from '../e2e/_helpers';

const at = new Date('2026-10-27T12:00:00Z'), character = 'Combined Shadow Test';
const rows = JSON.parse(await readFile(new URL('../../src/data/skills/assassin.json', import.meta.url), 'utf8')) as
  { id: string; prerequisites?: string[] }[];
async function backup(page: Page): Promise<SaveCurrent> {
  await navTo(page, 'settings');
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const download = await pending;
  try { return JSON.parse(await readFile(await download.path(), 'utf8')) as SaveCurrent; }
  finally { await download.delete(); }
}

for (const locale of ['en', 'zh-CN'] as const)
  for (const slug of ['shadow-warrior', 'shadow-master'] as const)
    test(`combined ${slug} owns charges, finite trap, finisher and offline continuity ${locale}`, async ({ page, context }, info) => {
      const english = locale === 'en', warrior = slug === 'shadow-warrior';
      const id = 'skills-assassin-' + slug, runtime = 'assassin.' + slug.replaceAll('-', '_');
      const bodyName = english ? (warrior ? 'Shadow Warrior' : 'Shadow Master') : (warrior ? '影子战士' : '影子大师');
      const tiger = english ? 'Tiger Strike' : '虎击', trap = english ? 'Wake of Fire' : '火焰复苏';
      const finisher = english ? 'Dragon Talon' : '龙爪', errors: string[] = [];
      const watch = (p: Page) => {
        p.on('pageerror', e => errors.push(e.message));
        p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
      };
      watch(page); await page.clock.setFixedTime(at); await page.goto('/');
      await page.waitForLoadState('networkidle');
      await createCharacter(page, { class: 'assassin', name: character });
      await navTo(page, 'settings');
      await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
      const original = await backup(page), levels: Record<string, number> = {};
      function learn(skillId: string, rank = 1) {
        const row = rows.find(row => row.id === skillId);
        if (!row) throw new Error('Missing native shadow prerequisite');
        for (const dependency of row.prerequisites ?? []) learn(dependency);
        levels['assassin.' + skillId.slice('skills-assassin-'.length).replaceAll('-', '_')] = rank;
      }
      const source = rows.find(row => row.id === id);
      if (!source) throw new Error('Missing shadow source');
      for (const dependency of source.prerequisites ?? []) learn(dependency);
      const copied = warrior ? ['tiger-strike', 'wake-of-fire', 'dragon-talon'] : [];
      for (const skill of copied) learn('skills-assassin-' + skill, 1);
      const cap: Item = { id: 'synthetic-shadow-cycle-cap', baseId: 'items/base/helm-cap', rarity: 'rare', level: 1,
        identified: true, equipped: false, socketCapacity: 0, socketContents: [],
        affixes: [{ affixId: 'synthetic-import', values: new Map([
          ['statMods.life', 999880], ['statMods.mana', 999000], ['statMods.attackSpeed', -100]
        ]) }] };
      const incoming = { ...original,
        player: { ...original.player, level: 30, skillPoints: 20, comboOrder: [], skillLevels: levels },
        inventory: { ...original.inventory, backpack: [...original.inventory.backpack, cap] },
        map: { ...original.map, currentAct: 3, currentSubAreaId: 'a3-spider-forest',
          clearedSubAreas: ['areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha',
            'areas/act3-durance-of-hate', 'areas/act4-chaos-sanctuary'] }
      };
      const importLabel = english ? 'Import Save' : '导入存档';
      await page.getByRole('button', { name: importLabel, exact: true }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('textbox').fill(JSON.stringify(incoming, (_key, value: unknown) => value instanceof Map ? [...value] : value));
      await dialog.getByRole('button', { name: importLabel, exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await navTo(page, 'inventory'); await page.getByTestId('inv-item-' + cap.id).click();
      await page.getByTestId('inv-primary-action').click();
      for (const rank of [1, 20]) {
        await navTo(page, 'skills'); await page.getByTestId('skill-node-' + id).focus();
        await page.keyboard.press('Enter'); await page.mouse.move(0, 0);
        const panel = page.getByTestId('skill-detail-panel');
        for (let point = 0; point < (rank === 1 ? 1 : 19); point++)
          await panel.getByRole('button', { name: english ? 'Allocate' : '分配', exact: true }).click();
        await page.locator('#tab-active').click();
        const selected = [id, ...copied.map(skill => 'skills-assassin-' + skill)];
        for (const [index, skill] of selected.entries())
          await page.getByRole('combobox', { name: new RegExp(`^(Slot ${String(index + 1)}|槽位 ${String(index + 1)})$`) }).selectOption(skill);
        const prepared = await backup(page);
        expect(prepared.player.skillLevels?.[runtime]).toBe(rank);
        expect(prepared.player.skillPoints).toBe(20 - rank);
        expect(prepared.player.comboOrder.filter(Boolean)).toEqual(selected);
        if (!warrior) for (const skill of ['tiger_strike', 'wake_of_fire', 'dragon_talon'])
          expect(prepared.player.skillLevels?.['assassin.' + skill] ?? 0).toBe(0);
        await info.attach(`rank${String(rank)}-prepared`, { body: JSON.stringify(prepared), contentType: 'application/json' });
        const observed = await page.evaluateHandle(({ bodyName, tiger, trap, finisher, english }) => {
          interface Pool { current: number; max: number }
          interface Frame { batch: number; bodyId: string; hp: Pool; mp: Pool; heroHp: Pool; heroMp: Pool; chips: string; enemies: Pool[] }
          interface Group { skill: string; time: string; batch: number; rows: string[] }
          const seen = new WeakSet<Element>();
          let frames: Frame[] = [], groups: Group[] = [], fireRows: { time: string; batch: number; text: string }[] = [];
          let wave = '', fullSeen = false, consumed = false, trapSeen = false, trapEnded = false, batch = 0, active: Group | null = null;
          const snapshot = () => ({ wave, frames, groups, fullSeen, consumed, trapSeen, trapEnded, fireRows });
          const priorWaves: ReturnType<typeof snapshot>[] = [];
          const pool = (bar: Element | null | undefined): Pool => {
            const read = (key: string) => { const raw = bar?.getAttribute(key); return raw == null ? Number.NaN : Number(raw); };
            return { current: read('aria-valuenow'), max: read('aria-valuemax') };
          };
          const sample = () => {
            batch++;
            const screen = document.querySelector('[data-testid="combat-screen"]');
            const body = Array.from(screen?.querySelectorAll('[data-testid="allies-grid"] [data-kind="summon"]') ?? [])
              .find(card => card.getAttribute('aria-label') === bodyName);
            if (!body) return;
            const currentWave = Array.from(screen?.querySelectorAll('[data-testid="combat-battlefield"] div') ?? [])
              .find(element => element.childElementCount === 0 && /^\d+\/\d+$/.test(element.textContent))?.textContent;
            if (!currentWave) throw new Error('Missing public wave indicator');
            if (wave !== currentWave) {
              if (wave) priorWaves.push(snapshot());
              wave = currentWave; frames = []; groups = []; fireRows = [];
              fullSeen = false; consumed = false; trapSeen = false; trapEnded = false; active = null;
              for (const row of document.querySelectorAll('[data-testid="combat-log"] > div')) seen.add(row);
            }
            const resource = (card: Element | null | undefined, name: string) => pool(card?.querySelector(`[role="progressbar"][aria-label="${name}"]`));
            const hero = screen?.querySelector('[data-testid="allies-grid"] [data-kind="hero"]');
            const chips = body.querySelector('[data-testid="unit-effect-chips"]')?.textContent ?? '';
            if (chips.includes(tiger + (english ? ' charges 3/3' : ' 蓄气 3/3'))) fullSeen = true;
            if (chips.includes(trap)) trapSeen = true;
            else if (trapSeen) trapEnded = true;
            if (fullSeen && groups.some(g => g.skill === finisher) && !chips.includes(tiger + (english ? ' charges ' : ' 蓄气 '))) consumed = true;
            const frame: Frame = { batch, bodyId: body.getAttribute('data-testid') ?? '', hp: resource(body, english ? 'HP' : '生命'),
              mp: resource(body, english ? 'MP' : '法力'), heroHp: resource(hero, english ? 'HP' : '生命'),
              heroMp: pool(screen?.querySelector(`[role="group"][aria-label="${english ? 'MP' : '法力'}"] [role="progressbar"]`)), chips,
              enemies: Array.from(screen?.querySelectorAll('[data-testid="enemies-grid"] [data-kind="monster"]') ?? [])
                .map(card => resource(card, english ? 'HP' : '生命')) };
            if (frames.length < 2000 && JSON.stringify({ ...frames.at(-1), batch }) !== JSON.stringify(frame)) frames.push(frame);
            for (const row of document.querySelectorAll('[data-testid="combat-log"] > div')) {
              if (seen.has(row)) continue; seen.add(row);
              const text = row.lastElementChild?.textContent ?? '', time = row.firstElementChild?.textContent ?? '';
              const cast = text.includes(english ? ' casts ' : ' 施放了 '), basic = text.includes(english ? ' readies an attack.' : ' 准备出招。');
              if (cast || basic) {
                active = null;
                const skill = [tiger, trap, finisher].find(name => text.startsWith(bodyName + (english ? ' casts ' : ' 施放了 ') + name));
                if (skill) { active = { skill, time, batch, rows: [text] }; groups.push(active); }
              } else if (active) active.rows.push(text);
              const outgoing = text.startsWith(bodyName + ' ') || text.startsWith((english ? 'CRITICAL! ' : '暴击！') + bodyName);
              if (outgoing && text.includes(english ? 'fire' : '火焰') && (english ? /for [1-9]\d* /.test(text) : /造成 [1-9]\d* 点/.test(text)))
                fireRows.push({ time, batch, text });
            }
          };
          const observer = new MutationObserver(sample);
          observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true,
            attributeFilter: ['aria-valuenow', 'aria-valuemax', 'style'] });
          return { read: () => ({ ...snapshot(), priorWaves }), disconnect: () => { observer.disconnect(); } };
        }, { bodyName, tiger, trap, finisher, english });
        try {
          await navTo(page, 'map');
          // Rank20 Master's first Act3 finisher legitimately kills its victim before four hits.
          // Use authored Act5 enemies for that constructed high-rank damage witness.
          const act = !warrior && rank === 20 ? 5 : 3;
          await page.getByRole('button', { name: english ? new RegExp(`^Act ${String(act)} ·`) : new RegExp(`^第 ${String(act)} 章 ·`) }).click({ timeout: 10_000 });
          await page.getByTestId(act === 5 ? 'sub-area-row-a5-bloody-foothills' : 'sub-area-row-a3-spider-forest')
            .getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click({ timeout: 10_000 });
          await page.mouse.move(0, 0);
          const positivePhysical = (text: string) => (text.startsWith(bodyName + ' ') || text.startsWith((english ? 'CRITICAL! ' : '暴击！') + bodyName)) &&
            text.includes(english ? 'physical' : '物理') && (english ? /for [1-9]\d* /.test(text) : /造成 [1-9]\d* 点/.test(text));
          const readProof = () => observed.evaluate(handle => handle.read());
          const findCycle = (value: Awaited<ReturnType<typeof readProof>>) => {
            let mana = warrior ? 100 : 150, start = 0;
            const payments = value.groups.map(g => { mana -= g.skill === tiger ? 3 : g.skill === trap ? 17 : 4; return mana; });
            for (let placement = 0; placement < value.groups.length - 1; placement++) {
              const cast = value.groups[placement], finish = value.groups[placement + 1];
              if (!cast || !finish) throw new Error('Missing observed cast group');
              if (cast.skill === finisher) { start = placement + 1; continue; }
              if (cast.skill !== trap || finish.skill !== finisher) continue;
              const builders = value.groups.slice(start, placement);
              const firstBuilder = builders[0];
              if (!firstBuilder || builders.length < 3 || !builders.every(g => g.skill === tiger) || finish.rows.filter(positivePhysical).length !== 4) continue;
              const nextPlacement = value.groups.slice(placement + 1).find(g => g.skill === trap)?.batch ?? (value.frames.at(-1)?.batch ?? cast.batch) + 1;
              const frames = value.frames.filter(f => f.batch >= firstBuilder.batch && f.batch < nextPlacement);
              const full = tiger + (english ? ' charges 3/3' : ' 蓄气 3/3');
              const charge = tiger + (english ? ' charges ' : ' 蓄气 ');
              if (!frames.some(f => f.batch <= cast.batch && f.chips.includes(full)) ||
                  !frames.some(f => f.batch >= finish.batch && !f.chips.includes(charge)) ||
                  !frames.some(f => f.batch >= cast.batch && f.chips.includes(trap)) ||
                  !frames.some(f => f.batch > cast.batch && !f.chips.includes(trap)) ||
                  new Set(value.fireRows.filter(row => row.batch >= cast.batch && row.batch < nextPlacement).map(row => row.batch)).size < 3) continue;
              const paid = value.groups.slice(start, placement + 2).every((g, i) =>
                value.frames.some(f => f.batch === g.batch && f.mp.current === payments[start + i]));
              if (paid) return { start, placement, finisher: placement + 1, nextPlacement,
                manaAfterCasts: payments.slice(start, placement + 2) };
            }
            return null;
          };
          await expect.poll(async () => findCycle(await readProof()) !== null, { timeout: 120_000 }).toBe(true);
          await page.getByRole('button', { name: english ? 'Pause' : '暂停', exact: true }).click();
          const proof = await readProof(), cycle = findCycle(proof);
          expect(cycle).not.toBeNull();
          expect(proof.wave).toMatch(/^\d+\/\d+$/);
          expect(proof.frames.length).toBeGreaterThan(5);
          for (const frame of proof.frames) for (const pool of [frame.hp, frame.mp, frame.heroHp, frame.heroMp, ...frame.enemies]) {
            expect(Number.isFinite(pool.current)).toBe(true); expect(Number.isFinite(pool.max)).toBe(true);
            expect(pool.max).toBeGreaterThan(0); expect(pool.current).toBeGreaterThanOrEqual(0); expect(pool.current).toBeLessThanOrEqual(pool.max);
          }
          expect(proof.frames.every(frame => frame.mp.max === (warrior ? 100 : 150))).toBe(true);
          expect(proof.frames.some(frame => frame.enemies.some(enemy => enemy.current < enemy.max))).toBe(true);
          expect(proof.frames.some(frame => frame.heroMp.current < prepared.player.derivedStats.manaMax)).toBe(true);
          expect(proof.frames.some(frame => frame.heroHp.current < frame.heroHp.max)).toBe(true);
          expect(new Set(proof.frames.map(frame => frame.bodyId)).size).toBe(1);
          await info.attach(`rank${String(rank)}-combined-proof`, { body: JSON.stringify({ slug, rank, ...proof, cycle }), contentType: 'application/json' });
          const geometry: { width: number; height: number; mana: string | null }[] = [];
          for (const [width, height] of [[360, 640], [412, 915], [640, 360], [1280, 800], [1920, 1080]] as const) {
            await page.setViewportSize({ width, height });
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
            const mana = page.getByTestId('allies-grid').locator('[data-kind="summon"]')
              .getByRole('progressbar', { name: english ? 'MP' : '法力', exact: true });
            await mana.scrollIntoViewIfNeeded(); await expect(mana).toBeInViewport();
            expect(await mana.evaluate(element => {
              const box = element.getBoundingClientRect(), front = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
              return front !== null && element.contains(front);
            })).toBe(true);
            geometry.push({ width, height, mana: await mana.getAttribute('aria-valuenow') });
          }
          await info.attach(`rank${String(rank)}-geometry`, { body: JSON.stringify(geometry), contentType: 'application/json' });
          await page.setViewportSize(info.project.name.includes('mobile') ? { width: 360, height: 640 } : { width: 1280, height: 800 });
          for (const [label, selector] of [['shadow', '[data-testid="allies-grid"] [data-kind="summon"]'],
            ['enemy', '[data-testid="enemies-grid"] [data-kind="monster"]:not([data-dead])']] as const) {
            const card = page.locator(selector).first(); await card.scrollIntoViewIfNeeded(); await expect(card).toBeInViewport();
            expect(await card.evaluate(element => {
              const box = element.getBoundingClientRect(), front = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
              return front !== null && element.contains(front);
            })).toBe(true);
            await info.attach(`rank${String(rank)}-visible-${label}`, { body: await page.screenshot(), contentType: 'image/png' });
          }
        } catch (error) {
          await info.attach(`rank${String(rank)}-failed-proof`, { body: JSON.stringify(await observed.evaluate(handle => handle.read())), contentType: 'application/json' });
          throw error;
        } finally { await observed.evaluate(handle => { handle.disconnect(); }); await observed.dispose(); }
        await page.getByRole('button', { name: english ? 'Flee' : '逃跑', exact: true }).click();
      }
      await navTo(page, 'settings'); await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
      await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
      const saved = await backup(page);
      expect(saved.player.skillLevels?.[runtime]).toBe(20);
      expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
      await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state)).toBe('activated');
      await page.close();
      for (const offline of [false, true]) {
        await context.setOffline(offline); const fresh = await context.newPage(); watch(fresh);
        try {
          await fresh.clock.setFixedTime(at); const response = await fresh.goto('/'); expect(response?.ok()).toBe(true);
          if (offline) expect(response?.fromServiceWorker()).toBe(true);
          await fresh.getByTestId('home-continue').click(); const restored = await backup(fresh);
          for (const domain of ['endgame', 'player', 'inventory', 'map', 'mercs', 'formation', 'meta'] as const)
            expect(restored[domain]).toEqual(saved[domain]);
          await info.attach(offline ? 'offline-save-pair' : 'online-save-pair', { body: JSON.stringify({ saved, restored }), contentType: 'application/json' });
        } finally { await fresh.close(); }
      }
      expect(errors).toEqual([]);
    });
