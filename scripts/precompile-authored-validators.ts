import type { Plugin } from 'vite';
import Ajv2020, { type AnySchema } from 'ajv/dist/2020';
import standalone from 'ajv/dist/standalone';
import { build } from 'esbuild';
import path from 'node:path';

const publicId = 'virtual:d2-authored-validators';
export const compiledAuthoredValidatorsId = '\0' + publicId;
const firstErrorPublicId = 'virtual:d2-authored-first-error-validators';
export const compiledFirstErrorAuthoredValidatorsId = '\0' + firstErrorPublicId;
const compiledIds = [compiledAuthoredValidatorsId, compiledFirstErrorAuthoredValidatorsId];

/** Read the registry's current JSON imports without importing any engine or stores. */
async function generate(root: string, registryPath: string, firstError: boolean): Promise<{ code: string; watchFiles: string[] }> {
  const registryBuild = await build({ absWorkingDir: root, entryPoints: [registryPath],
    bundle: true, format: 'esm', platform: 'node', write: false, metafile: true });
  if (registryBuild.outputFiles.length !== 1) throw new Error('Expected one authored schema registry');
  const registryCode = registryBuild.outputFiles.map(file => file.text).join('');
  const registry = await import('data:text/javascript;base64,' + Buffer.from(registryCode).toString('base64')) as {
    authoredSchemas: Record<string, AnySchema>;
    authoredFirstErrorSchemas: Record<string, AnySchema>
  };
  const registryName = firstError ? 'authoredFirstErrorSchemas' : 'authoredSchemas';
  const schemas = registry[registryName];
  const names = Object.keys(schemas);
  if (!names.length || names.some(name => !/^[A-Za-z_$][\w$]*$/.test(name))) {
    throw new Error('Invalid authored validator export names');
  }
  const ajv = new Ajv2020({ strict: true, ...(firstError ? {} : { allErrors: true }),
    code: { source: true, esm: true } });
  for (const [name, schema] of Object.entries(schemas)) ajv.addSchema(schema, name);
  const validators = standalone(ajv, Object.fromEntries(names.map(name => [name, name])));
  // Keep the original module's schema objects as metadata, including wrapper identity.
  const metadata = `\nimport { ${registryName} as __d2AuthoredSchemas } from ${JSON.stringify(registryPath)};\n` +
    names.map(name => `${name}.schema = __d2AuthoredSchemas.${name};`).join('\n');
  const compiled = await build({ stdin: { contents: validators + metadata, resolveDir: root,
    sourcefile: 'compiled-authored-validators.js' }, external: [registryPath], bundle: true,
    format: 'esm', platform: 'browser', write: false, minify: true, target: 'es2022' });
  if (compiled.outputFiles.length !== 1) throw new Error('Expected one authored validator module');
  return { code: compiled.outputFiles.map(file => file.text).join(''),
    watchFiles: Object.keys(registryBuild.metafile.inputs).map(file => path.resolve(root, file)) };
}

/** Precompile the bounded authored registry; ordinary SSR retains caller-owned Ajv. */
export function precompileAuthoredValidators(): Plugin {
  let root: string, sourcePath: string, registryPath: string, schemaRoot: string;
  const compiled = new Map<string, ReturnType<typeof generate>>();
  const relevant = (id: string): boolean => id === registryPath || id === sourcePath ||
    id.startsWith(schemaRoot + path.sep);
  return {
    name: 'd2-precompile-authored-validators', enforce: 'pre',
    configResolved(config) {
      root = config.root;
      sourcePath = path.resolve(root, 'src/data/authored-validators.ts');
      registryPath = path.resolve(root, 'src/data/authored-schemas.ts');
      schemaRoot = path.resolve(root, 'src/data/schema');
    },
    buildStart() {
      // Directory watches in load become module imports in Vite development.
      // Keep watching failed JSON edits without adding a directory dependency.
      this.addWatchFile(schemaRoot);
    },
    resolveId(id) {
      if (id === publicId) return compiledAuthoredValidatorsId;
      if (id === firstErrorPublicId) return compiledFirstErrorAuthoredValidatorsId;
    },
    load(id) {
      if (!compiledIds.includes(id)) return;
      this.addWatchFile(registryPath);
      let generated = compiled.get(id);
      if (!generated) {
        generated = generate(root, registryPath, id === compiledFirstErrorAuthoredValidatorsId);
        compiled.set(id, generated);
      }
      return generated.then(result => {
        for (const file of result.watchFiles) this.addWatchFile(file);
        return result.code;
      });
    },
    transform(_code, id, options) {
      if (id.split('?')[0] !== sourcePath || options?.ssr) return;
      return { code: `import * as compiled from '${publicId}';
import * as firstError from '${firstErrorPublicId}';
export function compileAuthoredValidator(_ajv, name) { return compiled[name]; }
export function compileFirstErrorAuthoredValidator(_ajv, name) { return firstError[name]; }`, map: null };
    },
    watchChange(id) { if (relevant(id)) compiled.clear(); },
    handleHotUpdate(context) {
      if (!relevant(context.file)) return;
      compiled.clear();
      for (const id of compiledIds) {
        const module = context.server.moduleGraph.getModuleById(id);
        if (module) context.server.moduleGraph.invalidateModule(module);
      }
      context.server.ws.send({ type: 'full-reload' });
      return [];
    }
  };
}
