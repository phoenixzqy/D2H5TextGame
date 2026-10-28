/** Source-only preflight: never import the repository modules being inspected. */
import ts from 'typescript';
import { existsSync, lstatSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isBuiltin } from 'node:module';

const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.mts', '.json', '.css'];
const normalized = path => path.replaceAll('\\', '/');
const property = (node, name) => node.properties.find(p => p.name?.getText().replaceAll(/['"]/g, '') === name);
const literal = node => node && ts.isStringLiteralLike(node) ? node.text : undefined;

// Model only the configuration forms used here. New startup/discovery semantics
// require an explicit audit rather than silently inheriting Vitest defaults.
function configObject(node, allowed, context) {
  if (!node || !ts.isObjectLiteralExpression(node)) throw new Error(`Unresolved ${context}`);
  const keys = new Set();
  for (const entry of node.properties) {
    if (!ts.isPropertyAssignment(entry) ||
      (!ts.isIdentifier(entry.name) && !ts.isStringLiteral(entry.name)))
      throw new Error(`Unresolved/computed ${context} key`);
    const key = entry.name.text;
    if (keys.has(key)) throw new Error(`Duplicate ${context} key: ${key}`);
    if (!allowed.includes(key)) throw new Error(`Unsupported ${context} key: ${key}`);
    keys.add(key);
  }
  return node;
}

function checkAlias(config, ast) {
  const resolveNode = property(config, 'resolve')?.initializer;
  if (!resolveNode) return;
  const resolution = configObject(resolveNode, ['alias'], 'resolution');
  let aliases = property(resolution, 'alias')?.initializer;
  if (aliases && ts.isIdentifier(aliases)) {
    const name = aliases.text;
    const declarations = ast.statements.filter(ts.isVariableStatement)
      .filter(statement => statement.declarationList.flags & ts.NodeFlags.Const)
      .flatMap(statement => [...statement.declarationList.declarations])
      .filter(declaration => ts.isIdentifier(declaration.name) && declaration.name.text === name);
    aliases = declarations.length === 1 ? declarations[0].initializer : undefined;
  }
  const alias = configObject(aliases, ['@'], 'alias');
  const target = property(alias, '@')?.initializer;
  if (!target || !ts.isCallExpression(target) || target.expression.getText(ast) !== 'path.resolve' ||
    target.arguments.length !== 2 || target.arguments[0].getText(ast) !== '__dirname' ||
    literal(target.arguments[1]) !== './src')
    throw new Error('Unsupported alias: expected @ -> repository src');
}

function strings(node) {
  if (literal(node) !== undefined) return [literal(node)];
  if (node && ts.isArrayLiteralExpression(node) && node.elements.every(e => literal(e) !== undefined))
    return node.elements.map(literal);
  throw new Error('Unresolved literal discovery/glob configuration');
}

function expand(pattern) {
  const match = /\{([^{}]+)\}/.exec(pattern);
  return match ? match[1].split(',').flatMap(part =>
    expand(pattern.slice(0, match.index) + part + pattern.slice(match.index + match[0].length))) : [pattern];
}

// Resolve only lexical const-string bindings, never environment values or calls.
function boundLiteral(node) {
  if (literal(node) !== undefined) return literal(node);
  if (!node || !ts.isIdentifier(node)) return undefined;
  const binds = name => ts.isIdentifier(name) ? name.text === node.text :
    name.elements.some(element => ts.isBindingElement(element) && binds(element.name));
  for (let scope = node.parent; scope; scope = scope.parent) {
    // A nested var can shadow an outer const anywhere in a function. Do not
    // guess across function boundaries without a complete binding analysis.
    if (ts.isFunctionLike(scope)) return undefined;
    if (ts.isCatchClause(scope) && scope.variableDeclaration && binds(scope.variableDeclaration.name)) return undefined;
    if ((ts.isForStatement(scope) || ts.isForInStatement(scope) || ts.isForOfStatement(scope)) &&
      scope.initializer && ts.isVariableDeclarationList(scope.initializer) &&
      scope.initializer.declarations.some(declaration => binds(declaration.name))) return undefined;
    if (!ts.isBlock(scope) && !ts.isSourceFile(scope)) continue;
    for (const statement of scope.statements) {
      if (!ts.isVariableStatement(statement)) continue;
      for (const declaration of statement.declarationList.declarations) {
        if (!binds(declaration.name)) continue;
        return ts.isIdentifier(declaration.name) && statement.declarationList.flags & ts.NodeFlags.Const
          ? literal(declaration.initializer) : undefined;
      }
    }
  }
  return undefined;
}

/** Inspect default projects and their transitive runtime source graph as data. */
export function auditUnitTestBoundary(rootInput) {
  const root = resolve(rootInput), errors = [], seen = new Set(), tests = new Set();
  const label = file => normalized(relative(root, file));
  const forbidden = file => {
    const name = label(file);
    return name.startsWith('tests/sim/') && !name.startsWith('tests/sim/contracts/');
  };
  function safe(file) {
    if (forbidden(file)) throw new Error(`forbidden simulation source: ${label(file)}`);
    if (!label(file) || label(file).startsWith('../')) throw new Error(`Source escapes repository: ${file}`);
    if (lstatSync(file).isSymbolicLink() || realpathSync(file) !== file)
      throw new Error(`Source symlink/escape: ${label(file)}`);
  }
  function source(file) {
    safe(file);
    const ast = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    if (ast.parseDiagnostics.length) throw new Error(`Unresolved source syntax: ${label(file)}`);
    return ast;
  }
  const packagePath = resolve(root, 'package.json');
  if (existsSync(packagePath)) safe(packagePath);
  const manifest = existsSync(packagePath) ? JSON.parse(readFileSync(packagePath, 'utf8')) : {};
  const packages = new Set(Object.keys({ ...manifest.dependencies, ...manifest.devDependencies }));
  function discover() {
    const workspace = source(resolve(root, 'vitest.workspace.ts'));
    const exported = workspace.statements.find(ts.isExportAssignment)?.expression;
    const projects = exported && ts.isCallExpression(exported) ? exported.arguments[0] : undefined;
    if (!projects || !ts.isArrayLiteralExpression(projects)) throw new Error('Unresolved default workspace');
    for (const project of projects.elements) {
      configObject(project, ['plugins', 'resolve', 'test'], 'default project');
      checkAlias(project, workspace);
      const config = configObject(property(project, 'test')?.initializer,
        ['name', 'globals', 'environment', 'include', 'exclude', 'setupFiles', 'pool', 'isolate'], 'default test');
      const environment = property(config, 'environment')?.initializer;
      if (environment && !['node', 'jsdom'].includes(literal(environment)))
        throw new Error('Unsupported test environment');
      const includes = strings(property(config, 'include')?.initializer).flatMap(expand);
      const excludesNode = property(config, 'exclude')?.initializer;
      const excludes = excludesNode ? strings(excludesNode).flatMap(expand) : [];
      for (const pattern of includes) {
        if (!pattern.startsWith('src/') && !pattern.startsWith('tests/sim/contracts/'))
          throw new Error(`forbidden default discovery: ${pattern}`);
      }
      for (const file of ts.sys.readDirectory(root, extensions, excludes, includes)) tests.add(resolve(file));
      const setup = property(config, 'setupFiles')?.initializer;
      if (setup) for (const file of strings(setup)) inspect(resolve(root, file), 'setupFiles');
    }
    const rootConfig = source(resolve(root, 'vitest.config.ts'));
    const expression = rootConfig.statements.find(ts.isExportAssignment)?.expression;
    const config = configObject(expression && ts.isCallExpression(expression) ? expression.arguments[0] : undefined,
      ['plugins', 'resolve', 'test'], 'root configuration');
    checkAlias(config, rootConfig);
    configObject(property(config, 'test')?.initializer, ['poolOptions', 'exclude', 'coverage'], 'root test');
    inspect(resolve(root, 'vitest.config.ts'), 'configuration');
    inspect(resolve(root, 'vitest.workspace.ts'), 'configuration');
    for (const file of tests) inspect(file, 'test entrypoint');
  }
  function inspect(file, via) {
    if (seen.has(file)) return;
    try {
      safe(file);
      seen.add(file);
      if (!/\.[cm]?[jt]sx?$/.test(file)) return;
      const ast = source(file);
      function edge(specifier, node, glob = false) {
        try {
          const specs = glob ? strings(specifier) : [boundLiteral(specifier)];
          if (specs.some(spec => spec === undefined)) throw new Error('Unresolved runtime loading');
          for (const spec of specs) {
            if (!spec.startsWith('.') && !spec.startsWith('@/')) {
              const packageName = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
              if (!isBuiltin(spec) && !packages.has(packageName) && spec !== 'virtual:pwa-register')
                throw new Error(`Unresolved runtime package: ${spec}`);
              continue;
            }
            const base = (spec.startsWith('@/') ? resolve(root, 'src', spec.slice(2)) : resolve(dirname(file), spec)).split('?')[0];
            if (forbidden(base)) throw new Error(`forbidden simulation source: ${label(base)}`);
            if (glob) {
              const matches = ts.sys.readDirectory(root, extensions, ['**/node_modules/**'], expand(base));
              if (!matches.length) throw new Error(`Unresolved runtime glob: ${spec}`);
              for (const match of matches) inspect(resolve(match), label(file));
              continue;
            }
            const candidates = [base, ...extensions.map(ext => base + ext),
              ...extensions.map(ext => resolve(base, 'index' + ext))];
            const found = candidates.find(path => existsSync(path) &&
              (lstatSync(path).isFile() || lstatSync(path).isSymbolicLink()));
            if (!found) throw new Error(`Unresolved runtime import: ${spec}`);
            inspect(found, label(file));
          }
        } catch (error) {
          errors.push(`${label(file)}:${ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1}: ${error.message}`);
        }
      }
      function scan(node) {
        if (ts.isImportDeclaration(node)) {
          const clause = node.importClause;
          const typeOnly = clause && (clause.isTypeOnly || (!clause.name && clause.namedBindings &&
            ts.isNamedImports(clause.namedBindings) && clause.namedBindings.elements.length > 0 &&
            clause.namedBindings.elements.every(e => e.isTypeOnly)));
          if (!typeOnly) edge(node.moduleSpecifier, node);
        } else if (ts.isExportDeclaration(node) && node.moduleSpecifier && !node.isTypeOnly &&
          (!node.exportClause || !ts.isNamedExports(node.exportClause) || node.exportClause.elements.length === 0 ||
            node.exportClause.elements.some(e => !e.isTypeOnly))) {
          edge(node.moduleSpecifier, node);
        } else if (ts.isCallExpression(node)) {
          const expression = node.expression;
          if (expression.kind === ts.SyntaxKind.ImportKeyword ||
            (ts.isIdentifier(expression) && expression.text === 'require') ||
            (ts.isPropertyAccessExpression(expression) &&
              ['importActual', 'importMock', 'mock', 'doMock'].includes(expression.name.text)))
            edge(node.arguments[0], node);
          if (ts.isPropertyAccessExpression(expression) && ts.isMetaProperty(expression.expression) &&
            ['glob', 'globEager'].includes(expression.name.text)) edge(node.arguments[0], node, true);
        }
        ts.forEachChild(node, scan);
      }
      scan(ast);
    } catch (error) { errors.push(`${via} -> ${label(file)}: ${error.message}`); }
  }
  try { discover(); } catch (error) { errors.push(error.message); }
  return { testFiles: [...tests].map(label).sort(), files: [...seen].map(label).sort(), errors };
}

/** Stop before Vitest loads any default test when the boundary is unresolved. */
export function assertUnitTestBoundary(root) {
  const result = auditUnitTestBoundary(root);
  if (result.errors.length) throw new Error(`[unit-test-boundary] ${result.errors.join('\n')}`);
  return result;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = assertUnitTestBoundary(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
    console.log(`[unit-test-boundary] OK: ${result.testFiles.length} tests, ${result.files.length} source modules`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
