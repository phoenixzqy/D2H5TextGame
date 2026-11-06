import type { Plugin } from 'vite';
import Ajv2020, { type AnySchema } from 'ajv/dist/2020';
import standalone from 'ajv/dist/standalone';
import { build } from 'esbuild';
import ts from 'typescript';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const publicId = 'virtual:d2-skill-validator';
export const compiledSkillValidatorId = '\0' + publicId;
const errorKeys = ['instancePath', 'schemaPath', 'keyword', 'params', 'message'];

/** Share only standard Ajv error literals, preserving argument and property order. */
function shareErrorConstructors(code: string): string {
  const source = ts.createSourceFile('generated.js', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const edits: { start: number; end: number; text: string }[] = [];
  const factory = '__d2SkillSchemaError';
  const visit = (node: ts.Node): void => {
    if (ts.isIdentifier(node) && node.text === factory) throw new Error('Generated error helper name collision');
    if (ts.isObjectLiteralExpression(node) && node.properties.length === errorKeys.length) {
      const args: string[] = [];
      let index = 0;
      for (const property of node.properties) {
        if (!ts.isPropertyAssignment(property) ||
          (!ts.isIdentifier(property.name) && !ts.isStringLiteral(property.name)) ||
          property.name.text !== errorKeys[index]) break;
        args.push(property.initializer.getText(source));
        index++;
      }
      if (args.length === errorKeys.length) {
        edits.push({ start: node.getStart(source), end: node.end, text: `${factory}(${args.join(',')})` });
        return;
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  let cursor = 0;
  const parts: string[] = [];
  for (const edit of edits.sort((a, b) => a.start - b.start)) {
    parts.push(code.slice(cursor, edit.start), edit.text);
    cursor = edit.end;
  }
  parts.push(code.slice(cursor));
  return `function ${factory}(instancePath,schemaPath,keyword,params,message){return {instancePath,schemaPath,keyword,params,message};}\n` + parts.join('');
}

/** Compile the original schema on Node; emit a self-contained browser ESM validator. */
async function generate(root: string, schemaPath: string): Promise<string> {
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8')) as AnySchema;
  const ajv = new Ajv2020({ strict: true, allErrors: true, code: { source: true, esm: true } });
  const code = shareErrorConstructors(standalone(ajv, ajv.compile(schema)));
  const result = await build({ stdin: { contents: code, resolveDir: root, sourcefile: 'compiled-skill-validator.js' },
    bundle: true, format: 'esm', platform: 'browser', write: false, minify: true, target: 'es2022' });
  if (result.outputFiles.length !== 1) throw new Error('Expected one compiled skill validator');
  return result.outputFiles.map(file => file.text).join('');
}

/** Remove first-use skill-schema compilation from browser startup, including development. */
export function precompileSkillValidator(): Plugin {
  let root: string, sourcePath: string, schemaPath: string;
  let compiled: Promise<string> | undefined;
  return {
    name: 'd2-precompile-skill-validator', enforce: 'pre',
    configResolved(config) {
      root = config.root;
      sourcePath = path.resolve(root, 'src/engine/skills/skill-validator.ts');
      schemaPath = path.resolve(root, 'src/data/schema/skill.schema.json');
    },
    resolveId(id) { return id === publicId ? compiledSkillValidatorId : undefined; },
    load(id) {
      if (id !== compiledSkillValidatorId) return;
      this.addWatchFile(schemaPath);
      compiled ??= generate(root, schemaPath);
      return compiled;
    },
    transform(_code, id, options) {
      if (id.split('?')[0] !== sourcePath || options?.ssr) return;
      this.addWatchFile(schemaPath);
      return { code: `import validate from '${publicId}';
import schema from ${JSON.stringify(schemaPath)};
validate.schema = schema;
export function createSkillValidator() { return validate; }`, map: null };
    },
    watchChange(id) { if (id === schemaPath) compiled = undefined; },
    handleHotUpdate(context) {
      if (context.file !== schemaPath) return;
      compiled = undefined;
      const module = context.server.moduleGraph.getModuleById(compiledSkillValidatorId);
      if (module) context.server.moduleGraph.invalidateModule(module);
      context.server.ws.send({ type: 'full-reload' });
      return [];
    }
  };
}
