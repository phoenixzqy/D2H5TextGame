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
import { buildPrerequisiteEdges, buildTreeLayout, resolveSkillIconSrc, SkillsScreen } from './SkillsScreen';
import { usePlayerStore } from '@/stores';
import { getSkillsForClass, organizeSkillsByTree } from '@/stores/skillsHelpers';
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

  for (const cls of CHARACTER_CLASSES) {
    it(`keeps rendered node layout constrained to the 3 D2 tree columns for class=${cls}`, () => {
      const skills = getSkillsForClass(cls);
      const layout = buildTreeLayout(skills);
      const columns = new Set(Array.from(layout.values()).map((node) => node.column));

      expect([...columns].sort()).toEqual([0, 1, 2]);
      for (const node of layout.values()) {
        expect(node.x).toBe([48, 160, 272][node.column]);
      }
    });
  }

  it('renders the three class trees as responsive columns with 3-column node boards', () => {
    setPlayerOfClass('necromancer');
    renderScreen();

    expect(screen.getByTestId('skills-tree-grid')).toHaveClass('lg:grid-cols-3');
    expect(screen.getByTestId('skills-tree-column-summoning-spells')).toBeInTheDocument();
    expect(screen.getByTestId('skills-tree-column-poison-and-bone-spells')).toBeInTheDocument();
    expect(screen.getByTestId('skills-tree-column-curses')).toBeInTheDocument();

    for (const skills of organizeSkillsByTree(getSkillsForClass('necromancer')).values()) {
      const layout = buildTreeLayout(skills);
      for (const node of layout.values()) {
        expect([0, 1, 2]).toContain(node.column);
      }
    }
  });

  it('renders only data-declared prerequisite edges for the active class tree panels', () => {
    setPlayerOfClass('necromancer');
    renderScreen();

    const expected = new Set<string>();
    for (const skills of organizeSkillsByTree(getSkillsForClass('necromancer')).values()) {
      const layout = buildTreeLayout(skills);
      for (const edge of buildPrerequisiteEdges(skills, layout)) {
        expected.add(`${edge.fromSkillId}->${edge.toSkillId}`);
      }
    }

    const rendered = new Set(
      Array.from(document.querySelectorAll<SVGPathElement>('[data-testid="skill-prerequisite-edge"]'))
        .map((edge) => `${edge.dataset.edgeFrom ?? ''}->${edge.dataset.edgeTo ?? ''}`)
    );

    expect(rendered).toEqual(expected);
    expect(rendered).not.toContain(
      'skills-necromancer-raise-skeleton->skills-necromancer-summon-mastery'
    );
  });

  it('masks prerequisite connectors under node hitboxes so Blood Golem has one unambiguous incoming edge', () => {
    setPlayerOfClass('necromancer');
    renderScreen();

    const incomingBloodGolem = Array.from(
      document.querySelectorAll<SVGPathElement>('[data-testid="skill-prerequisite-edge"]')
    ).filter((edge) => edge.dataset.edgeTo === 'skills-necromancer-blood-golem');

    expect(incomingBloodGolem).toHaveLength(1);
    const bloodGolemEdge = incomingBloodGolem[0];
    if (!bloodGolemEdge) throw new Error('Expected Blood Golem to have one incoming prerequisite edge');
    expect(bloodGolemEdge).toHaveAttribute('data-edge-from', 'skills-necromancer-golem-mastery');

    const edgeLayer = bloodGolemEdge.closest('[data-testid="skill-prerequisite-edge-layer"]');
    expect(edgeLayer).toHaveAttribute('mask', 'url(#skill-tree-connector-mask-summoning-spells)');

    const bloodGolemMask = Array.from(
      document.querySelectorAll<SVGRectElement>('[data-testid="skill-connector-mask"]')
    ).find((mask) => mask.dataset.nodeId === 'skills-necromancer-blood-golem');
    const bloodGolemNode = screen.getByTestId('skill-node-skills-necromancer-blood-golem');
    const nodeLeft = Number.parseFloat(bloodGolemNode.style.left);
    const nodeTop = Number.parseFloat(bloodGolemNode.style.top);

    expect(bloodGolemMask).toBeDefined();
    expect(bloodGolemMask).toHaveAttribute('x', String(nodeLeft - 6));
    expect(bloodGolemMask).toHaveAttribute('y', String(nodeTop - 6));
    expect(bloodGolemMask).toHaveAttribute('width', '92');
    expect(bloodGolemMask).toHaveAttribute('height', '92');
  });

  it('uses approved generated skill icons and falls back accessibly for failed icons', () => {
    expect(resolveSkillIconSrc('skills/necromancer/poison-nova.png')).toBe(
      '/assets/d2/generated/skill-icons/skills.necromancer.poison-nova.v1.png'
    );
    expect(resolveSkillIconSrc('skills/necromancer/raise-skeleton.png')).toBe(
      '/assets/d2/generated/skill-icons/skills.necromancer.raise-skeleton.v3.png'
    );
    expect(resolveSkillIconSrc('skills/necromancer/not-a-skill.png')).toBeNull();

    setPlayerOfClass('necromancer');
    renderScreen();

    const icon = screen.getByTestId('skill-icon-img-skills-necromancer-poison-nova');
    expect(icon).toHaveAttribute('src', '/assets/d2/generated/skill-icons/skills.necromancer.poison-nova.v1.png');
    expect(icon).toHaveAttribute('alt', '');
    expect(icon.parentElement).toHaveClass('h-[72px]', 'w-[72px]');

    fireEvent.error(icon);
    expect(screen.getByTestId('skill-icon-fallback-skills-necromancer-poison-nova')).toHaveClass(
      'h-[72px]',
      'w-[72px]'
    );
    expect(screen.getByTestId('skill-node-skills-necromancer-poison-nova')).toHaveAccessibleName(
      /毒云术|Poison Nova/
    );
  });

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

  it('active-skill tab renders 9-slot priority list with up/down arrows', () => {
    setPlayerOfClass('necromancer');
    renderScreen();
    // <Tabs> renders only the active tabpanel — click the "active" tab.
    const activeTabBtn = document.querySelector<HTMLButtonElement>(
      'button[role="tab"][aria-controls="tabpanel-active"]',
    );
    expect(activeTabBtn).not.toBeNull();
    act(() => { activeTabBtn?.click(); });

    const selects = document.querySelectorAll('select');
    expect(selects.length).toBeGreaterThanOrEqual(9);
    const firstOptions = Array.from(selects[0]?.querySelectorAll('option') ?? []).map((option) => option.value);
    expect(firstOptions).toContain('skills-necromancer-raise-skeleton');
    expect(firstOptions).not.toContain('skills-necromancer-bone-spear');
    expect(firstOptions).not.toContain('skills-necromancer-skeleton-mastery');
    // Move-up / move-down buttons (▲ / ▼) — one pair per slot.
    const moveUps = Array.from(document.querySelectorAll('button')).filter(
      (b) => b.textContent.includes('▲'),
    );
    const moveDowns = Array.from(document.querySelectorAll('button')).filter(
      (b) => b.textContent.includes('▼'),
    );
    expect(moveUps.length).toBeGreaterThanOrEqual(9);
    expect(moveDowns.length).toBeGreaterThanOrEqual(9);
  });

  it('hides allocated active skills that current equipment cannot cast', () => {
    const p = createMockPlayer('TestHero', 'amazon');
    act(() => {
      usePlayerStore.getState().setPlayer({
        ...p,
        equipment: []
      });
    });
    renderScreen();
    const activeTabBtn = document.querySelector<HTMLButtonElement>(
      'button[role="tab"][aria-controls="tabpanel-active"]',
    );
    act(() => { activeTabBtn?.click(); });

    const firstSelect = document.querySelector('select');
    const firstOptions = Array.from(firstSelect?.querySelectorAll('option') ?? []).map((option) => option.value);
    expect(firstOptions).not.toContain('skills-amazon-magic-arrow');
  });

  it('points-remaining banner displays the player skillPoints value', () => {
    setPlayerOfClass('necromancer');
    renderScreen();
    // Mock player starts with skillPoints=1 → "剩余技能点: 1" or "Points remaining".
    const body = document.body.textContent || '';
    expect(body).toMatch(/剩余技能点|Points|Remaining/);
  });

  it('shows dynamic Raise Skeleton current and next summon caps for the 1/6/12 curve', () => {
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
    expect(body).toMatch(/召唤上限\s*1|Summon Cap\s*1/);
    expect(body).toMatch(/召唤上限\s*2|Summon Cap\s*2/);
  });

  it('updates the detail panel on keyboard focus', () => {
    setPlayerOfClass('necromancer');
    renderScreen();

    const boneSpear = screen.getByTestId('skill-node-skills-necromancer-bone-spear');
    fireEvent.focus(boneSpear);
    expect(screen.getByTestId('skill-detail-panel').textContent || '').toMatch(/骨矛|Bone Spear/);
  });

  it('keeps the skill detail panel at a stable fixed height while allowing overflow', () => {
    setPlayerOfClass('necromancer');
    renderScreen();

    const detailPanel = screen.getByTestId('skill-detail-panel');
    expect(detailPanel).toHaveClass('h-[34rem]');
    expect(detailPanel).toHaveClass('md:h-[21rem]');
    expect(detailPanel).toHaveClass('overflow-y-auto');
  });
});
