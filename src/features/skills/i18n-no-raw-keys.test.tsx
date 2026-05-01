/**
 * i18n-no-raw-keys RTL — mirrors tests/e2e/i18n-no-raw-keys.spec.ts at
 * unit level. We render the SkillsScreen for each of the 7 classes and
 * scan the rendered text for raw i18n key patterns:
 *   - `skills.<class>.<key>.(name|desc)` should never reach the DOM.
 *   - `mskill-<id>` (raw merc-skill IDs) should never reach the DOM.
 *
 * Also a quick mercs-screen smoke (empty roster) so the mskill regex has
 * coverage on a screen that owns the namespace.
 *
 * Both regexes match the patterns in the Playwright spec exactly.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Suspense } from 'react';
import { render, act } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { SkillsScreen } from './SkillsScreen';
import { MercsScreen } from '@/features/mercs/MercsScreen';
import { usePlayerStore } from '@/stores';
import { CHARACTER_CLASSES, createMockPlayer, type CharacterClass } from '@/features/character/createMockPlayer';

// Match exactly what tests/e2e/i18n-no-raw-keys.spec.ts asserts.
const RAW_SKILL_KEY_RE = /skills\.[a-z]+\.[a-z][a-z0-9-]*\.(desc|name)/m;
const RAW_MSKILL_RE = /mskill-[a-z]/;

function renderSkills(cls: CharacterClass) {
  act(() => { usePlayerStore.getState().setPlayer(createMockPlayer('Tester', cls)); });
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

function renderMercs(cls: CharacterClass) {
  act(() => { usePlayerStore.getState().setPlayer(createMockPlayer('Tester', cls)); });
  return render(
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={null}>
        <MemoryRouter
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          initialEntries={['/mercs']}
        >
          <MercsScreen />
        </MemoryRouter>
      </Suspense>
    </I18nextProvider>,
  );
}

describe('i18n-no-raw-keys (skills) — per-class regex scan', () => {
  beforeEach(async () => {
    act(() => { usePlayerStore.getState().reset(); });
    if (i18n.language !== 'zh-CN') await i18n.changeLanguage('zh-CN');
  });

  for (const cls of CHARACTER_CLASSES) {
    it(`zh-CN: SkillsScreen for ${cls} has no raw skills.<class>.<id>.(name|desc)`, () => {
      renderSkills(cls);
      const body = document.body.textContent || '';
      expect(body, `raw skill key leaked for class=${cls}`).not.toMatch(RAW_SKILL_KEY_RE);
      expect(body).not.toMatch(RAW_MSKILL_RE);
    });
  }

  for (const cls of CHARACTER_CLASSES) {
    it(`en: SkillsScreen for ${cls} has no raw key patterns`, async () => {
      await i18n.changeLanguage('en');
      try {
        renderSkills(cls);
        const body = document.body.textContent || '';
        expect(body, `raw skill key leaked for class=${cls} (en)`).not.toMatch(
          RAW_SKILL_KEY_RE,
        );
        expect(body).not.toMatch(RAW_MSKILL_RE);
      } finally {
        await i18n.changeLanguage('zh-CN');
      }
    });
  }
});

describe('i18n-no-raw-keys (mercs) — empty roster', () => {
  beforeEach(async () => {
    act(() => { usePlayerStore.getState().reset(); });
    if (i18n.language !== 'zh-CN') await i18n.changeLanguage('zh-CN');
  });

  it('MercsScreen with no mercs has no raw mskill-* ids (zh-CN)', () => {
    renderMercs('necromancer');
    const body = document.body.textContent || '';
    expect(body).not.toMatch(RAW_MSKILL_RE);
    expect(body).not.toMatch(RAW_SKILL_KEY_RE);
  });

  it('MercsScreen with no mercs has no raw mskill-* ids (en)', async () => {
    await i18n.changeLanguage('en');
    try {
      renderMercs('necromancer');
      const body = document.body.textContent || '';
      expect(body).not.toMatch(RAW_MSKILL_RE);
      expect(body).not.toMatch(RAW_SKILL_KEY_RE);
    } finally {
      await i18n.changeLanguage('zh-CN');
    }
  });
});
