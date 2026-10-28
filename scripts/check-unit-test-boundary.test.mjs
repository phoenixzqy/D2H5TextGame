import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { auditUnitTestBoundary } from './check-unit-test-boundary.mjs';

function fixture(files, action, include = 'src/**/*.test.ts') {
  const root = mkdtempSync(join(tmpdir(), 'd2h5-unit-boundary-'));
  try {
    const sources = {
      'vitest.config.ts': 'export default defineConfig({test:{}});',
      'vitest.workspace.ts': `export default defineWorkspace([{test:{include:['${include}']}}]);`,
      ...files
    };
    for (const [file, source] of Object.entries(sources)) {
      const path = join(root, file);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, source);
    }
    action(root, auditUnitTestBoundary(root));
  } finally {
    rmSync(root, { recursive: true, force: true });
    assert.equal(existsSync(root), false);
  }
}

test('rejects closed diagnostic default discovery without evaluating its source', () => {
  fixture({ 'tests/sim/production/probe.test.ts': 'throw Error("never evaluate");' },
    (_root, result) => assert.match(result.errors.join('\n'), /forbidden.*production/),
    'tests/sim/production/**/*.test.ts');
});

test('follows aliases, re-exports and literal dynamic imports to a closed runner', () => {
  fixture({
    'src/probe.test.ts': "import '@/bridge';",
    'src/bridge.ts': "export * from './nested';",
    'src/nested.ts': "void import('../tests/sim/production/runner');",
    'tests/sim/production/runner.ts': 'throw Error("never evaluate");'
  }, (_root, result) => assert.match(result.errors.join('\n'), /forbidden.*production\/runner/));
});

test('erases explicit type imports and resolves local const imports without executing modules', () => {
  fixture({
    'src/probe.test.ts': "import type { X } from '../tests/sim/production/policy'; const path='./safe'; void import(path);",
    'src/safe.ts': 'throw Error("source data only");'
  }, (_root, result) => {
    assert.deepEqual(result.errors, []);
    assert.ok(result.files.includes('src/safe.ts'));
    assert.ok(!result.files.some(file => file.includes('production')));
  });
});

test('refuses unresolved imports and unknown or shadowed dynamic loading', () => {
  for (const source of ["void import('./missing');", 'void import(process.env.MODULE);',
    "const path='./safe'; function run(path: string) { return import(path); }"]) {
    fixture({ 'src/probe.test.ts': source, 'src/safe.ts': '' },
      (_root, result) => assert.ok(result.errors.length > 0));
  }
});

test('audits setup files before tests and rejects nonliteral discovery', () => {
  fixture({
    'vitest.workspace.ts': "export default defineWorkspace([{test:{include:['src/**/*.test.ts'],setupFiles:'src/setup.ts'}}]);",
    'src/probe.test.ts': '', 'src/setup.ts': "require('../tests/sim/production/policy');"
  }, (_root, result) => assert.match(result.errors.join('\n'), /forbidden/));
  fixture({ 'vitest.workspace.ts': 'export default defineWorkspace(getProjects());' },
    (_root, result) => assert.ok(result.errors.length > 0));
});

test('resolves literal JSON glob arrays and rejects unresolved glob expressions', () => {
  fixture({
    'src/probe.test.ts': "import.meta.glob(['./data/*.json'],{eager:true});",
    'src/data/one.json': '{}'
  }, (_root, result) => assert.deepEqual(result.errors, []));
  fixture({ 'src/probe.test.ts': 'import.meta.glob(process.env.GLOB);' },
    (_root, result) => assert.ok(result.errors.length > 0));
});

test('empty imports and re-exports still execute their referenced modules', () => {
  for (const statement of ["import {} from '../tests/sim/production/runner';",
    "export {} from '../tests/sim/production/runner';"]) {
    fixture({ 'src/probe.test.ts': statement },
      (_root, result) => assert.match(result.errors.join('\n'), /forbidden/));
  }
});

test('loop and destructured parameter bindings cannot borrow an outer literal', () => {
  for (const statement of [
    "const path='./safe'; for (const path of process.argv) { void import(path); }",
    "const path='./safe'; function run({path}: {path:string}) { return import(path); }"])
    fixture({ 'src/probe.test.ts': statement, 'src/safe.ts': '' },
      (_root, result) => assert.ok(result.errors.length > 0));
});

test('does not treat unknown bare specifiers as trusted installed packages', () => {
  fixture({ 'src/probe.test.ts': "import 'tests/sim/production/runner';" },
    (_root, result) => assert.ok(result.errors.length > 0));
});

test('refuses symlinked modules even when the target is otherwise allowed', () => {
  fixture({ 'src/probe.test.ts': '', 'src/safe.ts': '' }, (root) => {
    symlinkSync(join(root, 'src/safe.ts'), join(root, 'src/link.ts'));
    writeFileSync(join(root, 'src/probe.test.ts'), "import './link';");
    assert.match(auditUnitTestBoundary(root).errors.join('\n'), /symlink/);
  });
});

test('follows mock and doMock specifiers even with a factory', () => {
  for (const statement of [
    "vi.mock('../tests/sim/production/runner');",
    "vi.doMock('../tests/sim/production/runner', async importOriginal => importOriginal());"
  ]) fixture({ 'src/probe.test.ts': statement },
    (_root, result) => assert.match(result.errors.join('\n'), /forbidden/));
});

test('rejects unsupported startup, discovery and resolution configuration', () => {
  for (const source of [
    "export default defineWorkspace([{test:{include:['src/**/*.test.ts'],globalSetup:'tests/sim/production/runner.ts'}}]);",
    "export default defineWorkspace([{test:{include:['src/**/*.test.ts'],includeSource:['tests/sim/production/*.ts']}}]);",
    "export default defineWorkspace([{root:'tests/sim/production',test:{include:['src/**/*.test.ts']}}]);",
    "export default defineWorkspace([{test:{dir:'tests/sim/production',include:['src/**/*.test.ts']}}]);",
    "export default defineWorkspace([{resolve:{alias:{'@':'./tests/sim/production'}},test:{include:['src/**/*.test.ts']}}]);"
  ]) fixture({ 'vitest.workspace.ts': source, 'src/probe.test.ts': '' },
    (_root, result) => assert.ok(result.errors.length > 0));
  fixture({ 'vitest.config.ts': "export default defineConfig({test:{globalSetup:'tests/sim/production/runner.ts'}});" },
    (_root, result) => assert.ok(result.errors.length > 0));
});

test('rejects duplicate and computed configuration keys instead of choosing one', () => {
  for (const testConfig of [
    "include:['src/**/*.test.ts'],include:['tests/sim/production/**/*.test.ts']",
    "include:['src/**/*.test.ts'],['include']:['tests/sim/production/**/*.test.ts']"
  ]) fixture({ 'vitest.workspace.ts': `export default defineWorkspace([{test:{${testConfig}}}]);` },
    (_root, result) => assert.ok(result.errors.length > 0));
});

test('cannot borrow an outer literal past a function with a nested hoisted binding', () => {
  fixture({
    'src/probe.test.ts': "const path='./safe'; function run(){if(true){var path='../tests/sim/production/runner';}return import(path);}",
    'src/safe.ts': ''
  }, (_root, result) => assert.ok(result.errors.length > 0));
});
