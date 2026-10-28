// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const entry = join(dirname(fileURLToPath(import.meta.url)), 'one-shot/fresh-lineage.once.ts');

// Read the actual initializer, never import the native entry or its policy.
// Only filesystem/URL operations may reach the generated module.
function rootFragment(text: string): string {
  const source = ts.createSourceFile('entry.ts', text, ts.ScriptTarget.Latest, true);
  const roots = source.statements.flatMap(statement => ts.isVariableStatement(statement)
    ? statement.declarationList.declarations.filter(declaration => ts.isIdentifier(declaration.name) && declaration.name.text === 'root')
    : []);
  const initializer = roots[0]?.initializer;
  function filesystemOnly(node: ts.Node): boolean {
    if (ts.isStringLiteral(node)) return true;
    if (ts.isPropertyAccessExpression(node) && node.name.text === 'url' &&
      ts.isMetaProperty(node.expression) && node.expression.keywordToken === ts.SyntaxKind.ImportKeyword && node.expression.name.text === 'meta') return true;
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) &&
      ['resolve', 'dirname', 'fileURLToPath'].includes(node.expression.text))
      return node.typeArguments === undefined && node.arguments.every(filesystemOnly);
    if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'URL')
      return node.typeArguments === undefined && node.arguments !== undefined && node.arguments.every(filesystemOnly);
    return false;
  }
  if (roots.length !== 1 || !initializer || !filesystemOnly(initializer))
    throw new Error('Expected exactly one filesystem-only root initializer');
  return [
    "import { dirname, resolve } from 'node:path';",
    "import { fileURLToPath } from 'node:url';",
    `export const root = ${initializer.getText(source)};`,
    ''
  ].join('\n');
}

const owned: { directories: string[]; files: string[]; imports: Promise<unknown>[] }[] = [];
afterEach(async () => {
  for (const fixture of owned.splice(0)) {
    await Promise.allSettled(fixture.imports);
    for (const file of fixture.files) {
      if (existsSync(file)) {
        expect(realpathSync(file)).toBe(file);
        unlinkSync(file);
      }
    }
    for (const directory of [...fixture.directories].reverse()) {
      expect(realpathSync(directory)).toBe(directory);
      rmdirSync(directory);
    }
    console.info(JSON.stringify({ rootFragmentPathsRemoved: [...fixture.files, ...fixture.directories] }));
  }
});

describe('fresh-lineage root resolution without native entry execution', () => {
  it.each(['checkout', 'checkout with spaces-游戏'])('resolves the source initializer under real jsdom in %s', async checkoutName => {
    expect(self.location.protocol).toMatch(/^https?:$/);
    const code = rootFragment(readFileSync(entry, 'utf8'));
    // Keep web-transformed fixtures inside Vite's existing serving root.
    const base = mkdtempSync(join(dirname(entry), '..', '.root-fragment-'));
    const fixture = { directories: [base], files: [] as string[], imports: [] as Promise<unknown>[] };
    owned.push(fixture);
    let directory = base;
    for (const segment of [checkoutName, 'tests', 'sim', 'production', 'one-shot']) {
      directory = join(directory, segment);
      mkdirSync(directory);
      fixture.directories.push(directory);
    }
    const checkout = join(base, checkoutName);
    const fragment = join(directory, 'root-fragment.mjs');
    fixture.files.push(fragment);
    writeFileSync(fragment, code, { flag: 'wx' });
    console.info(JSON.stringify({ rootFragment: { entry, fragment, checkout, code } }));
    const imported: Promise<unknown> = import(/* @vite-ignore */ fragment);
    fixture.imports.push(imported);
    const outcome = await imported.then(
      value => ({ value, error: null }),
      (error: unknown) => ({ value: null, error })
    );
    console.info(JSON.stringify({ rootFragmentError: outcome.error === null ? null : String(outcome.error) }));
    expect(outcome.error).toBeNull();
    expect(outcome.value).toMatchObject({ root: checkout });
    expect(Object.keys(outcome.value as object)).toEqual(['root']);
  });

  it.each([
    'const root = process.cwd();',
    "const root = await import('@/stores/playerStore');",
    'const root = resolve(sideEffect());',
    'const root = resolve(`${sideEffect()}`);',
    "const root = resolve<import('./native')>('/tmp');",
    "const root = new URL<import('./native')>('file:///tmp');",
    "const root = resolve('/tmp'); const root = dirname('/tmp');",
    'const somethingElse = 1;'
  ])('refuses a fragment that is not one filesystem-only initializer: %s', text => {
    expect(() => rootFragment(text)).toThrow('Expected exactly one filesystem-only root initializer');
  });
});
