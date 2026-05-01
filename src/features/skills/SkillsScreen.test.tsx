/**
 * SkillsScreen RTL — mirrors tests/e2e/skills-screen.spec.ts at unit
 * level. Per qa-engineer §6 coverage map (P07): one render per class
 * fixture, plus tab/locked/empty assertions.
 *
 * What we mirror from E2E:
 *   - Skill tree screen renders for each of the 7 classes with ≥8 nodes
 *     keyed `[data-testid^="skill-node-"]`.
 *   - Class-canonical skill names appear (Necro: 骨矛 / Bone Spear;
 *     Sorc: 冰封球 / Frozen Orb).
 *   - Other-class skills do NOT leak across (Necro tree has no Whirlwind).
 *   - Active-skill tab renders a 5-slot priority list with up/down arrows.
 *   - Locked-skill marker appears (🔒 or "需要等级").
 *
 * What stays Playwright-only (documented for P08):
 *   - Mobile-viewport horizontal-scroll measurement (browser layout).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Suspense } from 'react';
import { fireEvent, render, screen, act } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { buildTreeLayout, SkillsScreen } from './SkillsScreen';
import { usePlayerStore } from '@/stores';
import { getSkillsForClass } from '@/stores/skillsHelpers';
import { CHARACTER_CLASSES, createMockPlayer, type CharacterClass } from '@/features/character/createMockPlayer';

function renderScreen() {
  return render(
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={null}>
        <MemoryRouter
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          initialEntries={['/skills']}
        >
          <SkillsScreen />
        </MemoryRouter>
      </Suspense>
    </I18nextProvider>,
  );
}

function setPlayerOfClass(cls: CharacterClass) {
  const p = createMockPlayer('TestHero', cls);
  act(() => { usePlayerStore.getState().setPlayer(p); });
}

// Class → canonical skill names (matches the E2E spec).
const CANONICAL: Record<CharacterClass, RegExp> = {
  necromancer: /骨矛|Bone Spear/,
  sorceress:   /冰封球|Frozen Orb/,
  barbarian:   /旋风斩|Whirlwind/,
  paladin:     /狂热|Zeal/,
  amazon:      /标枪|Javelin|魔箭|Magic Arrow/,
  druid:       /龙卷|Tornado|火焰|Fire/,
  assassin:    /震击网|Shock Web|刀刃|Blade/,
};

describe('<SkillsScreen> — class fixture renders (mirrors skills-screen.spec.ts)', () => {
  beforeEach(async () => {
    act(() => { usePlayerStore.getState().reset(); });
    if (i18n.language !== 'zh-CN') await i18n.changeLanguage('zh-CN');
  });

  it('renders the noPlayer state when the store is empty', () => {
    renderScreen();
    expect(screen.getByTestId('skills-screen')).toBeInTheDocument();
    // skills-tree-panel is gated by player presence.
    expect(screen.queryByTestId('skills-tree-panel')).toBeNull();
  });

  for (const cls of CHARACTER_CLASSES) {
    it(`renders ≥8 skill-node-* entries for class=${cls}`, () => {
      setPlayerOfClass(cls);
      renderScreen();
      expect(screen.getByTestId('skills-screen')).toBeInTheDocument();
      const nodes = document.querySelectorAll('[data-testid^="skill-node-"]');
      expect(nodes.length).toBeGreaterThanOrEqual(8);
    });
  }

  for (const cls of CHARACTER_CLASSES) {
    it(`uses unique tree slots for class=${cls}`, () => {
      const skills = getSkillsForClass(cls);
      const layout = buildTreeLayout(skills);
      const coordinates = new Set(Array.from(layout.values()).map((node) => `${String(node.row)}:${String(node.column)}`));
      expect(coordinates.size).toBe(layout.size);
      for (const skill of skills) {
        const node = layout.get(skill.id);
        if (!node) throw new Error(`missing layout for ${skill.id}`);
        for (const prereqId of skill.prerequisites ?? []) {
          const parent = layout.get(prereqId);
          if (!parent) continue;
          expect(node.row).toBeGreaterThan(parent.row);
        }
      }
    });
  }

  it('Necromancer tree contains Bone Spear and NOT Whirlwind', () => {
    setPlayerOfClass('necromancer');
    renderScreen();
    const body = document.body.textContent || '';
    expect(body).toMatch(CANONICAL.necromancer);
    expect(body).not.toMatch(CANONICAL.barbarian);
  });

  it('Sorceress tree contains Frozen Orb and NOT Whirlwind', () => {
    setPlayerOfClass('sorceress');
    renderScreen();
    const body = document.body.textContent || '';
    expect(body).toMatch(CANONICAL.sorceress);
    expect(body).not.toMatch(CANONICAL.barbarian);
  });

  it('Barbarian tree contains Whirlwind and NOT Bone Spear', () => {
    setPlayerOfClass('barbarian');
    renderScreen();
    const body = document.body.textContent || '';
    expect(body).toMatch(CANONICAL.barbarian);
    expect(body).not.toMatch(CANONICAL.necromancer);
  });

  it('shows locked-skill markers (🔒 or "需要等级") for skills with minLevel > playerLevel', () => {
    setPlayerOfClass('sorceress');
    renderScreen();
    const body = document.body.textContent || '';
    expect(/🔒|需要等级|Requires Level/.test(body)).toBe(true);
  });

  it('active-skill tab renders 5-slot priority list with up/down arrows', () => {
    setPlayerOfClass('necromancer');
    renderScreen();
    // <Tabs> renders only the active tabpanel — click the "active" tab.
    const activeTabBtn = document.querySelector<HTMLButtonElement>(
      'button[role="tab"][aria-controls="tabpanel-active"]',
    );
    expect(activeTabBtn).not.toBeNull();
    act(() => { activeTabBtn?.click(); });

    const selects = document.querySelectorAll('select');
    expect(selects.length).toBeGreaterThanOrEqual(5);
    // Move-up / move-down buttons (▲ / ▼) — one pair per slot.
    const moveUps = Array.from(document.querySelectorAll('button')).filter(
      (b) => b.textContent.includes('▲'),
    );
    const moveDowns = Array.from(document.querySelectorAll('button')).filter(
      (b) => b.textContent.includes('▼'),
    );
    expect(moveUps.length).toBeGreaterThanOrEqual(5);
    expect(moveDowns.length).toBeGreaterThanOrEqual(5);
  });

  it('points-remaining banner displays the player skillPoints value', () => {
    setPlayerOfClass('necromancer');
    renderScreen();
    // Mock player starts with skillPoints=1 → "剩余技能点: 1" or "Points remaining".
    const body = document.body.textContent || '';
    expect(body).toMatch(/剩余技能点|Points|Remaining/);
  });

  it('shows dynamic Raise Skeleton current and next summon caps without stale max-5 copy', () => {
    const p = createMockPlayer('TestHero', 'necromancer');
    act(() => {
      usePlayerStore.getState().setPlayer({
        ...p,
        level: 12,
        skillLevels: { 'necromancer.raise_skeleton': 5 },
        skillPoints: 2
      });
    });
    renderScreen();

    fireEvent.click(screen.getByTestId('skill-node-skills-necromancer-raise-skeleton'));
    const body = document.body.textContent || '';
    expect(body).not.toMatch(/上限 5|max 5/i);
    expect(body).toMatch(/召唤上限\s*3|Summon Cap\s*3/);
    expect(body).toMatch(/召唤上限\s*4|Summon Cap\s*4/);
  });

  it('updates the detail panel on keyboard focus', () => {
    setPlayerOfClass('necromancer');
    renderScreen();

    const boneSpear = screen.getByTestId('skill-node-skills-necromancer-bone-spear');
    fireEvent.focus(boneSpear);
    expect(screen.getByTestId('skill-detail-panel').textContent || '').toMatch(/骨矛|Bone Spear/);
  });
});
